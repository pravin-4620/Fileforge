export function notFound(req,res){res.status(404).json({message:`Route ${req.method} ${req.originalUrl} not found`})}
export function errorHandler(err,req,res,next){
  if(err.name==='MulterError')return res.status(400).json({message:err.code==='LIMIT_FILE_SIZE'?'File exceeds upload limit':err.message})
  if(err.name==='ZodError')return res.status(400).json({message:err.issues?.[0]?.message||'Please check the information you entered'})
  console.error(err)
  const status=Number(err.status)||500
  const operational=status>=400&&status<500
  const safeToExpose=operational||err.expose===true||process.env.NODE_ENV!=='production'
  res.status(status).json({message:safeToExpose?err.message||'Something went wrong':'The conversion service could not complete this request. Please retry.'})
}
