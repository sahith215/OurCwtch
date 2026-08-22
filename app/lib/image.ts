const MAX_IMAGE_BYTES = 350_000
const MAX_IMAGE_DIMENSION = 1280

export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      const context = canvas.getContext('2d')
      if (!context) {
        reject(new Error('Could not process this image.'))
        return
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height)

      let quality = 0.78
      const encode = () => {
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        if (dataUrl.length <= MAX_IMAGE_BYTES || quality <= 0.42) {
          if (dataUrl.length > MAX_IMAGE_BYTES) {
            reject(new Error('This image is too large even after compression. Choose a smaller image.'))
          } else {
            resolve(dataUrl)
          }
          return
        }
        quality -= 0.08
        encode()
      }
      encode()
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not read this image.'))
    }
    image.src = objectUrl
  })
}
