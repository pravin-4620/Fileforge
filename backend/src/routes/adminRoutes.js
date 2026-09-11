import { Router } from 'express'
import { conversions,dashboard,deleteAnyFile,deleteUser,users } from '../controllers/adminController.js'
import { adminOnly,protect } from '../middleware/auth.js'
const router=Router();router.use(protect,adminOnly);router.get('/users',users);router.delete('/users/:id',deleteUser);router.delete('/files/:id',deleteAnyFile);router.get('/conversions',conversions);router.get('/dashboard',dashboard);export default router
