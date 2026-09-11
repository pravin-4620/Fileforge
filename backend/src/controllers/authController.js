import jwt from 'jsonwebtoken'
import { z } from 'zod'
import User from '../models/User.js'
const credentials=z.object({email:z.string().email().transform(x=>x.toLowerCase()),password:z.string().min(8)});const registration=credentials.extend({name:z.string().trim().min(2).max(80)})
const token=id=>jwt.sign({id},process.env.JWT_SECRET,{expiresIn:'7d'})
export async function register(req,res){const data=registration.parse(req.body);if(await User.exists({email:data.email}))return res.status(409).json({message:'An account with that email already exists'});const user=await User.create(data);res.status(201).json({token:token(user._id),user:user.toPublic()})}
export async function login(req,res){const data=credentials.parse(req.body);const user=await User.findOne({email:data.email}).select('+password');if(!user||!await user.comparePassword(data.password))return res.status(401).json({message:'Email or password is incorrect'});res.json({token:token(user._id),user:user.toPublic()})}
export function profile(req,res){res.json({user:req.user.toPublic()})}
