import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { createSimpleEnglishPrompt } from '../controllers/simpleEnglishController.js'
import { protect } from '../middleware/auth.js'

const router = Router()
const promptLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many prompt requests. Please wait a moment and try again.' },
})

router.post('/', protect, promptLimiter, createSimpleEnglishPrompt)

export default router
