import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import transcriptRouter from './transcripts/routes'
import geminiRouter from './gemini/route'
import notesRouter from './notes/routes'
import sessionsRouter from './sessions/routes'
import libraryRouter from './library/routes'

// Dynamically import dotenv for ESM compatibility
const loadDotEnv = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const dotenv = await import('dotenv');
    dotenv.config();
  }
};
loadDotEnv();

const app = express()
const PORT = process.env.PORT || 5000

// Logging
app.use(morgan('dev'))

// Dynamically handle CORS for local and production
const allowedOrigins = [
  "http://localhost:5173", 
  process.env.FRONTEND_URL // Add your Vercel frontend URL to .env on Vercel
].filter(Boolean) as string[]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))

app.use(express.json())

// Request logger for debugging
app.use((req, res, next) => {
  console.log(`[Incoming Request] ${req.method} ${req.url}`)
  next()
})

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/transcripts', transcriptRouter)
app.use('/gemini', geminiRouter)
app.use('/notes', notesRouter)
app.use('/sessions', sessionsRouter)
app.use('/library', libraryRouter)

// 404 Handler
app.use((req, res) => {
  console.log(`[404] Not Found: ${req.method} ${req.url}`)
  res.status(404).json({ error: 'Route not found' })
})

// Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('[Server Error]', err)
  res.status(500).json({ error: 'Internal server error' })
})

// Traditional listen for local development
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port http://localhost:${PORT}`)
        console.log('Registered Routes: /transcripts, /gemini, /notes, /sessions, /library')
    })
}

// Export for Vercel Serverless Functions
export default app
