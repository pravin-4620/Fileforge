import fs from 'node:fs/promises'
import path from 'node:path'
export async function cleanupExpired(){const root=path.resolve('uploads'),retention=Number(process.env.FILE_RETENTION_HOURS||24)*3600_000;let entries=[];try{entries=await fs.readdir(root,{withFileTypes:true})}catch{return}const now=Date.now();await Promise.all(entries.filter(x=>x.isFile()&&x.name!=='.gitkeep').map(async x=>{const p=path.join(root,x.name);const stat=await fs.stat(p);if(now-stat.mtimeMs>retention)await fs.unlink(p).catch(()=>{})}))}
export function scheduleCleanup(){cleanupExpired();const timer=setInterval(cleanupExpired,60*60_000);timer.unref()}
