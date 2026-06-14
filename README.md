# Bloc - Backend (Server)

The Bloc Server is a Node.js Express API that serves as the bridge between the frontend, the Supabase database, and the Google Gemini AI engine. It manages everything from transcript fetching to AI-generated assessments and language-aware caching.

## 🧠 AI Capabilities (Powered by Gemini 3 Flash)

### 1. Contextual Chat & History
Processes user messages in the context of the current video title, transcript, and timestamp. It maintains a memory of the conversation and respects the user's `preferred_language`.

### 2. Intelligent Content Generation
- **Topic Extraction:** Analyzes video transcripts to identify key chapters.
- **Dynamic Sanity Checks:** Generates a single-question concept check based on the content just watched.
- **Comprehensive Assessments:** Generates a 5-question multiple-choice quiz covering the entire video transcript.

### 3. Language-Aware Caching
The server implements a sophisticated caching layer using Supabase:
- **Video Metadata:** Transcripts and titles are cached to minimize external API calls.
- **Multi-lingual Topics:** Topics are cached in a map keyed by language (e.g., `{ "English": [...], "Spanish": [...] }`). This ensures that topics are only generated once per language per video.

## 🛠️ Tech Stack
- **Runtime:** Node.js
- **Framework:** Express
- **AI SDK:** `@google/genai` (Gemini 3 Flash)
- **Database:** Supabase (PostgreSQL)
- **Language:** TypeScript

## 🚀 Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Setup:**
   Create a `.env` file in the `server` directory:
   ```env
   PORT=3000
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   GEMINI_API_KEY=your_google_gemini_key
   ```

3. **Run Development Server:**
   ```bash
   npm run dev
   ```

## 📂 Architecture Note
- `/src/gemini`: Core AI controllers for chat, topics, and quiz generation.
- `/src/transcripts`: Logic for fetching and caching YouTube transcripts.
- `/src/profiles`: Management of user settings and learning preferences.
- `/src/utils`: Shared helpers for Supabase auth and API responses.
