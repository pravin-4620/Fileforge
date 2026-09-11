import path from 'node:path'
import jwt from 'jsonwebtoken'
import { exists } from '../utils/files.js'

export async function onlyOfficeInput(req, res) {
  let decoded
  try { decoded = jwt.verify(req.params.token, process.env.ONLYOFFICE_JWT_SECRET) }
  catch { return res.status(401).json({ message: 'Invalid or expired conversion token' }) }
  const uploadRoot = path.resolve('uploads')
  const file = path.resolve(decoded.file || '')
  if (!file.startsWith(`${uploadRoot}${path.sep}`) || !await exists(file)) return res.status(404).json({ message: 'Conversion input not found' })
  res.set('Cache-Control', 'no-store')
  res.sendFile(file)
}
