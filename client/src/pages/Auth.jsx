import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { HiArrowLeft, HiArrowRight } from 'react-icons/hi2'
import { FcGoogle } from 'react-icons/fc'
import Logo from '../components/Logo'
import { useAuth } from '../context/AuthContext'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

export default function Auth({ register = false }) {
  const { user, login, register: signup, googleLogin } = useAuth()
  const navigate = useNavigate()
  const googleButton = useRef(null)
  const [data, setData] = useState({ name: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)

  useEffect(() => {
    if (!googleClientId) return
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    const script = existing || document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => setGoogleReady(Boolean(window.google?.accounts?.id))
    if (!existing) document.body.appendChild(script)
    else setGoogleReady(Boolean(window.google?.accounts?.id))
  }, [])

  useEffect(() => {
    if (!googleReady || !googleButton.current) return
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async response => {
        setBusy(true)
        try {
          await googleLogin(response.credential)
          toast.success('Welcome to Fileforge')
          navigate('/app')
        } catch (error) {
          toast.error(error.response?.data?.message || 'Google sign-in failed')
        } finally {
          setBusy(false)
        }
      }
    })
    googleButton.current.innerHTML = ''
    window.google.accounts.id.renderButton(googleButton.current, { theme: 'outline', size: 'large', width: 384, text: register ? 'signup_with' : 'signin_with' })
  }, [googleReady, googleLogin, navigate, register])

  if (user) return <Navigate to="/app"/>

  const submit = async event => {
    event.preventDefault()
    setBusy(true)
    try {
      await (register ? signup(data) : login(data))
      toast.success(register ? 'Workspace created' : 'Welcome back')
      navigate('/app')
    } catch (error) { toast.error(error.response?.data?.message || 'Unable to continue') }
    finally { setBusy(false) }
  }

  return <div className="grid min-h-screen min-h-dvh bg-paper lg:grid-cols-2">
    <section className="flex min-w-0 flex-col px-5 py-5 sm:px-8 sm:py-8 md:px-16">
      <div className="flex items-center justify-between gap-4"><Logo/><Link to="/" className="flex min-h-11 items-center gap-2 text-sm font-bold"><HiArrowLeft/> Back</Link></div>
      <div className="my-auto w-full max-w-md py-10 sm:mx-auto sm:py-16"><p className="mono text-xs font-bold tracking-widest text-teal">{register ? 'NEW WORKSPACE' : 'WELCOME BACK'}</p><h1 className="mt-4 text-[clamp(2.25rem,8vw,3rem)] font-extrabold leading-[1.05] tracking-[-.05em]">{register ? 'Start forging.' : 'Good to see you.'}</h1><p className="mt-3 text-black/45">{register ? 'Create an account and make your files work harder.' : 'Pick up where you left off.'}</p><div className="mt-8 sm:mt-9">{googleClientId ? <div className="min-h-11 overflow-hidden rounded-xl" ref={googleButton}/> : <button disabled className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-black/10 bg-white px-4 font-bold text-black/35"><FcGoogle className="text-xl"/> Google sign-in not configured</button>}</div><div className="my-6 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-black/30"><span className="h-px flex-1 bg-black/10"/>or<span className="h-px flex-1 bg-black/10"/></div><form onSubmit={submit} className="space-y-5">{register && <Field label="Your name" placeholder="Ada Lovelace" value={data.name} onChange={value => setData({ ...data, name: value })}/>}<Field label="Email address" type="email" placeholder="you@example.com" value={data.email} onChange={value => setData({ ...data, email: value })}/><Field label="Password" type="password" placeholder="At least 8 characters" value={data.password} onChange={value => setData({ ...data, password: value })}/><button disabled={busy} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-ink p-4 font-bold text-white transition hover:bg-teal disabled:opacity-50">{busy ? 'One moment…' : register ? 'Create workspace' : 'Log in'} <HiArrowRight/></button></form><p className="mt-7 text-center text-sm text-black/45">{register ? 'Already have an account?' : 'New to Fileforge?'} <Link className="font-bold text-ink" to={register ? '/login' : '/register'}>{register ? 'Log in' : 'Create an account'}</Link></p></div>
    </section>
    <aside className="relative hidden items-end overflow-hidden bg-[#18211f] p-10 text-white lg:flex xl:p-16"><div className="absolute -right-20 -top-20 h-[450px] w-[450px] rounded-full bg-mint/20 blur-[80px]"/><div className="dot-grid absolute inset-0 opacity-40"/><blockquote className="relative max-w-lg text-3xl font-bold leading-tight tracking-[-.04em] xl:text-4xl">“The space between <span className="text-mint">having a file</span> and using it should be almost nothing.”<footer className="mt-8 text-sm font-normal text-white/40">Built for people who make things.</footer></blockquote></aside>
  </div>
}

function Field({ label, onChange, ...props }) {
  return <label className="block text-sm font-bold">{label}<input required {...props} onChange={event => onChange(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 outline-none focus:border-teal focus:ring-4 focus:ring-teal/10"/></label>
}
