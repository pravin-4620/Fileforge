import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Settings() {
  const { user } = useAuth()
  const { dark, toggle } = useTheme()
  return <div className="animate-enter max-w-3xl min-w-0">
    <p className="mono text-xs font-bold tracking-widest text-teal">PREFERENCES</p><h1 className="page-heading mt-2 font-extrabold tracking-[-.045em]">Settings</h1>
    <section className="mt-6 rounded-2xl border border-black/[.05] bg-white p-5 dark:border-white/[.06] dark:bg-[#18201f] sm:mt-8 sm:p-6"><h2 className="font-extrabold">Profile</h2><div className="mt-5 flex min-w-0 items-center gap-4"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-mint text-xl font-extrabold text-ink sm:h-16 sm:w-16 sm:text-2xl">{user?.name?.[0]}</div><div className="min-w-0"><p className="truncate font-bold">{user?.name}</p><p className="truncate text-sm text-black/40 dark:text-white/40">{user?.email}</p></div></div></section>
    <section className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-black/[.05] bg-white p-5 dark:border-white/[.06] dark:bg-[#18201f] sm:p-6"><div className="min-w-0"><h2 className="font-extrabold">Dark appearance</h2><p className="mt-1 text-sm text-black/40 dark:text-white/40">Use the darker workspace theme.</p></div><button aria-label="Toggle dark appearance" aria-pressed={dark} onClick={toggle} className={`h-7 w-12 shrink-0 rounded-full p-1 transition ${dark ? 'bg-teal' : 'bg-black/15'}`}><span className={`block h-5 w-5 rounded-full bg-white transition ${dark ? 'translate-x-5' : ''}`}/></button></section>
  </div>
}
