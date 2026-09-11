import mongoose from 'mongoose'
export async function connectDB(){mongoose.set('strictQuery',true);await mongoose.connect(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017/fileforge');console.log('MongoDB connected')}
