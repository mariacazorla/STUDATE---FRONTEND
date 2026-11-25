import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@nanostores/react';
import { $user, authService, tokens } from '@studate/shared';
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Boton, Tarjeta } from '@/components/ui';
import { estilos } from '@/theme/estilos';

// Las pestañas de la app del estudiante: La Orla, Mis Dates y Mi perfil, igual que las de abajo de la
// web en el móvil. Los iconos son de Ionicons (vienen con Expo).
//
// Solo hay dos roles y el backoffice es solo web: un admin que entra en la app ve un aviso y puede salir
export default function TabsLayout() {
  const user = useStore($user);

  if (user?.role === 'admin') {
    return (
      <SafeAreaView style={[estilos.pantalla, estilos.cuerpo]}>
        <Tarjeta>
          <Text style={estilos.et}>Backoffice</Text>
          <Text style={estilos.t2}>El backoffice es solo para la web.</Text>
          <Text style={estilos.sua}>Entra desde el navegador con tu cuenta de admin. La app del móvil es la del estudiante.</Text>
          <Boton texto="Cerrar sesión" tipo="secundario" onPress={() => authService.logout()} />
        </Tarjeta>
      </SafeAreaView>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: tokens.color.fondo },
        tabBarActiveTintColor: tokens.color.azul,
        tabBarInactiveTintColor: tokens.color.gris,
        tabBarStyle: { backgroundColor: tokens.color.blanco, borderTopColor: tokens.color.linea },
        tabBarLabelStyle: { fontSize: 11.5, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="orla"
        options={{
          title: 'La Orla',
          tabBarIcon: ({ color, size }) => <Ionicons name="school-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="dates"
        options={{
          title: 'Mis Dates',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Mi perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

// Un hueco de pantalla con el título, para las pestañas que todavía no tienen contenido
export function PantallaVacia({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <SafeAreaView style={estilos.pantalla}>
      <View style={estilos.cuerpo}>
        <Text style={estilos.t1}>{titulo}</Text>
        <Text style={estilos.sua}>{texto}</Text>
      </View>
    </SafeAreaView>
  );
}
