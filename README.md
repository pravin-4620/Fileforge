# Fileforge — Universal File Converter

Fileforge is a full-stack conversion workspace built with React, Vite, Tailwind CSS, Express, MongoDB, and a plugin-based conversion engine. It supports accounts, conversion history, batch queues, ZIP exports, admin analytics, dark mode, and automatic temporary-file cleanup.

## What is included

- JWT authentication with bcrypt password hashing, Google sign-in, and protected routes
- Responsive React dashboard, drag/drop and folder uploads, cancellation, retry states, concurrent batches, and batch output selection
- MongoDB-backed file and conversion records with search, filter, repeat download, and deletion
- YouTube link inspection and single-video downloads to MP4, WebM, MP3, or M4A via yt-dlp
- Converter plugins for ONLYOFFICE, Sharp/ImageMagick, FFmpeg, LibreOffice/PDF-Lib/pdf2docx, and 7-Zip
- Bounded in-process conversion queue, rate limiting, validation, secure headers, logging, and hourly cleanup
- Admin-only analytics and service status
- Swagger UI at `http://localhost:5001/api/docs`

## Requirements

- Node.js 20+
- MongoDB 7+
- FFmpeg for audio and video
- LibreOffice for Office, PDF, ODT, and EPUB paths
- Docker Desktop for the primary ONLYOFFICE document conversion service
- 7-Zip (`7z`) for archive paths
- yt-dlp with its default extras for YouTube link downloads
- Python 3.10+ with `backend/requirements.txt` for layout-aware PDF-to-DOCX conversion

Sharp is installed as a Node dependency and handles the common image formats. Some uncommon codecs, notably HEIC/HEIF, depend on the codecs available in the installed Sharp/libvips build.

PDF-to-DOCX uses local text extraction followed by LibreOffice document generation. It works best for text-based PDFs; complex page layouts are simplified, and image-only scans return an OCR-required validation message instead of an empty document.

## Local setup

1. Install dependencies from the repository root:

   ```bash
   npm install
   ```

   For higher-fidelity PDF-to-DOCX conversion, create the local Python environment:

   ```bash
   python3 -m venv backend/.venv
   backend/.venv/bin/pip install -r backend/requirements.txt
   ```

2. Create environment files:

   ```bash
   cp backend/.env.example backend/.env
   cp client/.env.example client/.env
   ```

3. Replace `JWT_SECRET` with a long random value and start MongoDB.

4. Start the higher-fidelity ONLYOFFICE service:

   ```bash
   docker compose up -d onlyoffice
   ```

5. Start both applications:

   ```bash
   npm run dev
   ```

The web app runs at `http://localhost:5173`; the API runs at `http://localhost:5001`.

For a single-origin test deployment, set `SERVE_CLIENT=true`, build the client, and open the API port. The included production environment makes the frontend use relative `/api` requests:

```bash
npm run build
npm start
```

## Production build

```bash
npm run build
NODE_ENV=production npm start
```

Serve `client/dist` behind a CDN or reverse proxy, route `/api` to the Express service, and mount `backend/uploads` on encrypted ephemeral or object-backed storage. Use a managed MongoDB replica set, rotate the JWT secret, enforce HTTPS, and set `CLIENT_URL` to the exact public origin.

## Vercel + Render deployment

The included deployment files are set up for Vercel hosting the React client and Render hosting the Express API.

1. Create a MongoDB Atlas database and copy the connection string.
2. Create a Google OAuth Web Client in Google Cloud Console. Add these authorized JavaScript origins:

   ```text
   http://localhost:5173
   https://your-vercel-app.vercel.app
   ```

3. Deploy the backend on Render from this repository. Render will read `render.yaml` and build the Docker image with FFmpeg, ImageMagick, LibreOffice, 7-Zip, Python PDF tools, and yt-dlp.
4. Add these Render environment variables:

   ```text
   MONGODB_URI=<your MongoDB Atlas URI>
   CLIENT_URL=https://fileforge-client.vercel.app,http://localhost:5173
   GOOGLE_CLIENT_ID=<your Google OAuth Web Client ID>
   YTDLP_JS_RUNTIME=node
   ```

   Keep `SERVE_CLIENT=false` on Render because Vercel serves the frontend.

   YouTube may block cloud-hosted Render IPs with a "Sign in to confirm you're not a bot" challenge. If that happens, export cookies from a dedicated YouTube account into `youtube-cookies.txt`, add it to Render as a Secret File, and set:

   ```text
   YTDLP_COOKIES_PATH=/etc/secrets/youtube-cookies.txt
   ```

   Never commit cookies to GitHub. Treat them like passwords, use a dedicated account, and rotate them if they are exposed.

5. Deploy the frontend on Vercel with root directory set to `client`, build command `npm run build`, and output directory `dist`.
6. Add these Vercel environment variables:

   ```text
   VITE_API_URL=https://your-render-service.onrender.com/api
   VITE_GOOGLE_CLIENT_ID=<the same Google OAuth Web Client ID>
   ```

7. After Vercel gives you the final public URL, update Render `CLIENT_URL` and the Google OAuth authorized origins with that exact Vercel URL.

## Converter architecture

`backend/src/converters/index.js` is the registry. Each converter declares its category and supported formats and implements `canConvert(from, to)` and `convert(input, target, source)`. Add a new plugin by implementing that interface and registering it in the plugins array.

Office conversions first use the JWT-protected ONLYOFFICE DocumentServer container and fall back to LibreOffice if that service is unavailable. Supported presentation input includes PPTX-to-PDF with slide layout, images, and text rendered by the office engine. PDF-to-DOCX uses the layout-aware local `pdf2docx` engine and falls back to text reconstruction for PDFs it cannot parse. Scanned PDFs without a text layer require a separate OCR engine.

The YouTube downloader accepts HTTPS URLs from YouTube domains only, disables playlists and local yt-dlp configuration, runs yt-dlp with a JavaScript runtime for current YouTube extraction, optionally reads cookies from `YTDLP_COOKIES_PATH`, and enforces the configured maximum file size. Users should only download media they own or have permission to save.

Conversions are queued with configurable concurrency (`CONVERSION_CONCURRENCY`, default `1` for memory-safe production operation). The client warms sleeping Render instances before uploading and submits batch items sequentially. Records transition through `queued`, `processing`, `completed`, or `failed`. Upload and output files expire after `FILE_RETENTION_HOURS`; the database retains the audit record until the user deletes it.

## API summary

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/google` | Sign in with Google ID token |
| GET | `/api/auth/profile` | Current profile |
| POST | `/api/files/upload` | Upload up to 20 files |
| GET | `/api/files` | List files |
| DELETE | `/api/files/:id` | Delete file |
| POST | `/api/convert` | Upload and convert one file |
| GET | `/api/history` | Search/filter conversion history |
| DELETE | `/api/history/:id` | Remove conversion and stored bytes |
| POST | `/api/files/download-all` | Stream selected outputs as ZIP |
| GET | `/api/admin/dashboard` | Admin metrics and queue health |
| GET | `/api/admin/users` | Admin user list |
| GET | `/api/admin/conversions` | Admin conversion list |

All routes except registration, login, health, documentation, and expiring download URLs require `Authorization: Bearer <token>`.

## Admin access

Accounts are non-admin by default. Promote a trusted account directly in MongoDB:

```javascript
db.users.updateOne({ email: "admin@example.com" }, { $set: { isAdmin: true } })
```

## Operational notes

- This implementation stores uploads on local disk. For horizontal production deployments, replace storage with S3-compatible object storage and back the queue with BullMQ/Redis.
- Long conversions currently keep the HTTP request open while a bounded queue protects the host. For multi-node workloads, return a job ID and publish progress over SSE or WebSockets.
- Email delivery is intentionally provider-neutral; attach an email adapter to the completed-job event when SMTP or a transactional provider is selected.
- RAR creation may be restricted by the locally installed archiver. The API returns the underlying tool diagnostic instead of producing a misleading file.
