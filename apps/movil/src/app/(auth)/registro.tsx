import { ApiError, authService } from '@studate/shared';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Boton, Campo, Tarjeta } from '@/components/ui';
import { estilos } from '@/theme/estilos';

// Crear cuenta: nombre, correo y contraseña (mínimo 8). La API no devuelve token al registrarse:
// después se va al login, como en la web
export default function Registro() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [hecho, setHecho] = useState(false);

  const crear = async () => {
    if (!name.trim() || !email.trim()) {
      setError('Escribe tu nombre y tu correo.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña tiene que tener al menos 8 caracteres.');
      return;
    }
    setEnviando(true);
    setError('');
    try {
      await authService.register({ name: name.trim(), email: email.trim(), password });
      setHecho(true);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? 'Ya hay una cuenta con ese correo.'
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
          <Tarjeta>
            <Text style={estilos.et}>Studate</Text>
            <Text style={estilos.t1}>Crear cuenta</Text>
            {hecho ? (
              <>
                <Text style={estilos.texto}>Cuenta creada. Ya puedes entrar con tu correo y tu contraseña.</Text>
                <Boton texto="Ir a entrar" onPress={() => router.replace('/login')} />
              </>
            ) : (
              <>
                <Campo label="Nombre" placeholder="Tu nombre" value={name} onChangeText={setName} />
                <Campo
                  label="Correo de la universidad"
                  placeholder="nombre@estudiantat.upc.edu"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
                <Campo
                  label="Contraseña"
                  ayuda="Mínimo 8 caracteres."
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  onSubmitEditing={crear}
                />
                {error ? <Text style={estilos.aviso}>{error}</Text> : null}
                <Boton texto={enviando ? 'Creando…' : 'Crear cuenta'} onPress={crear} disabled={enviando} />
                <Text style={[estilos.sua, { textAlign: 'center' }]}>
                  ¿Ya tienes cuenta? <Link href="/login">Entrar</Link>
                </Text>
              </>
            )}
          </Tarjeta>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
