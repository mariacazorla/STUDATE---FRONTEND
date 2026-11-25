import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@nanostores/react';
import {
  $user,
  DATE_CLOSED_REASON_LABELS,
  MESSAGE_MAX_LENGTH,
  dateService,
  empezoEl,
  etiquetaDia,
  horaCorta,
  isMyTurn,
  otherUser,
  remainingMs,
  restanteLargo,
  tokens,
} from '@studate/shared';
import type { Message, StudateDate } from '@studate/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Boton, Chip, Vacio } from '@/components/ui';
import { useChat, useNow } from '@/hooks/useChat';
import { estilos } from '@/theme/estilos';

type Estado = 'cargando' | 'normal' | 'error';

// La conversación de un Date en el móvil. Lo mismo que en la web, con el mismo socket compartido: el
// historial por HTTP, la sala del Date por socket.io, el turno mientras está pendiente, la prórroga y
// los ✓✓. Un mensaje escrito en la web llega aquí al momento (y al revés)
export default function Chat() {
  const { dateId } = useLocalSearchParams<{ dateId: string }>();
  const me = useStore($user);
  const router = useRouter();
  const now = useNow();
  const { socket, estado: conexion } = useChat();

  const [date, setDate] = useState<StudateDate | null>(null);
  const [estado, setEstado] = useState<Estado>('cargando');
  const [messages, setMessages] = useState<Message[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [aviso, setAviso] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const avisar = (texto: string) => {
    setAviso(texto);
    setTimeout(() => setAviso(''), 3000);
  };

  // El Date y la última página del historial
  const load = useCallback(async () => {
    if (!dateId) {
      return;
    }
    setEstado('cargando');
    try {
      const [d, res] = await Promise.all([dateService.getDate(dateId), dateService.getMessages(dateId, 1)]);
      setDate(d);
      setMessages(res.items);
      setPage(1);
      setPages(res.pages);
      setEstado('normal');
    } catch {
      setEstado('error');
    }
  }, [dateId]);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = async () => {
    if (!dateId) {
      return;
    }
    try {
      const res = await dateService.getMessages(dateId, page + 1);
      setMessages((current) => [...res.items, ...current]);
      setPage(page + 1);
      setPages(res.pages);
    } catch (err) {
      avisar(err instanceof Error ? err.message : 'No se han podido cargar más mensajes');
    }
  };

  // La sala del Date: entrar al abrir y en cada reconexión, salir al cerrar
  useEffect(() => {
    if (!socket || !dateId) {
      return;
    }
    const join = () => socket.emit('date:join', { dateId });
    if (socket.connected) {
      join();
    }
    socket.on('connect', join);
    return () => {
      socket.off('connect', join);
      socket.emit('date:leave', { dateId });
    };
  }, [socket, dateId]);

  // Lo que llega por el socket
  useEffect(() => {
    if (!socket || !dateId || !me) {
      return;
    }
    const onMessage = (message: Message) => {
      if (message.date !== dateId) {
        return;
      }
      setMessages((current) => [...current, message]);
      if (message.from !== me._id) {
        socket.emit('date:read', { dateId });
      }
    };
    const onUpdated = (updated: StudateDate) => {
      if (updated._id === dateId) {
        setDate(updated);
      }
    };
    const onRead = (payload: { dateId: string; by: string; at: string }) => {
      if (payload.dateId !== dateId || payload.by === me._id) {
        return;
      }
      setMessages((current) => current.map((m) => (m.from === me._id && !m.readAt ? { ...m, readAt: payload.at } : m)));
    };
    const onError = (payload: { message: string }) => {
      setSending(false);
      avisar(payload.message);
    };
    socket.on('date:message', onMessage);
    socket.on('date:updated', onUpdated);
    socket.on('date:read', onRead);
    socket.on('chat:error', onError);
    return () => {
      socket.off('date:message', onMessage);
      socket.off('date:updated', onUpdated);
      socket.off('date:read', onRead);
      socket.off('chat:error', onError);
    };
  }, [socket, dateId, me]);

  // Al abrir con el historial cargado, lo de la otra persona queda leído
  useEffect(() => {
    if (socket && dateId && me && estado === 'normal' && messages.some((m) => m.from !== me._id && !m.readAt)) {
      socket.emit('date:read', { dateId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, estado]);

  // Cada mensaje nuevo baja la conversación hasta el final
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length, estado]);

  useEffect(() => {
    if (sending && me && messages.length > 0 && messages[messages.length - 1].from === me._id) {
      setSending(false);
    }
  }, [messages, sending, me]);

  if (!me || !dateId) {
    return null;
  }

  const otro = date ? otherUser(date, me._id) : null;
  const nombre = otro?.name.split(' ')[0] ?? '';
  const cerrado = date?.status === 'closed';
  const pendiente = date?.status === 'pending';
  const miTurno = date ? isMyTurn(date, me._id) : false;
  const puedoEscribir = !!date && !cerrado && (!pendiente || miTurno) && conexion === 'conectado';

  const send = () => {
    const trimmed = text.trim();
    if (!socket || !puedoEscribir || !trimmed || sending) {
      return;
    }
    setSending(true);
    socket.emit('date:message', { dateId, text: trimmed });
    setText('');
  };

  const extend = async () => {
    try {
      setDate(await dateService.extendDate(dateId));
      avisar('Prórroga usada: tenéis 24 horas más.');
    } catch (err) {
      avisar(err instanceof Error ? err.message : 'No se ha podido pedir la prórroga');
    }
  };

  return (
    <SafeAreaView style={estilos.pantalla} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.cabecera}>
          <Pressable accessibilityLabel="Volver" style={styles.icb} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={tokens.color.noche} />
          </Pressable>
          {otro && <Avatar user={otro} tamano={40} />}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={estilos.t2} numberOfLines={1}>
              {otro?.name ?? 'Date'}
            </Text>
            {otro && (
              <Text style={estilos.sua} numberOfLines={1}>
                {otro.email}
              </Text>
            )}
          </View>
        </View>

        {date && (
          <View style={styles.franja}>
            {cerrado ? (
              <>
                <Chip texto="Cerrado" color="ko" />
                <Text style={estilos.sua}>{date.closedReason ? DATE_CLOSED_REASON_LABELS[date.closedReason] : 'Este Date se ha cerrado'}</Text>
              </>
            ) : pendiente ? (
              <>
                <Chip texto="Pendiente" />
                <Text style={styles.reloj}>
                  {miTurno ? 'Te toca empezar. ' : `Empieza ${nombre}. `}Quedan {restanteLargo(remainingMs(date, now))}
                </Text>
                {!date.extended && <Boton texto="Pedir prórroga (+24 h)" tipo="secundario" onPress={extend} style={{ minHeight: 34, paddingHorizontal: 12 }} />}
              </>
            ) : (
              <>
                <Chip texto="En curso" color="azul" />
                {date.startedAt && <Text style={estilos.sua}>Empezó {empezoEl(date.startedAt, now)}</Text>}
              </>
            )}
          </View>
        )}

        <ScrollView ref={scrollRef} style={styles.mensajes} contentContainerStyle={styles.mensajesContenido}>
          {estado === 'cargando' && <View style={styles.esqueleto} />}
          {estado === 'error' && (
            <Vacio titulo="No se ha podido cargar la conversación." texto="Vuelve a probar cuando tengas conexión.">
              <Boton texto="Reintentar" onPress={load} />
            </Vacio>
          )}
          {estado === 'normal' && (
            <>
              {page < pages && <Boton texto="Ver mensajes anteriores" tipo="secundario" onPress={loadMore} style={{ alignSelf: 'center' }} />}
              {messages.length === 0 && (
                <Vacio
                  titulo="Aún no hay mensajes."
                  texto={
                    cerrado
                      ? 'Este Date se cerró sin que nadie escribiera.'
                      : miTurno
                        ? `Te toca escribir a ti: tienes ${date ? restanteLargo(remainingMs(date, now)) : ''}.`
                        : `Empieza ${nombre}. Tú te quedas con las ganas hasta que escriba.`
                  }
                />
              )}
              {messages.map((m, i) => {
                const mio = m.from === me._id;
                const nuevoDia = i === 0 || etiquetaDia(messages[i - 1].createdAt, now) !== etiquetaDia(m.createdAt, now);
                return (
                  <View key={m._id} style={{ gap: 8 }}>
                    {nuevoDia && <Text style={styles.diaSep}>{etiquetaDia(m.createdAt, now)}</Text>}
                    <View style={[styles.msg, mio && styles.msgMio]}>
                      <Text style={[styles.msgTexto, mio && { color: tokens.color.blanco }]}>{m.text}</Text>
                      <Text style={[styles.msgHora, mio && { color: 'rgba(255,255,255,0.75)' }]}>
                        {horaCorta(m.createdAt)}
                        {mio && (m.readAt ? ' ✓✓' : ' ✓')}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>

        {aviso ? <Text style={[estilos.aviso, { marginHorizontal: tokens.space.md }]}>{aviso}</Text> : null}

        <View style={styles.escribir}>
          <TextInput
            style={[styles.input, !puedoEscribir && { backgroundColor: tokens.color.esqueleto }]}
            placeholder={
              conexion === 'error' ? 'Sin conexión con el chat' : cerrado ? 'Este Date está cerrado' : pendiente && !miTurno ? `Empieza ${nombre}…` : 'Escribe algo que merezca un A+…'
            }
            placeholderTextColor={tokens.color.gris}
            value={text}
            maxLength={MESSAGE_MAX_LENGTH}
            editable={puedoEscribir}
            onChangeText={setText}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <Pressable
            accessibilityLabel="Enviar"
            style={[styles.enviar, (!puedoEscribir || !text.trim() || sending) && { backgroundColor: tokens.color.bordeVacio }]}
            onPress={send}
            disabled={!puedoEscribir || !text.trim() || sending}
          >
            <Ionicons name="arrow-forward" size={22} color={tokens.color.blanco} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: tokens.color.blanco,
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.borde,
  },
  icb: {
    width: 40,
    height: 40,
    borderRadius: tokens.radius.campo,
    borderWidth: 1.5,
    borderColor: tokens.color.bordeCampo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  franja: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: tokens.color.niebla,
  },
  reloj: {
    color: tokens.color.rosaBoton,
    fontSize: 12.5,
    fontWeight: '600',
  },
  mensajes: {
    flex: 1,
  },
  mensajesContenido: {
    padding: 14,
    gap: 8,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  esqueleto: {
    height: 120,
    borderRadius: tokens.radius.tarjeta,
    backgroundColor: tokens.color.esqueleto,
  },
  diaSep: {
    alignSelf: 'center',
    color: tokens.color.gris,
    fontSize: 10.5,
    letterSpacing: 1,
    backgroundColor: tokens.color.blanco,
    borderWidth: 1,
    borderColor: tokens.color.linea,
    borderRadius: tokens.radius.pastilla,
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: 'hidden',
  },
  msg: {
    alignSelf: 'flex-start',
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    backgroundColor: tokens.color.blanco,
    borderWidth: 1,
    borderColor: tokens.color.linea,
  },
  msgMio: {
    alignSelf: 'flex-end',
    backgroundColor: tokens.color.azul,
    borderColor: tokens.color.azul,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 6,
  },
  msgTexto: {
    color: tokens.color.noche,
    fontSize: 14.5,
    lineHeight: 20,
  },
  msgHora: {
    color: tokens.color.gris,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 2,
  },
  escribir: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    backgroundColor: tokens.color.blanco,
    borderTopWidth: 1,
    borderTopColor: tokens.color.borde,
  },
  input: {
    flex: 1,
    minHeight: 46,
    borderRadius: tokens.radius.pastilla,
    borderWidth: 1.5,
    borderColor: tokens.color.bordeCampo,
    paddingHorizontal: 16,
    color: tokens.color.noche,
    fontSize: 15,
  },
  enviar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: tokens.color.rosaBoton,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
