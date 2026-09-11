import fs from 'node:fs'
import path from 'node:path'
import archiver from 'archiver'
import File from '../models/File.js'
import Conversion from '../models/Conversion.js'
import { categoryFrom,safeExt,removeQuietly,exists } from '../utils/files.js'
export async function uploadFiles(req,res){const files=await Promise.all((req.files||[]).map(async f=>File.create({filename:f.filename,originalName:f.originalname,originalFormat:safeExt(f.originalname),mimeType:f.mimetype,category:categoryFrom(f.mimetype,safeExt(f.originalname)),fileSize:f.size,storagePath:f.path,status:'uploaded',createdBy:req.user._id,expiresAt:new Date(Date.now()+Number(process.env.FILE_RETENTION_HOURS||24)*3600_000)})));res.status(201).json({files})}
export async function listFiles(req,res){res.json({files:await File.find({createdBy:req.user._id}).sort('-createdAt').limit(100)})}
export async function deleteFile(req,res){const file=await File.findOne({_id:req.params.id,createdBy:req.user._id});if(!file)return res.status(404).json({message:'File not found'});await removeQuietly(file.storagePath);await file.deleteOne();res.status(204).end()}
export async function downloadConversion(req,res,next){const item=await Conversion.findOne({_id:req.params.conversionId,userId:req.user._id,status:'completed'});if(!item?.outputFile?.path||!await exists(item.outputFile.path))return res.status(404).json({message:'Download is no longer available'});const filename=String(item.outputFile.originalName||path.basename(item.outputFile.path)).replace(/[\r\n"]/g,'_');res.download(path.resolve(item.outputFile.path),filename,error=>{if(error&&!res.headersSent)next(error)})}
export async function downloadAll(req,res){const ids=Array.isArray(req.body.conversionIds)?req.body.conversionIds:[];const rows=await Conversion.find({_id:{$in:ids},userId:req.user._id,status:'completed'});res.attachment('fileforge-exports.zip');const archive=archiver('zip',{zlib:{level:8}});archive.on('error',e=>res.destroy(e));archive.pipe(res);for(const row of rows)if(await exists(row.outputFile.path))archive.file(row.outputFile.path,{name:row.outputFile.originalName});archive.finalize()}
