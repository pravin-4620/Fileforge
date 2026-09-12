import { useCallback, useMemo, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import {
  HiArrowDownTray, HiOutlineArrowPath, HiOutlineCloudArrowUp, HiOutlineFolderOpen,
  HiOutlineLink, HiOutlinePause, HiOutlinePlay, HiOutlineTrash, HiOutlineXMark,
} from 'react-icons/hi2'
import api, { apiErrorMessage, ensureApiReady } from '../services/api'
import FileGlyph from '../components/FileGlyph'
import { categoryOf, formats, prettyBytes } from '../utils/formats'
import { downloadConversion } from '../utils/download'

const makeItem = file => ({ id: crypto.randomUUID(), file, category: categoryOf(file), status: 'ready', progress: 0, target: '', result: null, error: '' })
const extensionOf = file => file.name.split('.').pop().toUpperCase()
const maxFileSizeMb = Math.max(1, Number(import.meta.env.VITE_MAX_FILE_SIZE_MB || 100))
const targetFormatsFor = item => item.category === 'document' && extensionOf(item.file) === 'PPTX'
  ? ['PDF']
  : formats[item.category] || formats.document

export default function Converter() {
  const [mode, setMode] = useState('files')
  const [items, setItems] = useState([])
  const [batchTarget, setBatchTarget] = useState('')
  const [processing, setProcessing] = useState(false)
  const [warming, setWarming] = useState(false)
  const controllers = useRef(new Set())
  const onDrop = useCallback(files => setItems(old => [...old, ...files.map(makeItem)]), [])
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({ onDrop, noClick: true, noKeyboard: true, maxSize: maxFileSizeMb * 1024 * 1024, onDropRejected: r => toast.error(`${r.length} file(s) exceed the ${maxFileSizeMb} MB limit`) })
  const compatible = useMemo(() => {
    if (!items.length) return []
    const [first, ...remaining] = items.map(targetFormatsFor)
    return first.filter(format => remaining.every(list => list.includes(format)))
  }, [items])
  const setTarget = (id, target) => setItems(xs => xs.map(x => x.id === id ? { ...x, target } : x))
  const remove = id => setItems(xs => xs.filter(x => x.id !== id))

  const convertOne = async item => {
    const target = batchTarget || item.target
    const form = new FormData()
    form.append('file', item.file)
    form.append('targetFormat', target.toLowerCase())
    setItems(xs => xs.map(x => x.id === item.id ? { ...x, status: 'uploading', progress: 1, error: '' } : x))
    const controller = new AbortController()
    controllers.current.add(controller)
    try {
      const { data } = await api.post('/convert', form, {
        signal: controller.signal,
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: event => {
          const uploaded = Math.round((event.loaded / event.total) * 100)
          setItems(xs => xs.map(x => x.id === item.id ? { ...x, status: uploaded === 100 ? 'processing' : 'uploading', progress: uploaded === 100 ? 88 : Math.round(uploaded * .8) } : x))
        },
      })
      setItems(xs => xs.map(x => x.id === item.id ? { ...x, status: 'completed', progress: 100, result: data.conversion } : x))
      toast.success(`${item.file.name} is ready`)
    } catch (error) {
      const message = apiErrorMessage(error, 'Conversion failed')
      setItems(xs => xs.map(x => x.id === item.id ? { ...x, status: 'failed', progress: 0, error: message } : x))
      toast.error(message)
    } finally {
      controllers.current.delete(controller)
    }
  }

  const convert = async () => {
    const queue = items.filter(x => x.status !== 'completed' && (batchTarget || x.target))
    if (!queue.length) return toast.error('Choose an output format first')
    setWarming(true)
    try {
      await ensureApiReady()
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not reach the conversion server'))
      return
    } finally {
      setWarming(false)
    }
    setProcessing(true)
    try {
      // A single worker keeps LibreOffice, FFmpeg, and Sharp inside small-host memory limits.
      for (const item of queue) await convertOne(item)
    } finally {
      setProcessing(false)
    }
  }
  const cancel = () => controllers.current.forEach(controller => controller.abort())
  const downloadAll = async () => {
    try {
      const conversionIds = items.filter(x => x.result).map(x => x.result._id)
      const response = await api.post('/files/download-all', { conversionIds }, { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'fileforge-exports.zip'
      anchor.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Could not create ZIP') }
  }

  return <div className="animate-enter mx-auto max-w-5xl min-w-0">
    <div><p className="mono text-xs text-teal font-bold tracking-widest">CONVERTER</p><h1 className="page-heading mt-2 font-extrabold tracking-[-.045em]">Make files work your way.</h1><p className="mt-1 text-sm text-black/40 dark:text-white/40 sm:text-base">Convert local files or save media from a YouTube link.</p></div>
    <div className="converter-tabs mt-7 inline-flex rounded-xl bg-black/[.05] p-1 dark:bg-white/[.06]">
      <ModeButton active={mode === 'files'} onClick={() => setMode('files')} icon={HiOutlineCloudArrowUp}>Upload files</ModeButton>
      <ModeButton active={mode === 'youtube'} onClick={() => setMode('youtube')} icon={HiOutlineLink}>YouTube link</ModeButton>
    </div>
    {mode === 'youtube' ? <YoutubePanel /> : <>
      <div {...getRootProps()} className={`relative mt-5 overflow-hidden rounded-2xl border-2 border-dashed p-5 text-center transition sm:rounded-[1.75rem] sm:p-8 lg:p-12 ${isDragActive ? 'scale-[1.01] border-teal bg-teal/10' : 'border-black/10 bg-white dark:border-white/10 dark:bg-[#18201f]'}`}>
        <input {...getInputProps()} /><div className="absolute inset-0 dot-grid opacity-20"/><div className="relative"><div className="mx-auto w-16 h-16 grid place-items-center bg-ink dark:bg-mint text-mint dark:text-ink rounded-2xl text-3xl"><HiOutlineCloudArrowUp/></div><h2 className="mt-5 font-extrabold text-xl">{isDragActive ? 'Release to add files' : 'Drop files or folders here'}</h2><p className="text-sm text-black/35 dark:text-white/35 mt-1">Up to {maxFileSizeMb} MB each · all major formats supported</p><div className="mt-6 flex justify-center gap-3 flex-wrap"><button onClick={open} className="bg-ink text-white dark:bg-white dark:text-ink px-5 py-3 rounded-xl text-sm font-bold">Browse files</button><label className="cursor-pointer border border-black/10 dark:border-white/10 px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2"><HiOutlineFolderOpen/>Choose folder<input type="file" webkitdirectory="" multiple hidden onChange={e => onDrop([...e.target.files])}/></label></div></div>
      </div>
      {items.length > 0 && <section className="mt-6 bg-white dark:bg-[#18201f] rounded-2xl border border-black/[.05] dark:border-white/[.06] overflow-hidden">
        <div className="px-5 py-4 flex flex-wrap gap-3 items-center justify-between border-b border-black/[.06] dark:border-white/[.06]"><div><h2 className="font-extrabold">Conversion queue <span className="ml-1 text-xs text-black/30 dark:text-white/30">{items.length}</span></h2><p className="text-xs text-black/35 dark:text-white/35">{prettyBytes(items.reduce((sum, x) => sum + x.file.size, 0))} total</p></div>{compatible.length > 0 && <label className="flex items-center gap-2 text-xs font-bold text-black/45 dark:text-white/45">Convert all to <select value={batchTarget} onChange={e => setBatchTarget(e.target.value)} className="bg-[#f0f3f2] dark:bg-white/10 text-ink dark:text-white rounded-lg px-3 py-2 outline-none"><option value="">Choose format</option>{compatible.map(x => <option key={x}>{x}</option>)}</select></label>}</div>
        <div className="divide-y divide-black/[.05] dark:divide-white/[.06]">{items.map(item => <FileRow key={item.id} item={item} target={batchTarget || item.target} setTarget={target => setTarget(item.id, target)} remove={() => remove(item.id)}/>)}</div>
        <div className="flex flex-col gap-3 bg-[#fafbfb] p-4 dark:bg-black/10 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"><button onClick={() => setItems([])} disabled={processing || warming} className="flex min-h-11 items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-black/40 dark:text-white/40 sm:justify-start"><HiOutlineTrash/>Clear queue</button><div className="grid gap-2 sm:flex">{items.some(x => x.status === 'completed') && <button onClick={downloadAll} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-black/10 px-5 py-2.5 text-sm font-bold dark:border-white/10"><HiArrowDownTray/>Download all</button>}{processing ? <button onClick={cancel} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-bold text-white"><HiOutlinePause/>Cancel</button> : <button onClick={convert} disabled={warming} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal px-6 py-2.5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-70">{warming ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Starting converter…</> : <><HiOutlinePlay/>Convert {items.filter(x => x.status !== 'completed').length} file{items.length !== 1 ? 's' : ''}</>}</button>}</div></div>
      </section>}
    </>}
  </div>
}

function ModeButton({ active, onClick, icon: Icon, children }) {
  return <button onClick={onClick} className={`flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-bold transition ${active ? 'bg-white text-teal shadow-sm dark:bg-[#26302e]' : 'text-black/40 dark:text-white/40'}`}><Icon/>{children}</button>
}

function YoutubePanel() {
  const [url, setUrl] = useState('')
  const [format, setFormat] = useState('mp4')
  const [video, setVideo] = useState(null)
  const [busy, setBusy] = useState('')
  const [result, setResult] = useState(null)
  const inspect = async () => {
    if (!url.trim()) return toast.error('Paste a YouTube link first')
    setBusy('inspect')
    setResult(null)
    try { const { data } = await api.post('/youtube/info', { url }); setVideo(data.video) }
    catch (error) { toast.error(error.response?.data?.message || 'Could not read that YouTube link') }
    finally { setBusy('') }
  }
  const download = async () => {
    setBusy('download')
    try { const { data } = await api.post('/youtube/download', { url, format }); setResult(data.conversion); toast.success('Media is ready to download') }
    catch (error) { toast.error(error.response?.data?.message || 'YouTube download failed') }
    finally { setBusy('') }
  }
  const saveResult = async () => {
    try { await downloadConversion(result) }
    catch (error) { toast.error(error.response?.data?.message || 'Could not download the prepared file') }
  }
  return <section className="mt-5 rounded-[1.75rem] bg-white dark:bg-[#18201f] border border-black/[.06] dark:border-white/[.06] overflow-hidden">
    <div className="border-b border-black/[.06] p-5 dark:border-white/[.06] sm:p-6 md:p-8"><div className="flex min-w-0 items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-500 text-white"><HiOutlinePlay className="text-xl"/></span><div className="min-w-0"><h2 className="text-lg font-extrabold sm:text-xl">YouTube downloader</h2><p className="text-xs text-black/40 dark:text-white/40">Single public videos · playlists are disabled</p></div></div><div className="mt-6 flex flex-col gap-2 sm:flex-row"><input type="url" value={url} onChange={e => { setUrl(e.target.value); setVideo(null); setResult(null) }} onKeyDown={e => e.key === 'Enter' && inspect()} placeholder="https://www.youtube.com/watch?v=…" className="min-h-12 min-w-0 flex-1 rounded-xl bg-[#f1f4f3] px-4 py-3.5 outline-none focus:ring-2 focus:ring-teal/30 dark:bg-white/[.06]"/><button onClick={inspect} disabled={Boolean(busy)} className="min-h-12 rounded-xl bg-ink px-6 py-3 font-bold text-white disabled:opacity-50 dark:bg-white dark:text-ink">{busy === 'inspect' ? 'Checking…' : 'Check link'}</button></div></div>
    {video && <div className="p-5 md:p-8 min-w-0 overflow-hidden">
      <div className="min-w-0"><p className="font-extrabold text-lg md:text-xl break-words">{video.title}</p><p className="text-sm text-black/40 dark:text-white/40 mt-1">{video.uploader}{video.duration ? ` · ${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}` : ''}</p></div>
      <fieldset className="mt-6 min-w-0"><legend className="mb-3 text-xs font-extrabold uppercase tracking-[.12em] text-black/40 dark:text-white/40">Choose output format</legend><div className="youtube-format-grid">{[['mp4','Video'],['webm','Video'],['mp3','Audio'],['m4a','Audio']].map(([value,type]) => <button type="button" key={value} onClick={() => { setFormat(value); setResult(null) }} className={`min-h-14 min-w-0 rounded-xl border-2 px-4 py-3 text-left transition ${format === value ? 'border-teal bg-teal/10 text-teal' : 'border-black/[.07] hover:border-black/20 dark:border-white/10 dark:hover:border-white/20'}`}><span className="mono block text-sm font-bold">{value.toUpperCase()}</span><span className="mt-0.5 block text-xs opacity-55">{type} format</span></button>)}</div></fieldset>
      {video.thumbnail && <div className="mt-6 w-full overflow-hidden rounded-2xl bg-black/5"><img src={video.thumbnail} alt="Video thumbnail" className="block w-full h-auto max-h-[340px] aspect-video object-cover"/></div>}
      <div className="mt-6 flex flex-col md:flex-row gap-3 md:items-center justify-between"><p className="text-xs text-black/35 dark:text-white/35 max-w-lg">Download only content you own or have permission to save.</p>{result ? <button onClick={saveResult} className="w-full md:w-auto shrink-0 bg-mint text-ink rounded-xl px-6 py-3 font-bold flex items-center justify-center gap-2"><HiArrowDownTray/>Download {format.toUpperCase()}</button> : <button onClick={download} disabled={Boolean(busy)} className="w-full md:w-auto shrink-0 bg-teal text-white rounded-xl px-6 py-3 font-bold flex items-center justify-center gap-2 disabled:opacity-50">{busy === 'download' ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Preparing media…</> : <><HiArrowDownTray/>Prepare {format.toUpperCase()}</>}</button>}</div>
    </div>}
  </section>
}

function FileRow({ item, target, setTarget, remove }) {
  const extension = extensionOf(item.file)
  const choices = targetFormatsFor(item)
  const save = async () => { try { await downloadConversion(item.result) } catch (error) { toast.error(error.response?.data?.message || 'Download failed') } }
  return <div className="file-row p-4">
    <FileGlyph category={item.category}/>
    <div className="file-row-name min-w-0"><p className="truncate text-sm font-bold" title={item.file.name}>{item.file.name}</p><p className="truncate text-xs text-black/35 dark:text-white/35">{prettyBytes(item.file.size)} · {item.file.type || 'Unknown MIME'}</p></div>
    <div className="file-row-convert flex min-w-0 items-center gap-2"><span className="mono shrink-0 rounded-lg bg-black/[.04] px-3 py-2 text-xs dark:bg-white/[.06]">{extension}</span><span className="shrink-0 text-black/25 dark:text-white/25">→</span><select aria-label={`Output format for ${item.file.name}`} disabled={item.status === 'completed'} value={target} onChange={e => setTarget(e.target.value)} className="min-h-10 min-w-0 flex-1 rounded-lg bg-black/[.04] px-3 py-2 text-xs font-bold outline-none dark:bg-white/[.06]"><option value="">FORMAT</option>{choices.filter(x => x !== extension).map(x => <option key={x}>{x}</option>)}</select></div>
    <div className="file-row-status min-w-0">{['uploading', 'processing'].includes(item.status) && <><div className="flex justify-between text-xs font-bold"><span>{item.status === 'uploading' ? 'UPLOADING' : 'PROCESSING'}</span><span>{item.progress}%</span></div><div className="mt-1 h-1.5 rounded bg-black/10"><div className="h-full rounded bg-teal transition-all" style={{ width: `${item.progress}%` }}/></div></>}{item.status === 'completed' && <button onClick={save} className="flex min-h-10 items-center gap-1 text-sm font-bold text-teal"><HiArrowDownTray/>Download</button>}{item.status === 'failed' && <span title={item.error} className="flex items-center gap-1 text-xs font-bold text-red-500"><HiOutlineArrowPath/>Retry ready</span>}{item.status === 'ready' && <span className="text-xs text-black/30 dark:text-white/30">Ready</span>}</div>
    <button onClick={remove} className="file-row-remove grid h-10 w-10 place-items-center rounded-lg text-black/30 hover:bg-black/5 dark:text-white/30 dark:hover:bg-white/5" aria-label={`Remove ${item.file.name}`}><HiOutlineXMark/></button>
  </div>
}
