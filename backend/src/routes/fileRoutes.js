import { Router } from 'express'
import { deleteFile,downloadAll,downloadConversion,listFiles,uploadFiles } from '../controllers/fileController.js'
import { protect } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
const router=Router();router.use(protect);router.post('/upload',upload.array('files',20),uploadFiles);router.get('/',listFiles);router.get('/download/:conversionId',downloadConversion);router.delete('/:id',deleteFile);router.post('/download-all',downloadAll);export default router
