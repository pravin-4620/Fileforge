import { Router } from 'express'
import { convert,history,removeHistory } from '../controllers/conversionController.js'
import { protect } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
const router=Router();router.post('/convert',protect,upload.single('file'),convert);router.get('/history',protect,history);router.delete('/history/:id',protect,removeHistory);export default router
