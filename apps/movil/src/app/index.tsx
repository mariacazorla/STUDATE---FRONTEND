import { tokens } from '@studate/shared';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { environment } from '@/config/environment';

// Los colores de la marca que se enseñan en la pantalla, con su nombre en el tema
const MUESTRAS = [
  { nombre: 'azul', color: tokens.color.azul },
  { nombre: 'rosa', color: tokens.color.rosa },
  { nombre: 'maíz', color: tokens.color.maiz },
  { nombre: 'noche', color: tokens.color.noche },
  { nombre: 'A+', color: tokens.color.ok },
  { nombre: 'F', color: tokens.color.ko },
];

// Pantalla de inicio provisional. La app todavía está vacía: esta pantalla solo comprueba que
// arranca dentro del monorepo y que pinta con el tema común de @studate/shared.
// Las pantallas de verdad (La Orla, Mis Dates y Mi perfil) llegan con el bloque del móvil.
export default function Index() {
  return (
    <SafeAreaView style={styles.pantalla}>
      <View style={styles.portada}>
        <Text style={styles.marca}>STUDATE</Text>
        <Text style={styles.edicion}>CAMPUS EDITION</Text>
        <Text style={styles.lema}>
          Ligar también da <Text style={styles.lemaAcento}>créditos.</Text>
        </Text>
      </View>

      <View style={styles.tarjeta}>
        <Text style={styles.etiqueta}>TEMA COMÚN</Text>
        <Text style={styles.texto}>
          Estos colores salen del mismo fichero que usa la web: packages/shared.
        </Text>

        <View style={styles.muestras}>
          {MUESTRAS.map((muestra) => (
            <View key={muestra.nombre} style={styles.muestra}>
              <View style={[styles.color, { backgroundColor: muestra.color }]} />
              <Text style={styles.nombre}>{muestra.nombre}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.pie}>API: {environment.apiUrl}</Text>
    </SafeAreaView>
  );
}

// Todos los valores salen de tokens: ni un color ni un tamaño de espacio escrito a mano
const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: tokens.color.fondo,
    padding: tokens.space.lg,
    gap: tokens.space.lg,
  },
  portada: {
    backgroundColor: tokens.color.azul,
    borderRadius: tokens.radius.tarjeta,
    padding: tokens.space.xl,
  },
  marca: {
    color: tokens.color.blanco,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 1,
  },
  edicion: {
    color: tokens.color.maiz,
    fontSize: 11,
    letterSpacing: 2,
    marginTop: tokens.space.xs,
  },
  lema: {
    color: tokens.color.blanco,
    fontSize: 26,
    fontWeight: '900',
    marginTop: tokens.space.xl,
  },
  lemaAcento: {
    color: tokens.color.maiz,
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
  etiqueta: {
    color: tokens.color.rosaBoton,
    fontSize: 11,
    letterSpacing: 1,
  },
  texto: {
    color: tokens.color.noche,
    fontSize: 15,
    lineHeight: 22,
  },
  muestras: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.space.md,
  },
  muestra: {
    alignItems: 'center',
    gap: tokens.space.xs,
  },
  color: {
    width: 44,
    height: 44,
    borderRadius: tokens.radius.campo,
  },
  nombre: {
    color: tokens.color.gris,
    fontSize: 12,
  },
  pie: {
    color: tokens.color.gris,
    fontSize: 12,
    textAlign: 'center',
  },
});
