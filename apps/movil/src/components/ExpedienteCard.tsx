import { tokens } from '@studate/shared';
import type { Expediente, GradeValue } from '@studate/shared';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Animated, Image, PanResponder, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { iniciales } from '@/components/ui';

// Cuánto hay que arrastrar para que cuente como voto (lo mismo que en la web: 90 px)
export const SWIPE_THRESHOLD = 90;

// Lo que el padre puede pedirle a la tarjeta: votar con la animación de "sale volando". Lo usan los
// botones F y A+, que hacen lo mismo que deslizar
export interface ExpedienteCardHandle {
  swipe: (value: GradeValue) => void;
}

interface ExpedienteCardProps {
  user: Expediente;
  onVote: (value: GradeValue) => void;
  // true si ya no quedan A+ hoy: deslizar a la derecha no hace nada
  aPlusDisabled: boolean;
}

// La edad a partir de la fecha de nacimiento, como en la web
function edad(birthDate?: string): number | undefined {
  if (!birthDate) {
    return undefined;
  }
  const nacimiento = new Date(birthDate);
  const hoy = new Date();
  let años = hoy.getFullYear() - nacimiento.getFullYear();
  if (hoy < new Date(hoy.getFullYear(), nacimiento.getMonth(), nacimiento.getDate())) {
    años -= 1;
  }
  return años;
}

// La tarjeta del Expediente con el gesto de deslizar. En la web se hizo con Pointer Events; aquí con
// PanResponder y Animated, que vienen con React Native (sin librerías nativas): la tarjeta sigue al dedo
// con una rotación ligera y enseña el sello A+ o F según el lado; al soltar, si se ha pasado del umbral,
// sale volando y vota; si no, vuelve a su sitio con un muelle
export const ExpedienteCard = forwardRef<ExpedienteCardHandle, ExpedienteCardProps>(function ExpedienteCard(
  { user, onVote, aPlusDisabled },
  ref,
) {
  const { width } = useWindowDimensions();
  const posicion = useRef(new Animated.ValueXY()).current;
  const volando = useRef(false);

  // Votar con animación: la tarjeta sale por su lado y, al acabar, el padre vota
  const commit = (value: GradeValue) => {
    if (volando.current) {
      return;
    }
    volando.current = true;
    Animated.timing(posicion, {
      toValue: { x: (value === 'A+' ? 1 : -1) * (width + 200), y: 0 },
      duration: 280,
      useNativeDriver: false,
    }).start(() => onVote(value));
  };

  useImperativeHandle(ref, () => ({ swipe: commit }));

  const volver = () => {
    Animated.spring(posicion, { toValue: { x: 0, y: 0 }, useNativeDriver: false, friction: 6 }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      // Solo se coge el gesto cuando el dedo se mueve en horizontal, para no robarle el scroll a la pantalla
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        if (!volando.current) {
          posicion.setValue({ x: g.dx, y: g.dy * 0.2 });
        }
      },
      onPanResponderRelease: (_, g) => {
        if (volando.current) {
          return;
        }
        if (g.dx > SWIPE_THRESHOLD && !aPlusDisabled) {
          commit('A+');
        } else if (g.dx < -SWIPE_THRESHOLD) {
          commit('F');
        } else {
          volver();
        }
      },
      onPanResponderTerminate: volver,
    }),
    // aPlusDisabled cambia pocas veces (cuando se acaba el cupo); con el cambio se vuelve a crear
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ).current;

  const rotacion = posicion.x.interpolate({ inputRange: [-300, 0, 300], outputRange: ['-12deg', '0deg', '12deg'] });
  const selloA = posicion.x.interpolate({ inputRange: [0, SWIPE_THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
  const selloF = posicion.x.interpolate({ inputRange: [-SWIPE_THRESHOLD, 0], outputRange: [1, 0], extrapolate: 'clamp' });
  const años = edad(user.birthDate);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[styles.tarjeta, { transform: [{ translateX: posicion.x }, { translateY: posicion.y }, { rotate: rotacion }] }]}
    >
      {user.photo ? (
        <Image source={{ uri: user.photo }} style={styles.foto} />
      ) : (
        <View style={[styles.foto, styles.fotoSin]}>
          <Text style={styles.inicialesGrandes}>{iniciales(user.name)}</Text>
        </View>
      )}

      {/* Los sellos del gesto: A+ al deslizar a la derecha, F a la izquierda */}
      <Animated.View style={[styles.sello, styles.selloA, { opacity: selloA }]}>
        <Text style={[styles.selloTexto, { color: tokens.color.ok }]}>A+</Text>
      </Animated.View>
      <Animated.View style={[styles.sello, styles.selloF, { opacity: selloF }]}>
        <Text style={[styles.selloTexto, { color: tokens.color.ko }]}>F</Text>
      </Animated.View>

      <View style={styles.sobre}>
        <Text style={styles.nombre}>
          {user.name}
          {años !== undefined ? `, ${años}` : ''}
        </Text>
        {user.degree && <Text style={styles.dato}>{user.degree}</Text>}
        {user.lookingFor && <Text style={styles.gustos}>Busca: {user.lookingFor}</Text>}
        {user.bio && (
          <Text style={styles.bio} numberOfLines={3}>
            {user.bio}
          </Text>
        )}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  tarjeta: {
    width: '100%',
    aspectRatio: 3 / 4,
    maxHeight: 520,
    borderRadius: tokens.radius.tarjeta,
    backgroundColor: tokens.color.azulSuave,
    overflow: 'hidden',
    boxShadow: tokens.shadow.tarjeta,
  },
  foto: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  fotoSin: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inicialesGrandes: {
    color: tokens.color.azul,
    fontSize: 96,
    fontWeight: '900',
  },
  sello: {
    position: 'absolute',
    top: 24,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderWidth: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  selloA: {
    right: 18,
    borderColor: tokens.color.ok,
    transform: [{ rotate: '14deg' }],
  },
  selloF: {
    left: 18,
    borderColor: tokens.color.ko,
    transform: [{ rotate: '-14deg' }],
  },
  selloTexto: {
    fontSize: 40,
    fontWeight: '900',
  },
  sobre: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: tokens.space.lg,
    gap: tokens.space.xs,
    backgroundColor: 'rgba(11, 27, 63, 0.72)',
  },
  nombre: {
    color: tokens.color.blanco,
    fontSize: 26,
    fontWeight: '900',
  },
  dato: {
    color: tokens.color.blanco,
    opacity: 0.9,
    fontSize: 14,
  },
  gustos: {
    color: tokens.color.maiz,
    fontSize: 14,
    fontWeight: '600',
  },
  bio: {
    color: tokens.color.blanco,
    opacity: 0.85,
    fontSize: 13.5,
    lineHeight: 18,
  },
});
