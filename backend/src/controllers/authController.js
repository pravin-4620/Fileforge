import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
import { z } from 'zod'
import User from '../models/User.js'
const credentials=z.object({email:z.string().email().transform(x=>x.toLowerCase()),password:z.string().min(8)});const registration=credentials.extend({name:z.string().trim().min(2).max(80)})
const googlePayload=z.object({credential:z.string().min(20)})
const token=id=>jwt.sign({id},process.env.JWT_SECRET,{expiresIn:'7d'})
const googleAudiences=()=>String(process.env.GOOGLE_CLIENT_IDS||process.env.GOOGLE_CLIENT_ID||'').split(',').map(value=>value.trim()).filter(Boolean)
export async function register(req,res){const data=registration.parse(req.body);if(await User.exists({email:data.email}))return res.status(409).json({message:'An account with that email already exists'});const user=await User.create(data);res.status(201).json({token:token(user._id),user:user.toPublic()})}
export async function login(req,res){const data=credentials.parse(req.body);const user=await User.findOne({email:data.email}).select('+password');if(!user||!await user.comparePassword(data.password))return res.status(401).json({message:'Email or password is incorrect'});res.json({token:token(user._id),user:user.toPublic()})}
export async function googleLogin(req,res){
  const audiences=googleAudiences()
  if(!audiences.length)return res.status(503).json({message:'Google sign-in is not configured on the server'})
  const { credential }=googlePayload.parse(req.body)
  const claimedAudience=jwt.decode(credential)?.aud
  if(claimedAudience&&!audiences.includes(claimedAudience))return res.status(503).json({message:'Google OAuth client IDs do not match between Vercel and Render'})
  const client=new OAuth2Client(audiences[0])
  let ticket
  try{ticket=await client.verifyIdToken({idToken:credential,audience:audiences})}
  catch{ return res.status(401).json({message:'Google could not verify this sign-in. Please choose your account again.'}) }
  const payload=ticket.getPayload()
  if(!payload?.email_verified)return res.status(401).json({message:'Google account email is not verified'})
  const email=payload.email.toLowerCase()
  const updates={name:payload.name||email.split('@')[0],avatar:payload.picture,authProvider:'google',googleId:payload.sub,lastActive:new Date()}
  const user=await User.findOneAndUpdate({email},{$set:updates}, {new:true,upsert:true,setDefaultsOnInsert:true})
  res.json({token:token(user._id),user:user.toPublic()})
}
export function profile(req,res){res.json({user:req.user.toPublic()})}
