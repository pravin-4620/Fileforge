import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
const schema=new mongoose.Schema({name:{type:String,required:true,trim:true,maxlength:80},email:{type:String,required:true,unique:true,lowercase:true,trim:true,index:true},password:{type:String,select:false},avatar:String,authProvider:{type:String,enum:['local','google'],default:'local'},googleId:{type:String,index:true,sparse:true},isAdmin:{type:Boolean,default:false},lastActive:{type:Date,default:Date.now}},{timestamps:true})
schema.pre('validate',function(next){if(this.authProvider==='local'&&!this.password)this.invalidate('password','Password is required');next()})
schema.pre('save',async function(next){if(this.isModified('password')&&this.password)this.password=await bcrypt.hash(this.password,12);next()})
schema.methods.comparePassword=function(password){return this.password?bcrypt.compare(password,this.password):false}
schema.methods.toPublic=function(){return{id:this._id,name:this.name,email:this.email,avatar:this.avatar,isAdmin:this.isAdmin,authProvider:this.authProvider,createdAt:this.createdAt}}
export default mongoose.model('User',schema)
