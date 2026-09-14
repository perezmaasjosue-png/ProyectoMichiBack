function guardarImagen(buffer) {
  return {
    imageLocalPath: null,
    imageUrl: null,
    imagenBase64: buffer.toString('base64'),
  };
}

module.exports = { guardarImagen };