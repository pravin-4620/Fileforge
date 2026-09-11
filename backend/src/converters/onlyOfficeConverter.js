import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import jwt from 'jsonwebtoken'
import { outputPath } from './base.js'

const supportedInputs = new Set(['docx', 'pptx', 'odt', 'txt', 'html', 'epub'])
const supportedOutputs = new Set(['pdf', 'docx', 'odt', 'txt', 'html', 'epub'])

export function canUseOnlyOffice(source, target) {
  if (source === 'pptx') return target === 'pdf'
  return supportedInputs.has(source) && supportedOutputs.has(target)
}

export async function onlyOfficeConvert(input, target, source) {
  if (!canUseOnlyOffice(source, target)) throw Object.assign(new Error('ONLYOFFICE does not support this conversion path'), { status: 422 })
  const server = process.env.ONLYOFFICE_URL || 'http://127.0.0.1:8080'
  const internal = process.env.ONLYOFFICE_INTERNAL_URL || 'http://host.docker.internal:5001'
  const secret = process.env.ONLYOFFICE_JWT_SECRET
  if (!secret) throw Object.assign(new Error('ONLYOFFICE_JWT_SECRET is not configured'), { status: 503 })
  const key = crypto.createHash('sha256').update(`${input}:${Date.now()}:${crypto.randomUUID()}`).digest('hex').slice(0, 32)
  const inputToken = jwt.sign({ file: path.resolve(input) }, secret, { expiresIn: '5m' })
  const payload = {
    async: false,
    filetype: source,
    key,
    outputtype: target,
    title: path.basename(input),
    url: `${internal}/internal/onlyoffice/${encodeURIComponent(inputToken)}`,
  }
  const requestToken = jwt.sign(payload, secret, { expiresIn: '5m' })
  let response
  try {
    response = await fetch(`${server}/converter?shardkey=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${requestToken}` },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(180_000),
    })
  } catch (error) {
    throw Object.assign(new Error(`ONLYOFFICE service is unavailable: ${error.message}`), { status: 503 })
  }
  if (!response.ok) throw Object.assign(new Error(`ONLYOFFICE returned HTTP ${response.status}`), { status: 502 })
  const result = await response.json()
  if (result.error) throw Object.assign(new Error(`ONLYOFFICE conversion error ${result.error}`), { status: 422 })
  if (!result.endConvert || !result.fileUrl) throw Object.assign(new Error('ONLYOFFICE did not finish the conversion'), { status: 502 })
  const converted = await fetch(result.fileUrl, { signal: AbortSignal.timeout(180_000) })
  if (!converted.ok) throw Object.assign(new Error(`ONLYOFFICE output download failed with HTTP ${converted.status}`), { status: 502 })
  const out = outputPath(input, target)
  await fs.writeFile(out, new Uint8Array(await converted.arrayBuffer()))
  return out
}
