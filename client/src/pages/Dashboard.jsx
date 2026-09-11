import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HiArrowRight, HiOutlineArrowsRightLeft, HiOutlineCircleStack, HiOutlineClock, HiOutlineHeart, HiOutlinePlus } from 'react-icons/hi2'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import StatCard from '../components/StatCard'
import FileGlyph from '../components/FileGlyph'
import { prettyBytes } from '../utils/formats'

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState({ stats: { total: 0, storage: 0, successful: 0 }, recent: [] })
  useEffect(() => { api.get('/history?limit=5').then(response => setData(response.data)).catch(() => {}) }, [])

  return <div className="animate-enter min-w-0">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0"><p className="mono text-xs font-bold tracking-widest text-teal">OVERVIEW</p><h1 className="page-heading mt-2 truncate font-extrabold tracking-[-.045em]">Hello, {user?.name?.split(' ')[0]}.</h1><p className="mt-1 text-sm text-black/40 dark:text-white/40 sm:text-base">Ready to make your files more useful?</p></div>
      <Link to="/app/convert" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white dark:bg-mint dark:text-ink"><HiOutlinePlus/>New conversion</Link>
    </div>

    <div className="stats-grid mt-6 sm:mt-8">
      <StatCard label="Total conversions" value={data.stats.total} detail="All time" icon={HiOutlineArrowsRightLeft}/>
      <StatCard label="Storage used" value={prettyBytes(data.stats.storage)} detail="Temporary files included" icon={HiOutlineCircleStack} tone="bg-[#d7eff5]"/>
      <StatCard label="Success rate" value={`${data.stats.total ? Math.round(data.stats.successful / data.stats.total * 100) : 100}%`} detail="Across all conversions" icon={HiOutlineClock} tone="bg-[#ddd7ff]"/>
      <StatCard label="Favorites" value={data.stats.favorites || 0} detail="Saved workflows" icon={HiOutlineHeart} tone="bg-[#ffd6c8]"/>
    </div>

    <div className="dashboard-grid mt-5">
      <section className="min-w-0 rounded-2xl border border-black/[.05] bg-white p-4 dark:border-white/[.06] dark:bg-[#18201f] sm:p-6">
        <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-extrabold">Recent files</h2><p className="mt-1 text-xs text-black/35 dark:text-white/35">Your latest conversions</p></div><Link to="/app/history" className="flex min-h-11 shrink-0 items-center gap-1 text-sm font-bold text-teal">View all <HiArrowRight/></Link></div>
        <div className="mt-5">{!data.recent.length ? <Empty/> : data.recent.map(item => <div key={item._id} className="flex min-w-0 items-center gap-3 border-t border-black/[.05] py-3 dark:border-white/[.06]">
          <FileGlyph small category={item.inputFile?.category}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold" title={item.inputFile?.originalName}>{item.inputFile?.originalName}</p><p className="truncate text-xs uppercase text-black/35 dark:text-white/35">{item.inputFile?.format || '—'} → {item.outputFile?.format || '—'}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold uppercase ${item.status === 'completed' ? 'bg-mint/40 text-[#4a6508]' : 'bg-amber-100 text-amber-700'}`}>{item.status}</span>
        </div>)}</div>
      </section>
      <section className="relative flex min-h-64 flex-col overflow-hidden rounded-2xl bg-[#18211f] p-5 text-white sm:p-6">
        <div className="absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-teal/30 blur-[60px]"/><p className="mono relative text-xs tracking-widest text-mint">QUICK START</p><h2 className="relative mt-4 max-w-xs text-2xl font-extrabold tracking-tight">Turn that file into something better.</h2><p className="relative mt-2 max-w-xs text-sm text-white/45">Drop multiple files, select one output, and let Fileforge handle the rest.</p><Link to="/app/convert" className="relative mt-auto rounded-xl bg-mint p-3.5 text-center text-sm font-bold text-ink">Open converter</Link>
      </section>
    </div>
  </div>
}

function Empty() {
  return <div className="py-12 text-center"><p className="font-bold">No conversions yet</p><p className="mt-1 text-sm text-black/35 dark:text-white/35">Your completed files will appear here.</p></div>
}
