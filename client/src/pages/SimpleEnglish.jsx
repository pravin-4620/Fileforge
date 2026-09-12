import { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import toast from 'react-hot-toast'
import {
  HiArrowDownTray,
  HiCheck,
  HiOutlineArrowPath,
  HiOutlineClipboardDocument,
  HiOutlineCodeBracketSquare,
  HiOutlineDocumentText,
  HiOutlineSparkles,
  HiOutlineTrash,
} from 'react-icons/hi2'
import api from '../services/api'

const maxCharacters = Math.max(1000, Number(import.meta.env.VITE_SIMPLE_ENGLISH_MAX_INPUT_CHARS || 50_000))
const starter = "I'm building a platform for... The main problem is... Users should be able to... I need it to use..."

function copyFallback(text) {
  const element = document.createElement('textarea')
  element.value = text
  element.style.position = 'fixed'
  element.style.opacity = '0'
  document.body.appendChild(element)
  element.select()
  const copied = document.execCommand('copy')
  element.remove()
  if (!copied) throw new Error('Copy failed')
}

function promptErrorMessage(error) {
  const message = error?.response?.data?.message
  if (message) return message
  if (error?.response?.status === 401) return 'Your session expired. Please log in again.'
  if (error?.code === 'ECONNABORTED') return 'Prompt generation took too long. Please try again with a shorter explanation.'
  return 'Unable to generate the prompt right now. Please try again.'
}

export default function SimpleEnglish() {
  const [input, setInput] = useState('')
  const [prompt, setPrompt] = useState('')
  const [filename, setFilename] = useState('simple-english-prompt.md')
  const [loading, setLoading] = useState(false)
  const [raw, setRaw] = useState(false)
  const [copied, setCopied] = useState(false)
  const remaining = maxCharacters - input.length
  const wordCount = useMemo(() => input.trim() ? input.trim().split(/\s+/).length : 0, [input])

  const generate = async () => {
    const value = input.trim()
    if (!value) return toast.error('Please enter some information before generating a prompt.')
    if (value.length < 20) return toast.error('Please add a little more detail before generating a prompt.')
    if (value.length > maxCharacters) return toast.error(`Keep your explanation under ${maxCharacters.toLocaleString()} characters.`)
    setLoading(true)
    setCopied(false)
    try {
      const { data } = await api.post('/simple-english', { input: value }, { timeout: 100_000 })
      if (!data?.prompt) throw new Error('Invalid prompt response')
      setPrompt(data.prompt)
      setFilename(data.filename || 'simple-english-prompt.md')
      setRaw(false)
      toast.success('Your AI-ready prompt is ready')
    } catch (error) {
      toast.error(promptErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    try {
      let copiedWithClipboard = false
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(prompt)
          copiedWithClipboard = true
        } catch { /* Fall back for browsers or permissions that block the Clipboard API. */ }
      }
      if (!copiedWithClipboard) copyFallback(prompt)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
      toast.success('Prompt copied')
    } catch { toast.error('Could not copy the prompt') }
  }

  const download = () => {
    try {
      const blob = new Blob([prompt], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      toast.success(`${filename} downloaded`)
    } catch { toast.error('Could not create the Markdown file') }
  }

  const clear = () => {
    setInput('')
    setPrompt('')
    setFilename('simple-english-prompt.md')
    setRaw(false)
    setCopied(false)
  }

  return <div className="simple-english-page animate-enter mx-auto max-w-6xl min-w-0">
    <section className="simple-english-hero relative overflow-hidden rounded-[1.75rem] bg-[#18211f] px-5 py-7 text-white sm:px-8 sm:py-9 lg:px-10">
      <div className="dot-grid absolute inset-0 opacity-25"/><div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-mint/20 blur-[70px]"/>
      <div className="relative max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-3 py-1.5 text-xs font-bold text-mint"><HiOutlineSparkles/>NEW FILEFORGE TOOL</span><h1 className="mt-5 text-[clamp(2.25rem,7vw,4.25rem)] font-extrabold leading-[.98] tracking-[-.055em]">Simple English<span className="text-mint">.</span></h1><p className="mt-4 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">Turn your messy ideas and explanations into a clean, structured, AI-ready prompt.</p><div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-white/40"><span>Explain normally</span><span aria-hidden="true">→</span><span>FileForge structures it</span><span aria-hidden="true">→</span><span className="text-mint">Download Markdown</span></div></div>
    </section>

    <div className={`simple-english-grid mt-5 ${prompt ? 'has-output' : ''}`}>
      <section className="min-w-0 rounded-2xl border border-black/[.06] bg-white p-4 shadow-[0_18px_55px_rgba(21,27,26,.04)] dark:border-white/[.06] dark:bg-[#18201f] sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><p className="mono text-[11px] font-bold tracking-[.14em] text-teal">01 · EXPLAIN</p><h2 className="mt-2 text-xl font-extrabold tracking-[-.03em]">Tell us everything.</h2><p className="mt-1 text-sm text-black/40 dark:text-white/40">Stories, rough notes, requirements, and technical details are all welcome.</p></div><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mint/25 text-xl text-teal"><HiOutlineDocumentText/></span></div>
        <label className="mt-5 block"><span className="sr-only">Raw project explanation</span><textarea value={input} maxLength={maxCharacters} disabled={loading} onChange={event => setInput(event.target.value)} onKeyDown={event => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') generate() }} placeholder="Tell us what you're building, what you need, and all the details you have..." className="simple-english-input min-h-[320px] w-full resize-y rounded-2xl border border-black/[.07] bg-[#f5f7f6] p-4 text-[15px] leading-7 outline-none transition placeholder:text-black/25 focus:border-teal focus:bg-white focus:ring-4 focus:ring-teal/10 disabled:opacity-60 dark:border-white/[.07] dark:bg-white/[.05] dark:placeholder:text-white/20 dark:focus:bg-white/[.07] sm:min-h-[390px] sm:p-5"/></label>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-black/35 dark:text-white/35"><span>{wordCount.toLocaleString()} words · {input.length.toLocaleString()} characters</span><span className={remaining < 1000 ? 'font-bold text-orange-500' : ''}>{remaining.toLocaleString()} remaining</span></div>
        <div className="mt-5 grid gap-2 sm:flex sm:justify-between"><button type="button" onClick={() => setInput(starter)} disabled={loading || Boolean(input)} className="min-h-12 rounded-xl border border-black/10 px-4 text-sm font-bold text-black/45 disabled:hidden dark:border-white/10 dark:text-white/45">Use a starter</button><button type="button" onClick={generate} disabled={loading} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-teal px-6 text-sm font-extrabold text-white shadow-lg shadow-teal/15 transition hover:-translate-y-0.5 disabled:cursor-wait disabled:transform-none disabled:opacity-60 sm:ml-auto">{loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Structuring your ideas…</> : <><HiOutlineSparkles className="text-lg"/>Create AI Prompt</>}</button></div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-black/25 dark:text-white/25"><span>Avoid pasting passwords, access tokens, or other secrets.</span><span>Tip: press {navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'} + Enter</span></div>
      </section>

      {prompt && <section className="min-w-0 overflow-hidden rounded-2xl border border-black/[.06] bg-white shadow-[0_18px_55px_rgba(21,27,26,.04)] dark:border-white/[.06] dark:bg-[#18201f]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[.06] px-4 py-4 dark:border-white/[.06] sm:px-6"><div><p className="mono text-[11px] font-bold tracking-[.14em] text-teal">02 · READY</p><p className="mt-1 max-w-[260px] truncate text-xs text-black/35 dark:text-white/35" title={filename}>{filename}</p></div><button onClick={() => setRaw(value => !value)} className="flex min-h-10 items-center gap-2 rounded-lg bg-black/[.04] px-3 text-xs font-bold dark:bg-white/[.06]"><HiOutlineCodeBracketSquare/>{raw ? 'Preview' : 'Raw Markdown'}</button></div>
        <div className="max-h-[650px] min-h-[420px] overflow-auto p-5 sm:p-7">{raw ? <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-6 text-black/70 dark:text-white/70">{prompt}</pre> : <div className="markdown-preview"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{a: props => <a {...props} target="_blank" rel="noreferrer"/>}}>{prompt}</ReactMarkdown></div>}</div>
        <div className="grid gap-2 border-t border-black/[.06] bg-[#fafbfb] p-4 dark:border-white/[.06] dark:bg-black/10 sm:grid-cols-2 xl:flex xl:flex-wrap"><button onClick={copy} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-black/10 px-4 text-sm font-bold dark:border-white/10">{copied ? <HiCheck className="text-teal"/> : <HiOutlineClipboardDocument/>}{copied ? 'Copied' : 'Copy Prompt'}</button><button onClick={download} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-bold text-white dark:bg-white dark:text-ink"><HiArrowDownTray/>Download .md</button><button onClick={generate} disabled={loading} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-black/10 px-4 text-sm font-bold disabled:opacity-50 dark:border-white/10"><HiOutlineArrowPath/>Generate Again</button><button onClick={clear} disabled={loading} className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-black/40 dark:text-white/40"><HiOutlineTrash/>Clear</button></div>
      </section>}
    </div>
  </div>
}
