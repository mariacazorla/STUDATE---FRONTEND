import { tokens } from '@studate/shared';
import { StyleSheet } from 'react-native';

// Los estilos comunes de la app: el equivalente del CSS global de la web (global.css), con los mismos
// tokens. Las pantallas los combinan con los suyos y nunca escriben un color a mano.
export const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: tokens.color.fondo,
  },
  cuerpo: {
    padding: tokens.space.lg,
    gap: tokens.space.lg,
  },
  // Titular de pantalla (.t1)
  t1: {
    color: tokens.color.noche,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  // Titular de tarjeta (.t2)
  t2: {
    color: tokens.color.noche,
    fontSize: 18,
    fontWeight: '800',
  },
  // Etiqueta pequeña en mayúsculas (.et)
  et: {
    color: tokens.color.rosaBoton,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  texto: {
    color: tokens.color.noche,
    fontSize: 15,
    lineHeight: 22,
  },
  // Texto secundario (.sua)
  sua: {
    color: tokens.color.gris,
    fontSize: 13.5,
    lineHeight: 19,
  },
  fila: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: tokens.space.sm,
  },
  // El aviso de error de un formulario (.aviso)
  aviso: {
    backgroundColor: tokens.color.koSuave,
    color: tokens.color.koTexto,
    borderRadius: tokens.radius.campo,
    padding: tokens.space.md,
    fontSize: 14,
    overflow: 'hidden',
  },
});
