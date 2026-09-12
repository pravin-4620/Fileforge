export function notFound(req,res){res.status(404).json({message:`Route ${req.method} ${req.originalUrl} not found`})}
export function errorHandler(err,req,res,next){
  if(err.name==='MulterError')return res.status(400).json({message:err.code==='LIMIT_FILE_SIZE'?'File exceeds upload limit':err.message})
  console.error(err)
  const status=Number(err.status)||500
  const operational=status>=400&&status<500
  res.status(status).json({message:operational||process.env.NODE_ENV!=='production'?err.message||'Something went wrong':'The conversion service could not complete this request. Please retry.'})
}
