import fs from 'node:fs/promises'
import path from 'node:path'
import app from './app.js'
import { connectDB } from './config/db.js'
import { scheduleCleanup } from './services/cleanup.js'
const port=Number(process.env.PORT||5001)
if(!process.env.JWT_SECRET){console.error('JWT_SECRET is required. Copy .env.example to .env.');process.exit(1)}
await fs.mkdir(path.resolve('uploads'),{recursive:true});await connectDB();const server=app.listen(port,()=>console.log(`Fileforge API listening on http://localhost:${port}`));scheduleCleanup();const shutdown=()=>server.close(()=>process.exit(0));process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown)
