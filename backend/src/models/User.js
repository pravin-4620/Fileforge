import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
const schema=new mongoose.Schema({name:{type:String,required:true,trim:true,maxlength:80},email:{type:String,required:true,unique:true,lowercase:true,trim:true,index:true},password:{type:String,required:true,select:false},avatar:String,isAdmin:{type:Boolean,default:false},lastActive:{type:Date,default:Date.now}},{timestamps:true})
schema.pre('save',async function(next){if(this.isModified('password'))this.password=await bcrypt.hash(this.password,12);next()})
schema.methods.comparePassword=function(password){return bcrypt.compare(password,this.password)}
schema.methods.toPublic=function(){return{id:this._id,name:this.name,email:this.email,avatar:this.avatar,isAdmin:this.isAdmin,createdAt:this.createdAt}}
export default mongoose.model('User',schema)
