import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import Conversion from '../models/Conversion.js'
import { runCapture } from '../converters/base.js'

const formats = ['mp4', 'webm', 'mp3', 'm4a']
const hosts = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be'])
const jsRuntime = process.env.YTDLP_JS_RUNTIME || 'node'

function validateUrl(raw) {
  let parsed
  try { parsed = new URL(String(raw)) } catch { throw Object.assign(new Error('Enter a valid YouTube URL'), { status: 400 }) }
  if (parsed.protocol !== 'https:' || !hosts.has(parsed.hostname.toLowerCase())) {
    throw Object.assign(new Error('Only HTTPS YouTube links are supported'), { status: 400 })
  }
  return parsed.toString()
}

const binary = () => process.env.YTDLP_PATH || 'yt-dlp'
const baseArgs = () => {
  const args = [
    '--ignore-config',
    '--no-playlist',
    '--js-runtimes',
    jsRuntime,
  ]
  if (process.env.YTDLP_COOKIES_PATH) args.push('--cookies', process.env.YTDLP_COOKIES_PATH)
  return args
}

function youtubeError(error) {
  const message = error?.message || ''
  if (message.includes('Sign in to confirm') || message.includes('--cookies-from-browser') || message.includes('--cookies')) {
    return Object.assign(
      new Error('YouTube blocked this server as automated traffic. Add a Render secret file for YouTube cookies and set YTDLP_COOKIES_PATH, then retry.'),
      { status: 422 },
    )
  }
  if (message.includes('JS runtime') || message.includes('JavaScript')) {
    return Object.assign(new Error('YouTube needs a JavaScript runtime for this link. The backend image must be redeployed with the latest downloader runtime.'), { status: 503 })
  }
  return error
}

const safeInfo = info => ({
  title: info.title,
  duration: info.duration,
  uploader: info.uploader,
  thumbnail: info.thumbnail,
  webpageUrl: info.webpage_url,
})

async function getInfo(url) {
  const { stdout } = await runCapture(binary(), [...baseArgs(), '--skip-download', '--dump-single-json', url], { timeout: 90_000 })
  return JSON.parse(stdout.trim().split('\n').at(-1))
}

export async function youtubeInfo(req,res) {
  const url = validateUrl(req.body.url)
  let info
  try {
    info = await getInfo(url)
  } catch (error) {
    throw youtubeError(error)
  }
  res.json({ video: safeInfo(info), formats })
}

export async function youtubeDownload(req,res) {
  const url = validateUrl(req.body.url)
  const target = String(req.body.format || '').toLowerCase()
  if (!formats.includes(target)) return res.status(400).json({ message: 'Choose MP4, WebM, MP3, or M4A' })
  const started = Date.now()
  const prefix = `youtube-${crypto.randomUUID()}`
  const uploadRoot = path.resolve('uploads')
  const template = path.join(uploadRoot, `${prefix}-%(title).80B-%(id)s.%(ext)s`)
  const args = [...baseArgs(), '--restrict-filenames', '--max-filesize', `${process.env.MAX_FILE_SIZE_MB || 100}M`, '--print', 'after_move:filepath', '-o', template]
  if (target === 'mp3' || target === 'm4a') args.push('-x', '--audio-format', target, '--audio-quality', '0')
  else if (target === 'mp4') args.push('-f', 'bv*[ext=mp4][height<=1080]+ba[ext=m4a]/b[ext=mp4][height<=1080]/b', '--merge-output-format', 'mp4')
  else args.push('-f', 'bv*[ext=webm][height<=1080]+ba[ext=webm]/b[ext=webm][height<=1080]/b', '--merge-output-format', 'webm')
  args.push(url)
  let stdout
  try {
    const result = await runCapture(binary(), args)
    stdout = result.stdout
  } catch (error) {
    throw youtubeError(error)
  }
  let output = stdout.trim().split('\n').filter(Boolean).at(-1)
  if (!output || !path.basename(output).startsWith(prefix)) {
    const match = (await fs.readdir(uploadRoot)).find(name => name.startsWith(prefix))
    if (!match) throw Object.assign(new Error('The download completed but its output file was not found'), { status: 500 })
    output = path.join(uploadRoot, match)
  }
  output = path.resolve(output)
  if (!output.startsWith(`${uploadRoot}${path.sep}`)) throw Object.assign(new Error('Invalid downloader output path'), { status: 500 })
  const stat = await fs.stat(output)
  const filename = path.basename(output)
  const title = filename.replace(`${prefix}-`, '').replace(/\.[^.]+$/, '').replaceAll('_', ' ')
  const category = target === 'mp3' || target === 'm4a' ? 'audio' : 'video'
  const conversion = await Conversion.create({
    userId: req.user._id,
    inputFile: { originalName: title, format: 'youtube', category },
    outputFile: { originalName: filename.replace(`${prefix}-`, ''), filename, format: target, size: stat.size, path: output, category },
    conversionType: `youtube_to_${target}`,
    processingTime: Date.now() - started,
    status: 'completed',
    downloadUrl: `/downloads/${encodeURIComponent(filename)}`,
  })
  res.status(201).json({ conversion })
}
