const maximumImageSize = 5 * 1024 * 1024
const maximumOutputSize = 150_000
const acceptedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

export async function processProductImage(file: File): Promise<string> {
  if (!acceptedImageTypes.has(file.type)) {
    throw new Error('Choose a JPEG, PNG, or WebP image.')
  }
  if (file.size > maximumImageSize) {
    throw new Error('Image must be 5 MB or smaller.')
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('This file is not a valid image')
  }

  let canvas: HTMLCanvasElement | undefined
  try {
    const processingCanvas = document.createElement('canvas')
    canvas = processingCanvas
    const squareSize = Math.min(bitmap.width, bitmap.height)
    const outputSize = Math.min(squareSize, 800)
    const sourceX = (bitmap.width - squareSize) / 2
    const sourceY = (bitmap.height - squareSize) / 2
    processingCanvas.width = outputSize
    processingCanvas.height = outputSize
    const context = processingCanvas.getContext('2d')
    if (!context) throw new Error('Image processing is not available in this browser.')
    context.drawImage(
      bitmap,
      sourceX,
      sourceY,
      squareSize,
      squareSize,
      0,
      0,
      outputSize,
      outputSize,
    )

    for (const quality of [0.8, 0.7, 0.6]) {
      const blob = await new Promise<Blob>((resolve, reject) => {
        processingCanvas.toBlob(
          (result) => result ? resolve(result) : reject(new Error('Image could not be compressed.')),
          'image/jpeg',
          quality,
        )
      })
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          if (typeof reader.result === 'string') resolve(reader.result)
          else reject(new Error('Processed image could not be read.'))
        }
        reader.onerror = () => reject(new Error('Processed image could not be read.'))
        reader.readAsDataURL(blob)
      })
      if (dataUrl.length <= maximumOutputSize) return dataUrl
    }
    throw new Error('Image could not be compressed under 150 KB. Choose a smaller image.')
  } finally {
    bitmap.close()
    if (canvas) {
      canvas.width = 0
      canvas.height = 0
    }
  }
}
