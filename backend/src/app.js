import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import path from 'node:path'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './config/swagger.js'
import authRoutes from './routes/authRoutes.js'
import fileRoutes from './routes/fileRoutes.js'
import conversionRoutes from './routes/conversionRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import youtubeRoutes from './routes/youtubeRoutes.js'
import simpleEnglishRoutes from './routes/simpleEnglishRoutes.js'
import { errorHandler, notFound } from './middleware/error.js'
import { onlyOfficeInput } from './controllers/internalController.js'

const normalizeOrigin = value => String(value || '').trim().replace(/\/$/, '')
const allowedOrigins = new Set(
  (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean),
)
const corsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(normalizeOrigin(origin))) return callback(null, true)
    return callback(Object.assign(new Error('Origin is not allowed by CORS'), { status: 403 }))
  },
}

const app = express()
app.set('trust proxy', 1)
app.disable('etag')
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", 'https://accounts.google.com'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'img-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'", 'http://localhost:5001'],
      'frame-src': ["'self'", 'https://accounts.google.com'],
    },
  },
}))
app.use(cors(corsOptions))
app.options('/{*path}', cors(corsOptions))
app.use(compression())
app.use(express.json({ limit: '1mb' }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})
app.use('/api', rateLimit({ windowMs: 15 * 60_000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }))
app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }))
app.get('/internal/onlyoffice/:token', onlyOfficeInput)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
app.use('/api/auth', authRoutes)
app.use('/api/files', fileRoutes)
app.use('/api', conversionRoutes)
app.use('/api/youtube', youtubeRoutes)
app.use('/api/simple-english', simpleEnglishRoutes)
app.use('/api/admin', adminRoutes)

if (process.env.SERVE_CLIENT === 'true') {
  const client = path.resolve('../client/dist')
  app.use(express.static(client))
  app.get('/{*path}', (req, res, next) => req.path.startsWith('/api/') || req.path.startsWith('/internal/')
    ? next()
    : res.sendFile(path.join(client, 'index.html')))
}

app.use(notFound)
app.use(errorHandler)

export default app
