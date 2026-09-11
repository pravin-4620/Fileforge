import mongoose from 'mongoose'
const fileSide={originalName:String,filename:String,format:String,size:Number,path:String,category:String}
const schema=new mongoose.Schema({userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},inputFile:fileSide,outputFile:fileSide,conversionType:String,processingTime:Number,status:{type:String,enum:['queued','processing','completed','failed'],default:'queued',index:true},error:String,downloadUrl:String,favorite:{type:Boolean,default:false}},{timestamps:true})
export default mongoose.model('Conversion',schema)
