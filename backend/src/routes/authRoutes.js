import { Router } from 'express'
import { googleLogin,login,profile,register } from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'
const router=Router();router.post('/register',register);router.post('/login',login);router.post('/google',googleLogin);router.get('/profile',protect,profile);export default router
