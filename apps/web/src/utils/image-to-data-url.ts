// La foto de perfil se guarda en la API como texto en base64 ("data:image/jpeg;base64,...") de 200 000
// caracteres como mucho. Una foto de móvil son varios MB, así que antes de enviarla se reduce aquí, en
// el navegador: se pinta en un <canvas> a un tamaño pequeño y se vuelve a sacar como JPEG.

// Lado mayor de la foto reducida, en píxeles. Para un círculo de perfil sobra
const MAX_SIDE = 640;

// Calidad del JPEG (0 a 1). Con 0.82 una foto de 640 px queda muy por debajo de los 200 KB
const QUALITY = 0.82;

export function imageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Se reduce manteniendo la proporción, solo si la foto es más grande que MAX_SIDE
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('No se ha podido procesar la imagen'));
        return;
      }
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', QUALITY));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('El fichero no es una imagen'));
    };

    img.src = url;
  });
}
