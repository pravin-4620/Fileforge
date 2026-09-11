import User from '../models/User.js'
import Conversion from '../models/Conversion.js'
import File from '../models/File.js'
import { conversionQueue } from '../services/queue.js'
import { removeQuietly } from '../utils/files.js'
export async function dashboard(req,res){const [users,conversions,failed,storage,recentUsers]=await Promise.all([User.countDocuments(),Conversion.countDocuments(),Conversion.countDocuments({status:'failed'}),Conversion.aggregate([{$match:{status:'completed'}},{$group:{_id:null,n:{$sum:'$outputFile.size'}}}]),User.find().sort('-createdAt').limit(5).select('-password').lean()]);res.json({users,conversions,failed,storage:storage[0]?.n||0,queued:conversionQueue.size,running:conversionQueue.running,recentUsers})}
export async function users(req,res){res.json({users:await User.find().select('-password').sort('-createdAt').limit(250)})}
export async function conversions(req,res){res.json({conversions:await Conversion.find().populate('userId','name email').sort('-createdAt').limit(250)})}
export async function deleteUser(req,res){if(String(req.user._id)===req.params.id)return res.status(400).json({message:'You cannot delete your own account'});const files=await File.find({createdBy:req.params.id});const conversions=await Conversion.find({userId:req.params.id});await Promise.all([...files.map(x=>removeQuietly(x.storagePath)),...conversions.map(x=>removeQuietly(x.inputFile?.path,x.outputFile?.path))]);await Promise.all([File.deleteMany({createdBy:req.params.id}),Conversion.deleteMany({userId:req.params.id}),User.deleteOne({_id:req.params.id})]);res.status(204).end()}
export async function deleteAnyFile(req,res){const file=await File.findById(req.params.id);if(!file)return res.status(404).json({message:'File not found'});await removeQuietly(file.storagePath);await file.deleteOne();res.status(204).end()}
