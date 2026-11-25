import { useStore } from '@nanostores/react';
import { $user, authService } from '@studate/shared';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Boton, Tarjeta } from '@/components/ui';
import { estilos } from '@/theme/estilos';

// Mi perfil: de momento quién soy y cerrar sesión. La edición llega en su tarea
export default function Perfil() {
  const user = useStore($user);

  return (
    <SafeAreaView style={estilos.pantalla}>
      <View style={estilos.cuerpo}>
        <Text style={estilos.t1}>Mi perfil</Text>
        {user && (
          <Tarjeta>
            <View style={estilos.fila}>
              <Avatar user={user} tamano={56} />
              <View>
                <Text style={estilos.t2}>{user.name}</Text>
                <Text style={estilos.sua}>{user.email}</Text>
              </View>
            </View>
            <Boton texto="Cerrar sesión" tipo="secundario" onPress={() => authService.logout()} />
          </Tarjeta>
        )}
      </View>
    </SafeAreaView>
  );
}
