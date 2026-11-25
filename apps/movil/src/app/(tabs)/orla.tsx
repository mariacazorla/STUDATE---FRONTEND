import { useStore } from '@nanostores/react';
import { $user, orlaService, tokens } from '@studate/shared';
import type { Expediente, GradeValue, StudateDate } from '@studate/shared';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExpedienteCard } from '@/components/ExpedienteCard';
import type { ExpedienteCardHandle } from '@/components/ExpedienteCard';
import { Avatar, Boton, Vacio } from '@/components/ui';
import { estilos } from '@/theme/estilos';

type Estado = 'cargando' | 'normal' | 'vacio' | 'error';

// Lo que se acaba de votar, para poder deshacerlo y para el aviso
interface Votado {
  gradeId: string;
  user: Expediente;
  value: GradeValue;
}

// Cuánto tiempo hay para deshacer, en segundos (lo mismo que la API)
const UNDO_SECONDS = 10;

// La Orla en el móvil: la misma pantalla que en la web, con el mismo servicio compartido. Se vota
// deslizando la tarjeta (a la derecha A+, a la izquierda F) o con los botones; el A+ mutuo abre el
// Date (pantalla ¡Date!) y hay 10 segundos para deshacer
export default function Orla() {
  const me = useStore($user);
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>('cargando');
  const [user, setUser] = useState<Expediente | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [votado, setVotado] = useState<Votado | null>(null);
  const [segundos, setSegundos] = useState(0);
  const [match, setMatch] = useState<StudateDate | null>(null);
  const [aviso, setAviso] = useState('');
  const cardRef = useRef<ExpedienteCardHandle>(null);

  const loadNext = useCallback(async () => {
    setEstado('cargando');
    try {
      const res = await orlaService.next();
      setRemaining(res.remaining);
      if (res.user) {
        setUser(res.user);
        setEstado('normal');
      } else {
        setUser(null);
        setEstado('vacio');
      }
    } catch {
      setEstado('error');
    }
  }, []);

  useEffect(() => {
    loadNext();
  }, [loadNext]);

  // La cuenta atrás del aviso de deshacer: a los 10 s desaparece solo
  useEffect(() => {
    if (!votado) {
      return;
    }
    const fin = Date.now() + UNDO_SECONDS * 1000;
    setSegundos(UNDO_SECONDS);
    const timer = setInterval(() => {
      const quedan = Math.ceil((fin - Date.now()) / 1000);
      if (quedan <= 0) {
        clearInterval(timer);
        setVotado(null);
      } else {
        setSegundos(quedan);
      }
    }, 250);
    return () => clearInterval(timer);
  }, [votado]);

  const sinCupo = remaining <= 0;

  const handleVote = async (value: GradeValue) => {
    if (!user) {
      return;
    }
    const voted = user;
    try {
      const res = await orlaService.vote(voted._id, value);
      setRemaining(res.remaining);
      setVotado({ gradeId: res.grade._id, user: voted, value });
      if (res.date) {
        setMatch(res.date);
      }
    } catch (err) {
      setAviso(err instanceof Error ? err.message : 'No se ha podido votar');
      setTimeout(() => setAviso(''), 3000);
    }
    await loadNext();
  };

  const handleUndo = async () => {
    if (!votado) {
      return;
    }
    const anterior = votado;
    setVotado(null);
    try {
      const res = await orlaService.undo(anterior.gradeId);
      setRemaining(res.remaining);
      setUser(anterior.user);
      setEstado('normal');
      if (res.dateRemoved) {
        setMatch(null);
      }
    } catch (err) {
      setAviso(err instanceof Error ? err.message : 'Ya no se puede deshacer');
      setTimeout(() => setAviso(''), 3000);
    }
  };

  return (
    <SafeAreaView style={estilos.pantalla}>
      <View style={[estilos.cuerpo, { flex: 1 }]}>
        <View style={styles.cabecera}>
          <Text style={estilos.t1}>La Orla</Text>
          <View style={styles.cupo}>
            <Text style={styles.cupoTexto}>
              Te quedan <Text style={styles.cupoNumero}>{remaining}</Text> aprobados hoy
            </Text>
          </View>
        </View>

        {estado === 'cargando' && <View style={styles.esqueleto} />}

        {estado === 'error' && (
          <Vacio titulo="No hemos podido cargar La Orla." texto="No se ha perdido ningún voto. Comprueba la conexión y vuelve a probar.">
            <Boton texto="Reintentar" onPress={loadNext} />
          </Vacio>
        )}

        {estado === 'vacio' && (
          <Vacio titulo="Ya has visto a todo tu campus por hoy." texto="Cuando haya Expedientes nuevos, volverán a salir aquí.">
            <Boton texto="Ir a Mis Dates" tipo="secundario" onPress={() => router.push('/dates')} />
          </Vacio>
        )}

        {estado === 'normal' && user && (
          <View style={{ flex: 1, gap: tokens.space.lg }}>
            <ExpedienteCard key={user._id} ref={cardRef} user={user} onVote={handleVote} aPlusDisabled={sinCupo} />

            <View style={styles.acciones}>
              <View style={styles.votoEt}>
                <Pressable accessibilityLabel="Suspender" style={[styles.voto, { backgroundColor: tokens.color.ko }]} onPress={() => cardRef.current?.swipe('F')}>
                  <Text style={styles.votoTexto}>F</Text>
                </Pressable>
                <Text style={styles.votoLabel}>SUSPENSO</Text>
              </View>
              <Pressable
                accessibilityLabel="Deshacer"
                style={[styles.deshacer, !votado && { opacity: 0.4 }]}
                onPress={handleUndo}
                disabled={!votado}
              >
                <Text style={styles.deshacerTexto}>↶</Text>
              </Pressable>
              <View style={styles.votoEt}>
                <Pressable
                  accessibilityLabel="Aprobar"
                  style={[styles.voto, { backgroundColor: tokens.color.ok }, sinCupo && { opacity: 0.4 }]}
                  onPress={() => cardRef.current?.swipe('A+')}
                  disabled={sinCupo}
                >
                  <Text style={styles.votoTexto}>A+</Text>
                </Pressable>
                <Text style={styles.votoLabel}>APROBADO</Text>
              </View>
            </View>

            <Text style={[estilos.sua, { textAlign: 'center' }]}>
              {sinCupo ? 'Has llegado a los 30 A+ de hoy. Vuelve mañana.' : 'Desliza a la derecha para aprobar y a la izquierda para suspender.'}
            </Text>
          </View>
        )}

        {/* El aviso de deshacer, con la cuenta atrás */}
        {votado && (
          <View style={styles.toast}>
            <View style={styles.anillo}>
              <Text style={styles.anilloTexto}>{segundos}</Text>
            </View>
            <Text style={[estilos.texto, { flex: 1 }]}>
              Has {votado.value === 'A+' ? 'aprobado' : 'suspendido'} a {votado.user.name.split(' ')[0]}
            </Text>
            <Boton texto="Deshacer" tipo="secundario" onPress={handleUndo} style={{ minHeight: 38, paddingHorizontal: 14 }} />
          </View>
        )}

        {aviso ? <Text style={estilos.aviso}>{aviso}</Text> : null}
      </View>

      {/* ¡Tenéis Date!: a pantalla completa cuando un A+ forma un A+ mutuo */}
      <Modal visible={match !== null} animationType="slide" onRequestClose={() => setMatch(null)}>
        {match && me && (
          <View style={styles.match}>
            <Text style={styles.matchEt}>Aprobado mutuo</Text>
            <Text style={styles.matchTitulo}>¡TENÉIS DATE!</Text>
            <View style={styles.pareja}>
              {match.users.map((u) => (
                <View key={u._id} style={styles.parejaAvatar}>
                  <Avatar user={u} tamano={88} />
                </View>
              ))}
            </View>
            <Text style={styles.matchNombres}>{match.users.map((u) => u.name.split(' ')[0]).join(' y ')}</Text>
            <View style={styles.sorteo}>
              <Text style={estilos.et}>Sorteo del turno de palabra</Text>
              <Text style={[estilos.texto, { fontWeight: '800' }]}>
                {match.firstTurn === me._id
                  ? 'Te toca escribir primero a ti.'
                  : `Le toca escribir a ${match.users.find((u) => u._id === match.firstTurn)?.name.split(' ')[0] ?? 'la otra persona'}.`}
              </Text>
              <Text style={estilos.sua}>
                {match.firstTurn === me._id ? 'Tienes 24 horas para romper el hielo.' : 'Tú te quedas con las ganas hasta que escriba. Tiene 24 horas.'}
              </Text>
            </View>
            <Boton
              texto="Ir a Mis Dates"
              onPress={() => {
                setMatch(null);
                router.push('/dates');
              }}
              style={{ backgroundColor: tokens.color.maiz }}
            />
            <Boton texto="Seguir en La Orla" tipo="secundario" onPress={() => setMatch(null)} />
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cabecera: {
    gap: tokens.space.sm,
  },
  cupo: {
    alignSelf: 'flex-start',
    backgroundColor: tokens.color.blanco,
    borderWidth: 1,
    borderColor: tokens.color.borde,
    borderRadius: tokens.radius.pastilla,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cupoTexto: {
    color: tokens.color.noche,
    fontSize: 13.5,
  },
  cupoNumero: {
    color: tokens.color.azul,
    fontWeight: '800',
  },
  esqueleto: {
    width: '100%',
    aspectRatio: 3 / 4,
    maxHeight: 520,
    borderRadius: tokens.radius.tarjeta,
    backgroundColor: tokens.color.esqueleto,
  },
  acciones: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
  },
  votoEt: {
    alignItems: 'center',
    gap: 6,
  },
  voto: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: tokens.shadow.tarjeta,
  },
  votoTexto: {
    color: tokens.color.blanco,
    fontSize: 26,
    fontWeight: '900',
  },
  votoLabel: {
    color: tokens.color.gris,
    fontSize: 10.5,
    letterSpacing: 1,
  },
  deshacer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: tokens.color.bordeCampo,
    backgroundColor: tokens.color.blanco,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  deshacerTexto: {
    color: tokens.color.gris,
    fontSize: 22,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.md,
    backgroundColor: tokens.color.blanco,
    borderRadius: tokens.radius.tarjeta,
    borderWidth: 1,
    borderColor: tokens.color.borde,
    padding: tokens.space.md,
    boxShadow: tokens.shadow.tarjeta,
  },
  anillo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: tokens.color.azul,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anilloTexto: {
    color: tokens.color.azul,
    fontWeight: '700',
    fontSize: 13,
  },
  match: {
    flex: 1,
    backgroundColor: tokens.color.azul,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: tokens.space.lg,
  },
  matchEt: {
    color: tokens.color.noche,
    backgroundColor: tokens.color.maiz,
    borderRadius: tokens.radius.pastilla,
    paddingHorizontal: 12,
    paddingVertical: 5,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
  },
  matchTitulo: {
    color: tokens.color.blanco,
    fontSize: 48,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: tokens.color.rosaBoton,
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 0,
  },
  pareja: {
    flexDirection: 'row',
  },
  parejaAvatar: {
    borderWidth: 4,
    borderColor: tokens.color.blanco,
    borderRadius: 48,
    marginHorizontal: -8,
    backgroundColor: tokens.color.blanco,
  },
  matchNombres: {
    color: tokens.color.blanco,
    fontSize: 16,
    fontWeight: '600',
  },
  sorteo: {
    width: '100%',
    backgroundColor: tokens.color.blanco,
    borderRadius: tokens.radius.tarjeta,
    padding: tokens.space.lg,
    gap: tokens.space.xs,
  },
});
