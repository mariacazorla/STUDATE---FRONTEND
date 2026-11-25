import { Platform } from 'react-native';

// La dirección de la API se lee del .env (EXPO_PUBLIC_API_URL). Expo solo deja pasar al código las
// variables que empiezan por EXPO_PUBLIC_, y las incrusta al empaquetar la app.
const envApiUrl = process.env.EXPO_PUBLIC_API_URL;

// Sin .env: el emulador de Android llega al ordenador por 10.0.2.2; el resto, por localhost
const getDefaultApiUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:1337';
  }
  return 'http://localhost:1337';
};

// Ajustes de la app. UN solo fichero: la URL de la API se cambia aquí (o en el .env) y en ningún sitio más
export const environment = {
  apiUrl: envApiUrl || getDefaultApiUrl(),
};
