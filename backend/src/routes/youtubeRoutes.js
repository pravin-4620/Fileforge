import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { protect } from '../middleware/auth.js'
import { youtubeDownload, youtubeInfo } from '../controllers/youtubeController.js'
const router=Router();router.use(protect,rateLimit({windowMs:60*60_000,limit:20,standardHeaders:'draft-7',legacyHeaders:false}));router.post('/info',youtubeInfo);router.post('/download',youtubeDownload);export default router
