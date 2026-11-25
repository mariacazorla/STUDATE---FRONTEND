import { ApiError, authService, tokens } from '@studate/shared';
import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Boton, Campo, Tarjeta } from '@/components/ui';
import { estilos } from '@/theme/estilos';

// Entrar: el mismo formulario que en la web. El login manda X-Client: movil y guarda el refresh token
// en el almacén cifrado; a partir de ahí, cerrar y abrir la app mantiene la sesión
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const entrar = async () => {
    if (!email.trim() || !password) {
      setError('Escribe tu correo y tu contraseña.');
      return;
    }
    setEnviando(true);
    setError('');
    try {
      await authService.login({ email: email.trim(), password });
      // El layout raíz lleva a La Orla en cuanto hay usuario
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? 'El correo o la contraseña no son correctos.'
          : err instanceof ApiError
            ? err.message
            : 'No se puede conectar con la API.',
      );
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={estilos.pantalla}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={estilos.cuerpo} keyboardShouldPersistTaps="handled">
          <View style={styles.portada}>
            <Text style={styles.marca}>STUDATE</Text>
            <Text style={styles.edicion}>CAMPUS EDITION</Text>
            <Text style={styles.lema}>
              Ligar también da <Text style={styles.lemaAcento}>créditos.</Text>
            </Text>
            <Text style={styles.sub}>La app para conocer gente de tu universidad.</Text>
          </View>

          <Tarjeta>
            <Text style={estilos.t1}>Entrar</Text>
            <Campo
              label="Correo de la universidad"
              placeholder="nombre@estudiantat.upc.edu"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Campo
              label="Contraseña"
              secureTextEntry
              autoComplete="password"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={entrar}
            />
            {error ? <Text style={estilos.aviso}>{error}</Text> : null}
            <Boton texto={enviando ? 'Entrando…' : 'Entrar'} onPress={entrar} disabled={enviando} />
            <Text style={[estilos.sua, { textAlign: 'center' }]}>
              ¿Aún no tienes cuenta?{' '}
              <Link href="/registro" style={styles.enlace}>
                Crear cuenta
              </Link>
            </Text>
          </Tarjeta>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  portada: {
    backgroundColor: tokens.color.azul,
    borderRadius: tokens.radius.tarjeta,
    padding: tokens.space.xl,
    gap: tokens.space.xs,
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
  },
  lema: {
    color: tokens.color.blanco,
    fontSize: 26,
    fontWeight: '900',
    marginTop: tokens.space.lg,
  },
  lemaAcento: {
    color: tokens.color.maiz,
  },
  sub: {
    color: tokens.color.blanco,
    opacity: 0.85,
    fontSize: 14,
  },
  enlace: {
    color: tokens.color.rosaBoton,
    fontWeight: '700',
  },
});
