import { tokens } from '@studate/shared';
import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { StyleProp, TextInputProps, ViewStyle } from 'react-native';

import { estilos } from '@/theme/estilos';

// Las piezas que se repiten en la app: botón, tarjeta, chip, campo, avatar y vacío. Son el
// componentes.css de la web pasado a React Native, con los mismos tokens

interface BotonProps {
  texto: string;
  onPress: () => void;
  // principal (rosa), secundario (borde) o peligro (rojo), como .btn, .btn2 y .btn.peligro
  tipo?: 'principal' | 'secundario' | 'peligro';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Boton({ texto, onPress, tipo = 'principal', disabled, style }: BotonProps) {
  const esSecundario = tipo === 'secundario';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        ui.boton,
        tipo === 'principal' && ui.botonPrincipal,
        tipo === 'peligro' && ui.botonPeligro,
        esSecundario && ui.botonSecundario,
        disabled && ui.botonDesactivado,
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      <Text style={[ui.botonTexto, esSecundario && ui.botonSecundarioTexto]}>{texto}</Text>
    </Pressable>
  );
}

export function Tarjeta({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[ui.tarjeta, style]}>{children}</View>;
}

interface ChipProps {
  texto: string;
  // como .chip, .chip.azul, .chip.ok, .chip.ko y .chip.maiz
  color?: 'rosa' | 'azul' | 'ok' | 'ko' | 'maiz';
}

const CHIP_COLORES = {
  rosa: { fondo: tokens.color.niebla, texto: tokens.color.rosaBoton },
  azul: { fondo: tokens.color.azulSuave, texto: tokens.color.azul },
  ok: { fondo: tokens.color.okSuave, texto: tokens.color.okTexto },
  ko: { fondo: tokens.color.koSuave, texto: tokens.color.koTexto },
  maiz: { fondo: tokens.color.maiz, texto: tokens.color.noche },
};

export function Chip({ texto, color = 'rosa' }: ChipProps) {
  const c = CHIP_COLORES[color];
  return (
    <View style={[ui.chip, { backgroundColor: c.fondo }]}>
      <Text style={[ui.chipTexto, { color: c.texto }]}>{texto}</Text>
    </View>
  );
}

interface CampoProps extends TextInputProps {
  label: string;
  error?: string;
  ayuda?: string;
}

// Una etiqueta + el input + su error, como <Field> en la web
export function Campo({ label, error, ayuda, style, ...input }: CampoProps) {
  return (
    <View style={ui.campo}>
      <Text style={ui.campoLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={tokens.color.gris}
        {...input}
        style={[ui.campoInput, error ? ui.campoMal : null, style]}
      />
      {ayuda && !error && <Text style={estilos.sua}>{ayuda}</Text>}
      {error && <Text style={ui.campoError}>{error}</Text>}
    </View>
  );
}

// Iniciales para quien no tiene foto ("Laia Puig" -> "LP"), igual que en la web
export function iniciales(name: string): string {
  const words = name.split(' ').filter((w) => w);
  const first = words[0] ?? '';
  const last = words.length > 1 ? words[words.length - 1] : '';
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}

export function Avatar({ user, tamano = 40 }: { user: { name: string; photo?: string }; tamano?: number }) {
  const redondo = { width: tamano, height: tamano, borderRadius: tamano / 2 };
  if (user.photo) {
    return <Image source={{ uri: user.photo }} style={redondo} />;
  }
  return (
    <View style={[ui.avatarSin, redondo]}>
      <Text style={[ui.avatarIniciales, { fontSize: tamano * 0.34 }]}>{iniciales(user.name)}</Text>
    </View>
  );
}

// El estado vacío (.vacio): un titular, un texto y, si se quiere, un botón
export function Vacio({ titulo, texto, children }: { titulo: string; texto?: string; children?: ReactNode }) {
  return (
    <View style={ui.vacio}>
      <Text style={ui.vacioTitulo}>{titulo}</Text>
      {texto && <Text style={[estilos.sua, { textAlign: 'center' }]}>{texto}</Text>}
      {children}
    </View>
  );
}

const ui = StyleSheet.create({
  boton: {
    minHeight: 46,
    paddingHorizontal: 22,
    borderRadius: tokens.radius.pastilla,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonPrincipal: {
    backgroundColor: tokens.color.rosaBoton,
    boxShadow: tokens.shadow.boton,
  },
  botonPeligro: {
    backgroundColor: tokens.color.ko,
  },
  botonSecundario: {
    backgroundColor: tokens.color.blanco,
    borderWidth: 1.5,
    borderColor: tokens.color.bordeCampo,
  },
  botonDesactivado: {
    opacity: 0.5,
    boxShadow: 'none',
  },
  botonTexto: {
    color: tokens.color.blanco,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  botonSecundarioTexto: {
    color: tokens.color.noche,
    textTransform: 'none',
    letterSpacing: 0,
    fontWeight: '700',
    fontSize: 15,
  },
  tarjeta: {
    backgroundColor: tokens.color.blanco,
    borderRadius: tokens.radius.tarjeta,
    borderWidth: 1,
    borderColor: tokens.color.borde,
    padding: tokens.space.lg,
    gap: tokens.space.md,
    boxShadow: tokens.shadow.tarjeta,
  },
  chip: {
    alignSelf: 'flex-start',
    borderRadius: tokens.radius.pastilla,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipTexto: {
    fontSize: 12,
    fontWeight: '700',
  },
  campo: {
    gap: tokens.space.xs,
  },
  campoLabel: {
    color: tokens.color.noche,
    fontSize: 13,
    fontWeight: '700',
  },
  campoInput: {
    minHeight: 46,
    borderWidth: 1.5,
    borderColor: tokens.color.bordeCampo,
    borderRadius: tokens.radius.campo,
    backgroundColor: tokens.color.blanco,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: tokens.color.noche,
    fontSize: 15,
  },
  campoMal: {
    borderColor: tokens.color.ko,
  },
  campoError: {
    color: tokens.color.koTexto,
    fontSize: 12.5,
  },
  avatarSin: {
    backgroundColor: tokens.color.azulSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIniciales: {
    color: tokens.color.azul,
    fontWeight: '800',
  },
  vacio: {
    alignItems: 'center',
    gap: tokens.space.md,
    padding: tokens.space.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: tokens.color.bordeVacio,
    borderRadius: tokens.radius.tarjeta,
  },
  vacioTitulo: {
    color: tokens.color.noche,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
});
