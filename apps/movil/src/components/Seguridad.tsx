import { Ionicons } from '@expo/vector-icons';
import { ApiError, REPORT_REASON_LABELS, blockService, reportService, safetyAlertService, tokens, userService } from '@studate/shared';
import type { ReportReason, StudateDate } from '@studate/shared';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Boton } from '@/components/ui';
import { estilos } from '@/theme/estilos';

// La seguridad en el móvil: bloquear, mandar un parte y pedir ayuda, con las mismas ventanas que la web
// (en el móvil, hojas pegadas abajo). Los servicios son los del paquete compartido

// Una hoja que sube desde abajo, con el velo oscuro detrás: la "ventana" de la web en el móvil
export function Hoja({ visible, onClose, label, children }: { visible: boolean; onClose: () => void; label: string; children: ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.velo} onPress={onClose} accessibilityLabel={`Cerrar ${label}`}>
        <Pressable style={styles.hoja} onPress={() => undefined} accessibilityViewIsModal>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const MOTIVOS: { value: ReportReason; texto: string }[] = [
  { value: 'harassment', texto: 'Acoso o insultos' },
  { value: 'fake_profile', texto: REPORT_REASON_LABELS.fake_profile },
  { value: 'inappropriate', texto: REPORT_REASON_LABELS.inappropriate },
  { value: 'other', texto: 'Otro motivo' },
];

interface AccionesSeguridadProps {
  user: { _id: string; name: string };
  dateId?: string;
  // Bloqueado: el Date cerrado con el bloqueo (o null)
  onBlocked: (date: StudateDate | null) => void;
  onAviso: (texto: string) => void;
  // Cómo se pinta el botón: sobre la foto del Expediente o en la cabecera del chat
  variante: 'expediente' | 'chat';
}

type Abierta = 'ninguna' | 'menu' | 'reportar' | 'bloquear';

// El botón de los tres puntos con el menú de bloquear y mandar un parte
export function AccionesSeguridad({ user, dateId, onBlocked, onAviso, variante }: AccionesSeguridadProps) {
  const [abierta, setAbierta] = useState<Abierta>('ninguna');
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const nombre = user.name.split(' ')[0];

  const cerrar = () => {
    setAbierta('ninguna');
    setError('');
  };

  const enviarParte = async () => {
    if (!reason) {
      setError('Elige un motivo para poder enviar el parte.');
      return;
    }
    setEnviando(true);
    try {
      await reportService.create({ reported: user._id, reason, ...(dateId ? { date: dateId } : {}), ...(text.trim() ? { text: text.trim() } : {}) });
      cerrar();
      setReason('');
      setText('');
      onAviso('Parte enviado. El equipo de Studate lo revisará.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se ha podido enviar el parte.');
    } finally {
      setEnviando(false);
    }
  };

  const bloquear = async () => {
    setEnviando(true);
    try {
      const res = await blockService.block(user._id);
      cerrar();
      onAviso(`Has bloqueado a ${nombre}.`);
      onBlocked(res.date);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        cerrar();
        onAviso('Ya tenías bloqueada a esta persona.');
        onBlocked(null);
      } else {
        setError(err instanceof Error ? err.message : 'No se ha podido bloquear.');
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <Pressable accessibilityLabel="Más opciones" style={[styles.icb, variante === 'expediente' && styles.icbSobreFoto]} onPress={() => setAbierta('menu')}>
        <Ionicons name="ellipsis-horizontal" size={20} color={tokens.color.noche} />
      </Pressable>

      <Hoja visible={abierta === 'menu'} onClose={cerrar} label="más opciones">
        <Text style={estilos.et}>{nombre}</Text>
        <Pressable style={styles.opcion} onPress={() => setAbierta('reportar')}>
          <Ionicons name="flag-outline" size={20} color={tokens.color.noche} />
          <Text style={estilos.texto}>Mandar un parte al equipo de Studate</Text>
        </Pressable>
        <Pressable style={[styles.opcion, styles.opcionPeligro]} onPress={() => setAbierta('bloquear')}>
          <Ionicons name="ban-outline" size={20} color={tokens.color.ko} />
          <Text style={[estilos.texto, { color: tokens.color.ko }]}>Bloquear a {nombre}</Text>
        </Pressable>
        <Boton texto="Cancelar" tipo="secundario" onPress={cerrar} />
      </Hoja>

      <Hoja visible={abierta === 'reportar'} onClose={cerrar} label="mandar un parte">
        <Text style={estilos.et}>Mandar un parte</Text>
        <Text style={styles.titulo}>¿Qué ha pasado con {nombre}?</Text>
        {MOTIVOS.map((motivo) => (
          <Pressable
            key={motivo.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: reason === motivo.value }}
            style={[styles.opcion, reason === motivo.value && styles.opcionSel]}
            onPress={() => {
              setReason(motivo.value);
              setError('');
            }}
          >
            <Ionicons name={reason === motivo.value ? 'radio-button-on' : 'radio-button-off'} size={20} color={tokens.color.azul} />
            <Text style={estilos.texto}>{motivo.texto}</Text>
          </Pressable>
        ))}
        <TextInput
          style={styles.input}
          placeholder="Cuéntanos (opcional)"
          placeholderTextColor={tokens.color.gris}
          multiline
          maxLength={500}
          value={text}
          onChangeText={setText}
        />
        {error ? <Text style={estilos.aviso}>{error}</Text> : null}
        <View style={styles.botonera}>
          <Boton texto="Bloquear" tipo="secundario" onPress={() => setAbierta('bloquear')} disabled={enviando} />
          <Boton texto={enviando ? 'Enviando…' : 'Enviar parte'} onPress={enviarParte} disabled={enviando} />
        </View>
      </Hoja>

      <Hoja visible={abierta === 'bloquear'} onClose={cerrar} label="bloquear">
        <Text style={estilos.et}>Bloquear</Text>
        <Text style={styles.titulo}>¿Bloquear a {nombre}?</Text>
        <Text style={estilos.sua}>Se cierra el Date. {nombre} desaparece de tu Orla y de tus chats, y tú de los suyos. No se le avisa.</Text>
        {error ? <Text style={estilos.aviso}>{error}</Text> : null}
        <View style={styles.botonera}>
          <Boton texto="Cancelar" tipo="secundario" onPress={cerrar} disabled={enviando} />
          <Boton texto={enviando ? 'Bloqueando…' : 'Bloquear'} tipo="peligro" onPress={bloquear} disabled={enviando} />
        </View>
      </Hoja>
    </>
  );
}

// El botón de ayuda de la cabecera del chat: el escudo rojo y su hoja de confirmación
export function BotonAyuda({ dateId, onAviso }: { dateId: string; onAviso: (texto: string) => void }) {
  const [abierta, setAbierta] = useState(false);
  const [message, setMessage] = useState('');
  const [contactos, setContactos] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  // Los contactos solo vienen en GET /users/me: se piden al abrir, para decir a cuántos se avisará
  useEffect(() => {
    if (!abierta) {
      return;
    }
    userService
      .getMe()
      .then((me) => setContactos(me.trustedContacts?.length ?? 0))
      .catch(() => setContactos(0));
  }, [abierta]);

  const pedir = async () => {
    setEnviando(true);
    setError('');
    try {
      const res = await safetyAlertService.create({ date: dateId, ...(message.trim() ? { message: message.trim() } : {}) });
      setAbierta(false);
      setMessage('');
      onAviso(
        res.contactsNotified > 0
          ? `Aviso enviado al equipo de Studate y a ${res.contactsNotified === 1 ? 'tu contacto' : `tus ${res.contactsNotified} contactos`} de confianza.`
          : 'Aviso enviado al equipo de Studate.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se ha podido enviar el aviso.');
    } finally {
      setEnviando(false);
    }
  };

  const sinContactos = contactos === 0;

  return (
    <>
      <Pressable accessibilityLabel="Pedir ayuda" style={[styles.icb, styles.icbAlerta]} onPress={() => setAbierta(true)}>
        <Ionicons name="shield-outline" size={20} color={tokens.color.ko} />
      </Pressable>

      <Hoja visible={abierta} onClose={() => setAbierta(false)} label="botón de ayuda">
        <Text style={[estilos.et, { color: tokens.color.ko }]}>Botón de ayuda</Text>
        <Text style={styles.titulo}>{sinContactos ? 'Aún no tienes contactos de confianza.' : '¿Necesitas ayuda?'}</Text>
        <Text style={estilos.sua}>
          {sinContactos
            ? 'Avisaremos al equipo de Studate con el Date en el que estás. Añade contactos en Mi perfil para que también les llegue.'
            : `Avisaremos ahora ${contactos === null ? 'a tus contactos de confianza' : `a ${contactos === 1 ? 'tu contacto' : `tus ${contactos} contactos`} de confianza`} y al equipo de Studate, con el Date en el que estás.`}
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Mensaje (opcional): por ejemplo, estoy en la terraza de la EETAC"
          placeholderTextColor={tokens.color.gris}
          maxLength={300}
          value={message}
          onChangeText={setMessage}
        />
        <View style={styles.urg}>
          <Ionicons name="shield-outline" size={20} color={tokens.color.koTexto} />
          <Text style={{ color: tokens.color.koTexto, fontSize: 13.5 }}>
            Si estás en peligro, llama al <Text style={{ fontWeight: '800', fontSize: 16 }}>112</Text>.
          </Text>
        </View>
        {error ? <Text style={estilos.aviso}>{error} Vuelve a pulsar. Si no hay conexión, llama al 112.</Text> : null}
        <View style={styles.botonera}>
          <Boton texto="Cancelar" tipo="secundario" onPress={() => setAbierta(false)} disabled={enviando} />
          <Boton texto={enviando ? 'Enviando…' : sinContactos ? 'Pedir ayuda igualmente' : 'Pedir ayuda'} tipo="peligro" onPress={pedir} disabled={enviando} />
        </View>
      </Hoja>
    </>
  );
}

const styles = StyleSheet.create({
  velo: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(11, 27, 63, 0.55)',
  },
  hoja: {
    backgroundColor: tokens.color.blanco,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 28,
    gap: 12,
  },
  titulo: {
    color: tokens.color.noche,
    fontSize: 22,
    fontWeight: '800',
  },
  icb: {
    width: 40,
    height: 40,
    borderRadius: tokens.radius.campo,
    borderWidth: 1.5,
    borderColor: tokens.color.bordeCampo,
    backgroundColor: tokens.color.blanco,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icbSobreFoto: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 2,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  icbAlerta: {
    borderColor: tokens.color.koSuave,
  },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    padding: 12,
    borderWidth: 1.5,
    borderColor: tokens.color.bordeCampo,
    borderRadius: tokens.radius.campo,
  },
  opcionSel: {
    borderColor: tokens.color.azul,
    backgroundColor: tokens.color.azulSuave,
  },
  opcionPeligro: {
    borderColor: tokens.color.koSuave,
  },
  input: {
    minHeight: 46,
    borderWidth: 1.5,
    borderColor: tokens.color.bordeCampo,
    borderRadius: tokens.radius.campo,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: tokens.color.noche,
    fontSize: 15,
  },
  urg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: tokens.radius.campo,
    backgroundColor: tokens.color.koSuave,
  },
  botonera: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 10,
  },
});
