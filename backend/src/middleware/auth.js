import jwt from 'jsonwebtoken'
import User from '../models/User.js'
export async function protect(req,res,next){try{const token=req.headers.authorization?.startsWith('Bearer ')?req.headers.authorization.slice(7):null;if(!token)return res.status(401).json({message:'Authentication required'});const decoded=jwt.verify(token,process.env.JWT_SECRET);req.user=await User.findById(decoded.id);if(!req.user)return res.status(401).json({message:'User no longer exists'});req.user.lastActive=new Date();req.user.save().catch(()=>{});next()}catch{return res.status(401).json({message:'Invalid or expired session'})}}
export function adminOnly(req,res,next){if(!req.user?.isAdmin)return res.status(403).json({message:'Administrator access required'});next()}
