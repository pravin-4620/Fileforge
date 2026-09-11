import path from 'node:path'
import fs from 'node:fs/promises'
export const categoryFrom=(mime='',ext='')=>mime.startsWith('image/')?'image':mime.startsWith('video/')?'video':mime.startsWith('audio/')?'audio':['zip','rar','tar','gz','gzip','7z'].includes(ext)?'archive':['epub','mobi'].includes(ext)?'ebook':'document'
export const safeExt=name=>path.extname(name).slice(1).toLowerCase()
export async function removeQuietly(...paths){await Promise.all(paths.filter(Boolean).map(p=>fs.unlink(p).catch(()=>{})))}
export async function exists(p){try{await fs.access(p);return true}catch{return false}}
