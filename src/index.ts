import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import morgan from 'morgan'
import transcriptRouter from './transcripts/routes'
import geminiRouter from './gemini/route'
import notesRouter from './notes/routes'
import sessionsRouter from './sessions/routes'
import libraryRouter from './library/routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Logging
app.use(morgan('dev'))

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}))
app.use(express.json())

// Request logger for debugging 404s
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

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`)
  console.log('Registered Routes: /transcripts, /gemini, /notes, /sessions, /library')
})