import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

// La foto de perfil se guarda en la API como texto en base64 ("data:image/jpeg;base64,...") de 200 000
// caracteres como mucho, igual que desde la web. Una foto del teléfono son varios MB, así que se reduce
// aquí antes de enviarla: es el image-to-data-url.ts de la web, pero con los módulos de Expo en vez
// del <canvas>. Los dos módulos vienen dentro de Expo Go, así que no hace falta compilar nada.

// Lado mayor de la foto reducida, en píxeles. Para un círculo de perfil sobra
const MAX_SIDE = 640;

// Calidad del JPEG (0 a 1). Con 0.82 una foto de 640 px queda muy por debajo de los 200 KB
const QUALITY = 0.82;

// El mismo límite que tiene el modelo en la API (PHOTO_MAX_LENGTH)
const PHOTO_MAX_LENGTH = 200_000;

export type OrigenFoto = 'galeria' | 'camara';

// Abre la galería o la cámara, deja recortar en cuadrado y devuelve la foto reducida como data URL.
// Devuelve undefined si la persona cancela. Lanza un Error con un texto para la pantalla si no hay
// permiso o la foto no se puede procesar.
export async function elegirFoto(origen: OrigenFoto): Promise<string | undefined> {
  const asset = origen === 'camara' ? await hacerFoto() : await abrirGaleria();
  if (!asset) {
    return undefined;
  }

  // Se reduce manteniendo la proporción, solo si la foto es más grande que MAX_SIDE. Con el recorte
  // cuadrado del selector, ancho y alto coinciden; si el sistema no da medidas (0), se reduce igual
  const lado = Math.max(asset.width, asset.height);
  const contexto = ImageManipulator.manipulate(asset.uri);
  if (lado === 0 || lado > MAX_SIDE) {
    const escala = lado === 0 ? 1 : MAX_SIDE / lado;
    contexto.resize(
      asset.width >= asset.height
        ? { width: lado === 0 ? MAX_SIDE : Math.round(asset.width * escala) }
        : { height: lado === 0 ? MAX_SIDE : Math.round(asset.height * escala) },
    );
  }
  const imagen = await contexto.renderAsync();
  const resultado = await imagen.saveAsync({
    format: SaveFormat.JPEG,
    compress: QUALITY,
    base64: true,
  });
  imagen.release();

  if (!resultado.base64) {
    throw new Error('No se ha podido procesar la imagen');
  }
  const dataUrl = `data:image/jpeg;base64,${resultado.base64}`;
  if (dataUrl.length > PHOTO_MAX_LENGTH) {
    throw new Error('La foto sigue siendo demasiado grande. Prueba con otra.');
  }
  return dataUrl;
}

// Las opciones comunes: solo imágenes, una, con recorte cuadrado (el recorte lo hace el sistema;
// en iOS el aspecto es siempre cuadrado). Calidad 1 aquí porque la compresión se hace al reducir
const OPCIONES: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 1,
};

async function abrirGaleria() {
  const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permiso.granted) {
    throw new Error(
      'Sin permiso para ver tus fotos. Dáselo a Expo Go en los ajustes del teléfono.',
    );
  }
  const res = await ImagePicker.launchImageLibraryAsync(OPCIONES);
  return res.canceled ? undefined : res.assets[0];
}

async function hacerFoto() {
  const permiso = await ImagePicker.requestCameraPermissionsAsync();
  if (!permiso.granted) {
    throw new Error(
      'Sin permiso para usar la cámara. Dáselo a Expo Go en los ajustes del teléfono.',
    );
  }
  // La cámara frontal es la natural para una foto de perfil
  const res = await ImagePicker.launchCameraAsync({
    ...OPCIONES,
    cameraType: ImagePicker.CameraType.front,
  });
  return res.canceled ? undefined : res.assets[0];
}
