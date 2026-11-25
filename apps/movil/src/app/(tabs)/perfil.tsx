import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@nanostores/react';
import { $user, DEGREES, MAX_TRUSTED_CONTACTS, authService, refreshMe, tokens, userService } from '@studate/shared';
import type { TrustedContact, UpdateMyProfile } from '@studate/shared';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Boton, Campo, Tarjeta } from '@/components/ui';
import { estilos } from '@/theme/estilos';

const CONTACTO_VACIO: TrustedContact = { name: '', email: '', phone: '' };

// Mi perfil en el móvil: el estudiante edita su Expediente (nombre, fecha de nacimiento, titulación,
// qué busca y bio) y sus contactos de confianza (opcionales, hasta 3), y cierra sesión. Sin foto: cambiarla
// necesita la galería del teléfono (una función nativa) y este sprint la app va sin funciones nativas; la
// foto se pone desde la web y aquí se ve
export default function Perfil() {
  const user = useStore($user);
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [degree, setDegree] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [bio, setBio] = useState('');
  const [contactos, setContactos] = useState<TrustedContact[]>([]);
  const [email, setEmail] = useState('');
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aviso, setAviso] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    userService
      .getMe()
      .then((me) => {
        setName(me.name);
        setBirthDate(me.birthDate ? me.birthDate.slice(0, 10) : '');
        setDegree(me.degree ?? '');
        setLookingFor(me.lookingFor ?? '');
        setBio(me.bio ?? '');
        setContactos(me.trustedContacts ?? []);
        setEmail(me.email);
        setPhoto(me.photo);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'No se ha podido cargar el perfil');
        setLoading(false);
      });
  }, []);

  const cambiarContacto = (i: number, campo: keyof TrustedContact, valor: string) =>
    setContactos((lista) => lista.map((c, j) => (j === i ? { ...c, [campo]: valor } : c)));

  const guardar = async () => {
    setError('');
    if (!name.trim()) {
      setError('Escribe tu nombre.');
      return;
    }
    if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      setError('La fecha de nacimiento va como año-mes-día, por ejemplo 2003-02-20.');
      return;
    }
    if (bio.length > 500) {
      setError('La bio no puede pasar de 500 caracteres.');
      return;
    }
    const payload: UpdateMyProfile = {
      name: name.trim(),
      bio: bio.trim(),
      ...(birthDate ? { birthDate } : {}),
      ...(degree ? { degree } : {}),
      ...(lookingFor.trim() ? { lookingFor: lookingFor.trim() } : {}),
      // Solo se envían los contactos con nombre y correo
      trustedContacts: contactos
        .filter((c) => c.name.trim() && c.email.trim())
        .map((c) => ({ name: c.name.trim(), email: c.email.trim(), ...(c.phone?.trim() ? { phone: c.phone.trim() } : {}) })),
    };
    setSaving(true);
    try {
      const me = await userService.updateMe(payload);
      refreshMe(me);
      setContactos(me.trustedContacts ?? []);
      setAviso('Cambios guardados.');
      setTimeout(() => setAviso(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se han podido guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={estilos.pantalla}>
      <ScrollView contentContainerStyle={estilos.cuerpo} keyboardShouldPersistTaps="handled">
        <View style={[estilos.fila, { justifyContent: 'space-between' }]}>
          <Text style={estilos.t1}>Mi perfil</Text>
          <Boton texto="Cerrar sesión" tipo="secundario" onPress={() => authService.logout()} style={{ minHeight: 38, paddingHorizontal: 14 }} />
        </View>

        {loading && <View style={styles.esqueleto} />}

        {!loading && user && (
          <>
            <Tarjeta>
              <View style={estilos.fila}>
                <Avatar user={{ name: name || user.name, photo }} tamano={72} />
                <View style={{ flex: 1 }}>
                  <Text style={estilos.t2}>{name || user.name}</Text>
                  <Text style={estilos.sua}>{email}</Text>
                  <Text style={[estilos.sua, { fontSize: 12 }]}>La foto se cambia desde la web.</Text>
                </View>
              </View>
            </Tarjeta>

            <Tarjeta>
              <Text style={estilos.et}>Mi Expediente</Text>
              <Campo label="Nombre" value={name} onChangeText={setName} />
              <Campo label="Fecha de nacimiento" placeholder="2003-02-20" ayuda="Año-mes-día." value={birthDate} onChangeText={setBirthDate} />
              <View style={{ gap: tokens.space.xs }}>
                <Text style={styles.label}>Titulación</Text>
                <View style={estilos.fila}>
                  {DEGREES.map((d) => (
                    <Pressable key={d} style={[styles.pastilla, degree === d && styles.pastillaSel]} onPress={() => setDegree(degree === d ? '' : d)}>
                      <Text style={[styles.pastillaTexto, degree === d && { color: tokens.color.blanco }]}>{d.replace('Grau en Enginyeria ', '')}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <Campo label="Qué busco" placeholder="Alguien con quien estudiar" maxLength={100} value={lookingFor} onChangeText={setLookingFor} />
              <Campo label="Bio" multiline maxLength={500} value={bio} onChangeText={setBio} style={{ minHeight: 90 }} ayuda={`${bio.length}/500`} />
            </Tarjeta>

            <Tarjeta>
              <Text style={estilos.et}>Contactos de confianza</Text>
              <Text style={estilos.sua}>Son opcionales: a quien avisamos si pulsas el botón de ayuda. Hasta {MAX_TRUSTED_CONTACTS}.</Text>
              {contactos.map((c, i) => (
                <View key={i} style={styles.contacto}>
                  <Campo label="Nombre" value={c.name} onChangeText={(v) => cambiarContacto(i, 'name', v)} />
                  <Campo label="Correo" autoCapitalize="none" keyboardType="email-address" value={c.email} onChangeText={(v) => cambiarContacto(i, 'email', v)} />
                  <Campo label="Teléfono (opcional)" keyboardType="phone-pad" value={c.phone ?? ''} onChangeText={(v) => cambiarContacto(i, 'phone', v)} />
                  <Pressable style={estilos.fila} onPress={() => setContactos((lista) => lista.filter((_, j) => j !== i))}>
                    <Ionicons name="trash-outline" size={18} color={tokens.color.ko} />
                    <Text style={{ color: tokens.color.ko, fontWeight: '600' }}>Quitar</Text>
                  </Pressable>
                </View>
              ))}
              {contactos.length < MAX_TRUSTED_CONTACTS && (
                <Boton texto="Añadir contacto" tipo="secundario" onPress={() => setContactos((lista) => [...lista, { ...CONTACTO_VACIO }])} />
              )}
            </Tarjeta>

            {error ? <Text style={estilos.aviso}>{error}</Text> : null}
            {aviso ? <Text style={styles.ok}>{aviso}</Text> : null}
            <Boton texto={saving ? 'Guardando…' : 'Guardar cambios'} onPress={guardar} disabled={saving} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  esqueleto: {
    height: 200,
    borderRadius: tokens.radius.tarjeta,
    backgroundColor: tokens.color.esqueleto,
  },
  label: {
    color: tokens.color.noche,
    fontSize: 13,
    fontWeight: '700',
  },
  pastilla: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: tokens.radius.pastilla,
    borderWidth: 1.5,
    borderColor: tokens.color.bordeCampo,
    backgroundColor: tokens.color.blanco,
  },
  pastillaSel: {
    backgroundColor: tokens.color.azul,
    borderColor: tokens.color.azul,
  },
  pastillaTexto: {
    color: tokens.color.noche,
    fontSize: 13,
    fontWeight: '600',
  },
  contacto: {
    gap: tokens.space.sm,
    padding: tokens.space.md,
    borderWidth: 1,
    borderColor: tokens.color.borde,
    borderRadius: tokens.radius.campo,
  },
  ok: {
    backgroundColor: tokens.color.okSuave,
    color: tokens.color.okTexto,
    borderRadius: tokens.radius.campo,
    padding: tokens.space.md,
    fontSize: 14,
    overflow: 'hidden',
  },
});
