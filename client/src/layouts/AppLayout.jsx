import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  HiOutlineArrowRightOnRectangle,
  HiOutlineArrowsRightLeft,
  HiOutlineBars3,
  HiOutlineBell,
  HiOutlineClock,
  HiOutlineCog6Tooth,
  HiOutlineMoon,
  HiOutlineShieldCheck,
  HiOutlineSquares2X2,
  HiOutlineSun,
  HiOutlineXMark,
} from 'react-icons/hi2'
import Logo from '../components/Logo'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

const links = [
  ['/app', HiOutlineSquares2X2, 'Overview', true],
  ['/app/convert', HiOutlineArrowsRightLeft, 'Convert'],
  ['/app/history', HiOutlineClock, 'History'],
  ['/app/settings', HiOutlineCog6Tooth, 'Settings'],
]

export default function AppLayout() {
  const [open, setOpen] = useState(false)
  const { dark, toggle } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const closeOnEscape = event => event.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  return <div className="min-h-screen min-h-dvh overflow-x-clip bg-[#f3f5f4] text-ink dark:bg-[#101514] dark:text-white">
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[min(86vw,280px)] flex-col overflow-y-auto bg-[#18211f] px-5 py-5 text-white transition-transform duration-300 lg:w-64 lg:translate-x-0 lg:py-6 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between">
        <Logo light/>
        <button aria-label="Close menu" onClick={() => setOpen(false)} className="grid h-11 w-11 place-items-center rounded-xl text-xl text-white/60 hover:bg-white/10 hover:text-white lg:hidden"><HiOutlineXMark/></button>
      </div>
      <nav className="sidebar-nav mt-8 flex-1 space-y-1 lg:mt-12">
        {links.map(([to, Icon, label, end]) => <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? 'bg-white/10 text-mint' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
          <Icon className="shrink-0 text-xl"/>{label}
        </NavLink>)}
        {user?.isAdmin && <NavLink to="/app/admin" onClick={() => setOpen(false)} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? 'bg-white/10 text-mint' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
          <HiOutlineShieldCheck className="shrink-0 text-xl"/>Admin
        </NavLink>}
      </nav>
      <div className="sidebar-profile mt-auto pt-5">
        <div className="mb-3 flex items-center gap-3 rounded-2xl bg-white/[.06] p-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mint font-extrabold text-ink">{user?.name?.[0]?.toUpperCase()}</div>
          <div className="min-w-0"><p className="truncate text-sm font-semibold">{user?.name}</p><p className="truncate text-xs text-white/40">{user?.email}</p></div>
        </div>
        <button onClick={() => { logout(); navigate('/') }} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/50 hover:bg-white/5 hover:text-white"><HiOutlineArrowRightOnRectangle/>Sign out</button>
      </div>
    </aside>

    <div className="min-w-0 lg:pl-64">
      <header className="app-header sticky top-0 z-20 flex h-16 items-center justify-between border-b border-black/[.06] bg-white/70 px-4 backdrop-blur-xl dark:border-white/[.07] dark:bg-[#141a19]/80 sm:h-20 sm:px-6 md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-2xl hover:bg-black/5 dark:hover:bg-white/10 lg:hidden"><HiOutlineBars3/></button>
          <div className="min-w-0"><p className="hidden text-xs font-bold uppercase tracking-[.16em] text-black/40 dark:text-white/40 sm:block">Workspace</p><p className="truncate text-sm font-bold sm:text-base">Personal Vault</p></div>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <button aria-label="Toggle theme" onClick={toggle} className="grid h-11 w-11 place-items-center rounded-full hover:bg-black/5 dark:hover:bg-white/10">{dark ? <HiOutlineSun/> : <HiOutlineMoon/>}</button>
          <button aria-label="Notifications" className="relative grid h-11 w-11 place-items-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"><HiOutlineBell/><i className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-teal"/></button>
        </div>
      </header>
      <main className="app-content mx-auto w-full max-w-[1500px] min-w-0 px-4 py-5 sm:px-6 sm:py-6 xl:px-8 xl:py-8"><Outlet/></main>
    </div>

    {open && <button aria-label="Close menu overlay" className="fixed inset-0 z-30 bg-black/45 backdrop-blur-[1px] lg:hidden" onClick={() => setOpen(false)}/>}
  </div>
}
