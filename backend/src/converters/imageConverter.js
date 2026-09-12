import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { assertSupported, outputPath, run } from './base.js'

const supported = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'heic', 'bmp', 'tiff', 'svg', 'ico']
const imageMagickTargets = new Set(['heic', 'bmp', 'svg', 'ico'])
const lossyTargets = new Set(['jpg', 'jpeg', 'webp', 'avif', 'heic'])
const heicDecoderScript = fileURLToPath(new URL('./decodeHeic.py', import.meta.url))
const pythonPath = process.env.HEIC_DECODER_PYTHON
  || process.env.PYTHON_PATH
  || path.resolve(process.cwd(), '.venv', 'bin', 'python')

sharp.cache({ memory: 32, files: 20, items: 100 })
sharp.concurrency(Math.max(1, Number(process.env.SHARP_CONCURRENCY || 1)))

function imageMagickArgs(input, target, output) {
  const args = [input, '-auto-orient', '-strip']
  if (lossyTargets.has(target)) args.push('-quality', target === 'avif' ? '60' : '90')
  args.push(output)
  return args
}

async function convertWithImageMagick(input, target, output) {
  await run(
    process.env.IMAGEMAGICK_PATH || 'magick',
    imageMagickArgs(input, target, output),
  )
}

function sharpPipeline(input, target) {
  const normalizedTarget = target === 'jpg' ? 'jpeg' : target
  let pipeline = sharp(input, { failOn: 'warning' }).rotate()

  if (normalizedTarget === 'jpeg') pipeline = pipeline.jpeg({ quality: 90, mozjpeg: true })
  else if (normalizedTarget === 'png') pipeline = pipeline.png({ compressionLevel: 8 })
  else if (normalizedTarget === 'webp') pipeline = pipeline.webp({ quality: 88 })
  else if (normalizedTarget === 'avif') pipeline = pipeline.avif({ quality: 55 })
  else if (normalizedTarget === 'tiff') pipeline = pipeline.tiff({ quality: 90 })

  return pipeline
}

async function decodeHeic(input, output) {
  await run(pythonPath, [heicDecoderScript, input, output])
}

async function convertHeic(input, target, output) {
  const decodedPng = outputPath(input, 'png')
  try {
    await decodeHeic(input, decodedPng)
    if (target === 'png') {
      await fs.rename(decodedPng, output)
    } else if (imageMagickTargets.has(target)) {
      await convertWithImageMagick(decodedPng, target, output)
    } else {
      await sharpPipeline(decodedPng, target).toFile(output)
    }
  } finally {
    await fs.rm(decodedPng, { force: true }).catch(() => {})
  }
}

export default {
  category: 'image',
  supported,
  canConvert: (from, to) => supported.includes(from) && supported.includes(to),

  async convert(input, target, source) {
    assertSupported(target, supported, 'Image converter')

    const normalizedSource = String(source || '').toLowerCase()
    const output = outputPath(input, target)

    // libvips and distro libheif builds can reject valid Apple HEIC metadata.
    // Decode with the bundled pillow-heif wheel so production is host-stable.
    if (normalizedSource === 'heic') {
      await convertHeic(input, target, output)
      return output
    }

    if (imageMagickTargets.has(target)) {
      await convertWithImageMagick(input, target, output)
      return output
    }

    await sharpPipeline(input, target).toFile(output)
    return output
  },
}
