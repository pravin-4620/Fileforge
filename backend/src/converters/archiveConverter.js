import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { outputPath,run } from './base.js'
const supported=['zip','rar','tar','gz','gzip','7z']
export default {category:'archive',supported,canConvert:(from,to)=>supported.includes(from)&&supported.includes(to),async convert(input,target){const normalized=target==='gzip'?'gz':target;if(normalized==='rar')throw Object.assign(new Error('Creating RAR archives is unavailable because the format requires a proprietary writer'),{status:422});const temp=await fs.mkdtemp(path.join(os.tmpdir(),'fileforge-'));const out=outputPath(input,normalized);try{await run(process.env.SEVENZIP_PATH||'7z',['x',input,`-o${temp}`]);await run(process.env.SEVENZIP_PATH||'7z',['a',`-t${normalized}`,out,path.join(temp,'*')]);return out}finally{await fs.rm(temp,{recursive:true,force:true})}}}
