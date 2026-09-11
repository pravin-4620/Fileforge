import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { HiArrowDownTray, HiOutlineMagnifyingGlass, HiOutlineTrash } from 'react-icons/hi2'
import api from '../services/api'
import FileGlyph from '../components/FileGlyph'
import { prettyBytes } from '../utils/formats'
import { downloadConversion } from '../utils/download'

const sourceFormat = item => item.inputFile?.format?.toUpperCase() || '—'
const outputFormat = item => item.outputFile?.format?.toUpperCase() || '—'

export default function History() {
  const [rows, setRows] = useState([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setLoading(true)
      api.get('/history', { params: { search: query, status, _: Date.now() }, signal: controller.signal, headers: { 'Cache-Control': 'no-cache' } })
        .then(response => setRows(Array.isArray(response.data?.recent) ? response.data.recent : []))
        .catch(error => { if (error.code !== 'ERR_CANCELED') toast.error('Could not load history') })
        .finally(() => setLoading(false))
    }, 200)
    return () => { clearTimeout(timer); controller.abort() }
  }, [query, status])

  const remove = async id => {
    try {
      await api.delete(`/history/${id}`)
      setRows(items => items.filter(item => item._id !== id))
      toast.success('Conversion removed')
    } catch { toast.error('Could not remove conversion') }
  }
  const save = async item => {
    try { await downloadConversion(item) }
    catch (error) { toast.error(error.response?.data?.message || 'Download failed') }
  }

  return <div className="animate-enter min-w-0">
    <div><p className="mono text-xs font-bold tracking-widest text-teal">YOUR FILES</p><h1 className="page-heading mt-2 font-extrabold tracking-[-.045em]">Conversion history</h1><p className="mt-1 text-sm text-black/40 dark:text-white/40 sm:text-base">Find, download, or clean up previous files.</p></div>
    <section className="mt-6 overflow-hidden rounded-2xl border border-black/[.05] bg-white dark:border-white/[.06] dark:bg-[#18201f] sm:mt-8">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:justify-between">
        <label className="flex min-h-12 flex-1 items-center gap-2 rounded-xl bg-[#f1f3f2] px-3 dark:bg-white/[.06] sm:max-w-md"><HiOutlineMagnifyingGlass className="shrink-0 text-black/30 dark:text-white/30"/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search filenames…" className="min-w-0 w-full bg-transparent py-3 text-sm outline-none"/></label>
        <select aria-label="Filter conversion status" value={status} onChange={event => setStatus(event.target.value)} className="min-h-12 rounded-xl bg-[#f1f3f2] px-4 py-3 text-sm font-bold outline-none dark:bg-white/[.06]"><option value="">All statuses</option><option value="completed">Completed</option><option value="failed">Failed</option></select>
      </div>

      {!loading && rows.length > 0 && <>
        <div className="history-desktop overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="bg-black/[.02] text-xs uppercase tracking-widest text-black/35 dark:bg-black/10 dark:text-white/35"><th className="px-5 py-3">File</th><th className="px-5 py-3">Conversion</th><th className="px-5 py-3">Size</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody className="divide-y divide-black/[.05] dark:divide-white/[.06]">{rows.map(item => <tr key={item._id} className="hover:bg-black/[.015] dark:hover:bg-white/[.02]">
              <td className="px-5 py-4"><div className="flex min-w-52 items-center gap-3"><FileGlyph small category={item.inputFile?.category}/><p className="max-w-48 truncate text-sm font-bold" title={item.inputFile?.originalName}>{item.inputFile?.originalName}</p></div></td>
              <td className="mono whitespace-nowrap px-5 py-4 text-xs">{sourceFormat(item)} → {outputFormat(item)}</td>
              <td className="whitespace-nowrap px-5 py-4 text-xs text-black/45 dark:text-white/45">{prettyBytes(item.outputFile?.size)}</td>
              <td className="whitespace-nowrap px-5 py-4 text-xs text-black/45 dark:text-white/45">{new Date(item.createdAt).toLocaleDateString()}</td>
              <td className="px-5 py-4"><StatusBadge status={item.status}/></td>
              <td className="px-5 py-4"><div className="flex gap-1">{item.status === 'completed' && <button aria-label={`Download ${item.inputFile?.originalName}`} onClick={() => save(item)} className="grid h-10 w-10 place-items-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><HiArrowDownTray/></button>}<button aria-label={`Delete ${item.inputFile?.originalName}`} onClick={() => remove(item._id)} className="grid h-10 w-10 place-items-center rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"><HiOutlineTrash/></button></div></td>
            </tr>)}</tbody>
          </table>
        </div>

        <div className="history-mobile divide-y divide-black/[.05] dark:divide-white/[.06]">{rows.map(item => <article key={item._id} className="min-w-0 p-4">
          <div className="flex min-w-0 items-start gap-3"><FileGlyph small category={item.inputFile?.category}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold" title={item.inputFile?.originalName}>{item.inputFile?.originalName}</p><p className="mono mt-1 text-xs text-black/45 dark:text-white/45">{sourceFormat(item)} → {outputFormat(item)}</p></div><StatusBadge status={item.status}/></div>
          <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-black/[.025] p-3 text-xs dark:bg-white/[.035]"><div><dt className="text-black/35 dark:text-white/35">Output size</dt><dd className="mt-1 font-bold">{prettyBytes(item.outputFile?.size)}</dd></div><div><dt className="text-black/35 dark:text-white/35">Converted</dt><dd className="mt-1 font-bold">{new Date(item.createdAt).toLocaleDateString()}</dd></div></dl>
          <div className="mt-3 grid grid-cols-2 gap-2">{item.status === 'completed' && <button onClick={() => save(item)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal px-4 text-sm font-bold text-white"><HiArrowDownTray/>Download</button>}<button onClick={() => remove(item._id)} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-bold text-red-500 dark:border-red-900/50 ${item.status !== 'completed' ? 'col-span-2' : ''}`}><HiOutlineTrash/>Delete</button></div>
        </article>)}</div>
      </>}

      {loading && <div className="grid place-items-center py-16"><div className="h-7 w-7 animate-spin rounded-full border-2 border-black/10 border-t-teal dark:border-white/10 dark:border-t-teal"/></div>}
      {!loading && !rows.length && <div className="px-5 py-16 text-center text-sm text-black/35 dark:text-white/35">No matching conversions.</div>}
    </section>
  </div>
}

function StatusBadge({ status }) {
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold uppercase ${status === 'completed' ? 'bg-mint/40 text-[#506c0b]' : 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300'}`}>{status}</span>
}
