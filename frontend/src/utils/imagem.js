// Redimensiona e regrava a foto como JPEG. Isso reduz o envio pelo celular
// e remove os metadados do arquivo original (EXIF, como modelo do aparelho).
export function comprimirImagem(arquivo, { maxLado = 1280, qualidade = 0.75 } = {}) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, maxLado / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * escala);
      canvas.height = Math.round(img.naturalHeight * escala);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error(`Não foi possível preparar a foto "${arquivo.name}".`))),
        'image/jpeg',
        qualidade,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Não foi possível ler a foto "${arquivo.name}". Use uma imagem JPG ou PNG.`));
    };
    img.src = url;
  });
}

export function blobParaDataURL(blob) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(leitor.result);
    leitor.onerror = () => reject(new Error('Não foi possível ler a foto.'));
    leitor.readAsDataURL(blob);
  });
}
