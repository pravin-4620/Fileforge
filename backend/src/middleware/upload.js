import multer from 'multer'
import path from 'node:path'
import crypto from 'node:crypto'
const root=path.resolve('uploads')
const storage=multer.diskStorage({destination:root,filename:(req,file,cb)=>cb(null,`${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`)})
export const upload=multer({storage,limits:{fileSize:Number(process.env.MAX_FILE_SIZE_MB||500)*1024*1024,files:20}})
