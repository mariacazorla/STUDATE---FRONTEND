import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@nanostores/react';
import { $user, dateService, empezoEl, isMyTurn, otherUser, remainingMs, restanteCorto, tokens } from '@studate/shared';
import type { StudateDate } from '@studate/shared';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Boton, Chip, Tarjeta, Vacio } from '@/components/ui';
import { useNow } from '@/hooks/useChat';
import { estilos } from '@/theme/estilos';

type Estado = 'cargando' | 'normal' | 'error';
type Bandeja = 'pending' | 'ongoing';

// Mis Dates en el móvil: las bandejas de Pendientes y En curso con su reloj, como en la web. La lista
// se vuelve a pedir cada vez que la pestaña vuelve a primer plano (useFocusEffect), para ver los cambios
// que hayan pasado en el chat
export default function Dates() {
  const me = useStore($user);
  const router = useRouter();
  const now = useNow();
  const [estado, setEstado] = useState<Estado>('cargando');
  const [dates, setDates] = useState<StudateDate[]>([]);
  const [bandeja, setBandeja] = useState<Bandeja>('pending');

  const load = useCallback(async () => {
    try {
      const page = await dateService.getMyDates();
      setDates(page.items);
      setBandeja(page.items.some((d) => d.status === 'pending') ? 'pending' : 'ongoing');
      setEstado('normal');
    } catch {
      setEstado('error');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!me) {
    return null;
  }

  const pendientes = dates.filter((d) => d.status === 'pending');
  const enCurso = dates.filter((d) => d.status === 'ongoing');
  const visibles = bandeja === 'pending' ? pendientes : enCurso;
  const miTurno = pendientes.filter((d) => isMyTurn(d, me._id));
  const masUrgente = miTurno.reduce<number | null>((min, d) => {
    const ms = remainingMs(d, now);
    return min === null || ms < min ? ms : min;
  }, null);

  return (
    <SafeAreaView style={estilos.pantalla}>
      <ScrollView contentContainerStyle={estilos.cuerpo}>
        <Text style={estilos.t1}>Mis Dates</Text>

        {estado === 'cargando' && <View style={styles.esqueleto} />}

        {estado === 'error' && (
          <Vacio titulo="No hemos podido cargar tus Dates." texto="Tus conversaciones están a salvo. Vuelve a probar.">
            <Boton texto="Reintentar" onPress={load} />
          </Vacio>
        )}

        {estado === 'normal' && pendientes.length + enCurso.length === 0 && (
          <Vacio titulo="Aún no tienes Dates." texto="Un Date se abre solo cuando tú y otra persona os ponéis A+ en La Orla.">
            <Boton texto="Ir a La Orla" onPress={() => router.push('/orla')} />
          </Vacio>
        )}

        {estado === 'normal' && pendientes.length + enCurso.length > 0 && (
          <>
            <View style={styles.bandejas}>
              {(['pending', 'ongoing'] as Bandeja[]).map((b) => {
                const activa = bandeja === b;
                return (
                  <Pressable key={b} style={[styles.bandeja, activa && styles.bandejaActiva]} onPress={() => setBandeja(b)}>
                    <Ionicons name={b === 'pending' ? 'flame-outline' : 'heart-outline'} size={16} color={activa ? tokens.color.blanco : tokens.color.noche} />
                    <Text style={[styles.bandejaTexto, activa && { color: tokens.color.blanco }]}>{b === 'pending' ? 'Pendientes' : 'En curso'}</Text>
                    <View style={[styles.contador, activa && { backgroundColor: tokens.color.blanco }]}>
                      <Text style={[styles.contadorTexto, activa && { color: tokens.color.azul }]}>{b === 'pending' ? pendientes.length : enCurso.length}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {miTurno.length > 0 && masUrgente !== null && (
              <View style={styles.avisador}>
                <Ionicons name="time-outline" size={20} color={tokens.color.rosaBoton} />
                <Text style={[estilos.texto, { flex: 1, fontSize: 14 }]}>
                  Tienes <Text style={{ fontWeight: '800' }}>{miTurno.length === 1 ? '1 Date' : `${miTurno.length} Dates`}</Text> esperando que escribas tú. Quedan{' '}
                  <Text style={{ fontWeight: '800' }}>{restanteCorto(masUrgente)}</Text>.
                </Text>
              </View>
            )}

            {visibles.length === 0 ? (
              <Vacio
                titulo={bandeja === 'pending' ? 'No tienes Dates pendientes.' : 'No tienes Dates en curso.'}
                texto={bandeja === 'pending' ? 'Cuando tú y otra persona os pongáis A+ en La Orla, el Date aparecerá aquí.' : 'Un Date pasa a En curso con el primer mensaje del chat.'}
              />
            ) : (
              visibles.map((date) => {
                const otro = otherUser(date, me._id);
                const nombre = otro.name.split(' ')[0];
                return (
                  <Pressable key={date._id} onPress={() => router.push(`/dates/${date._id}`)}>
                    <Tarjeta style={styles.conv}>
                      <Avatar user={otro} tamano={44} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={estilos.t2}>{nombre}</Text>
                        <Text style={estilos.sua} numberOfLines={1}>
                          {date.status === 'pending'
                            ? isMyTurn(date, me._id)
                              ? 'Te toca escribir a ti'
                              : `Empieza ${nombre}`
                            : date.startedAt
                              ? `Empezó ${empezoEl(date.startedAt, now)}`
                              : 'En curso'}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        {date.status === 'pending' && (
                          <View style={estilos.fila}>
                            <Ionicons name="time-outline" size={13} color={tokens.color.rosaBoton} />
                            <Text style={styles.reloj}>{restanteCorto(remainingMs(date, now))}</Text>
                          </View>
                        )}
                        {date.extended && <Chip texto="Prórroga" />}
                      </View>
                    </Tarjeta>
                  </Pressable>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  esqueleto: {
    height: 160,
    borderRadius: tokens.radius.tarjeta,
    backgroundColor: tokens.color.esqueleto,
  },
  bandejas: {
    flexDirection: 'row',
    gap: 6,
    padding: 5,
    backgroundColor: tokens.color.blanco,
    borderWidth: 1,
    borderColor: tokens.color.borde,
    borderRadius: tokens.radius.pastilla,
  },
  bandeja: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: tokens.radius.pastilla,
  },
  bandejaActiva: {
    backgroundColor: tokens.color.azul,
  },
  bandejaTexto: {
    color: tokens.color.noche,
    fontWeight: '700',
    fontSize: 14,
  },
  contador: {
    minWidth: 18,
    paddingHorizontal: 5,
    borderRadius: tokens.radius.pastilla,
    backgroundColor: tokens.color.rosaBoton,
    alignItems: 'center',
  },
  contadorTexto: {
    color: tokens.color.blanco,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 18,
  },
  avisador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: tokens.color.niebla,
    borderWidth: 1,
    borderColor: tokens.color.bordeVacio,
    borderRadius: tokens.radius.tarjeta,
  },
  conv: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  reloj: {
    color: tokens.color.rosaBoton,
    fontSize: 12,
    fontWeight: '600',
  },
});
