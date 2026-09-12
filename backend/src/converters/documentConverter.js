import path from 'node:path'
import fs from 'node:fs/promises'
import os from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { PDFParse } from 'pdf-parse'
import { outputPath, run } from './base.js'
import { canUseOnlyOffice, onlyOfficeConvert } from './onlyOfficeConverter.js'

const supported = ['pdf', 'docx', 'pptx', 'txt', 'html', 'md', 'odt', 'epub']
const libreOfficeBinary = () => process.env.LIBREOFFICE_PATH
  || (process.platform === 'darwin' ? '/Applications/LibreOffice.app/Contents/MacOS/soffice' : 'libreoffice')
const pdf2docxBinary = () => process.env.PDF2DOCX_PATH
  || fileURLToPath(new URL('../../.venv/bin/pdf2docx', import.meta.url))

async function textToPdf(input, out) {
  const text = await fs.readFile(input, 'utf8')
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const lines = text.replace(/<[^>]*>/g, '').split(/\r?\n/)
  let page = pdf.addPage([612, 792])
  let y = 750
  for (const raw of lines) {
    for (let i = 0; i < Math.max(1, Math.ceil(raw.length / 90)); i += 1) {
      if (y < 48) {
        page = pdf.addPage([612, 792])
        y = 750
      }
      page.drawText(raw.slice(i * 90, (i + 1) * 90), { x: 48, y, size: 10, font, color: rgb(.09, .12, .11) })
      y -= 15
    }
  }
  await fs.writeFile(out, await pdf.save())
}

async function libreOfficeConvert(input, target, outputDir) {
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'fileforge-lo-profile-'))
  const targetSpec = target === 'md' ? 'txt:Text' : target
  const generatedExtension = target === 'md' ? 'txt' : target
  const generated = path.join(outputDir, `${path.parse(input).name}.${generatedExtension}`)
  try {
    await run(libreOfficeBinary(), [
      `-env:UserInstallation=${pathToFileURL(profile).href}`,
      '--headless', '--convert-to', targetSpec, '--outdir', outputDir, input,
    ])
    try { await fs.access(generated) }
    catch { throw Object.assign(new Error(`Document conversion did not produce a ${target.toUpperCase()} file. The source may be damaged or password-protected.`), { status: 422 }) }
    return generated
  } finally {
    await fs.rm(profile, { recursive: true, force: true })
  }
}

async function convertWithLibreOffice(input, target) {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'fileforge-document-'))
  const final = outputPath(input, target)
  try {
    const generated = await libreOfficeConvert(input, target, workspace)
    await fs.copyFile(generated, final)
    return final
  } catch (error) {
    await fs.rm(final, { force: true }).catch(() => {})
    throw error
  } finally {
    await fs.rm(workspace, { recursive: true, force: true })
  }
}

async function extractPdfText(input) {
  const data = await fs.readFile(input)
  const parser = new PDFParse({ data: new Uint8Array(data) })
  try {
    const result = await parser.getText()
    return result.text
  } finally {
    await parser.destroy()
  }
}

async function convertPdf(input, target) {
  if (target === 'docx') {
    const layoutAwareOutput = outputPath(input, target)
    try {
      await run(pdf2docxBinary(), ['convert', input, layoutAwareOutput, '--raw_exceptions=True'])
      return layoutAwareOutput
    } catch {
      await fs.unlink(layoutAwareOutput).catch(() => {})
      // Fall through to the text reconstruction path when layout analysis cannot parse the PDF.
    }
  }
  const text = await extractPdfText(input)
  if (!text.trim()) throw Object.assign(new Error('This PDF has no extractable text. Scanned PDFs require OCR.'), { status: 422 })
  const final = outputPath(input, target)
  if (target === 'txt' || target === 'md') {
    await fs.writeFile(final, text, 'utf8')
    return final
  }
  if (target === 'html') {
    const escaped = text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    await fs.writeFile(final, `<!doctype html><html><meta charset="utf-8"><body><pre>${escaped}</pre></body></html>`, 'utf8')
    return final
  }
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'fileforge-pdf-'))
  try {
    const textInput = path.join(workspace, 'document.txt')
    await fs.writeFile(textInput, text, 'utf8')
    const generated = await libreOfficeConvert(textInput, target, workspace)
    await fs.copyFile(generated, final)
    return final
  } catch (error) {
    await fs.rm(final, { force: true }).catch(() => {})
    throw error
  } finally {
    await fs.rm(workspace, { recursive: true, force: true })
  }
}

export default {
  category: ['document', 'ebook'],
  supported,
  canConvert: (from, to) => {
    if (from === 'pptx') return to === 'pdf'
    if (to === 'pptx') return false
    return supported.includes(from) && supported.includes(to)
  },
  async convert(input, target, source) {
    if (source === 'pdf' && target !== 'pdf') return convertPdf(input, target)
    if (canUseOnlyOffice(source, target)) {
      try { return await onlyOfficeConvert(input, target, source) }
      catch (error) { console.warn(`ONLYOFFICE fallback: ${error.message}`) }
    }
    if (['txt', 'md', 'html'].includes(source) && target === 'pdf') {
      const out = outputPath(input, 'pdf')
      await textToPdf(input, out)
      return out
    }
    return convertWithLibreOffice(input, target)
  },
}
