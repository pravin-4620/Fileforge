import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { HiArrowLeft, HiArrowRight } from 'react-icons/hi2'
import { FcGoogle } from 'react-icons/fc'
import Logo from '../components/Logo'
import { useAuth } from '../context/AuthContext'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
let googleIdentityPromise

function loadGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google)
  if (googleIdentityPromise) return googleIdentityPromise
  googleIdentityPromise = new Promise((resolve, reject) => {
    const source = 'https://accounts.google.com/gsi/client'
    const script = document.querySelector(`script[src="${source}"]`) || document.createElement('script')
    const loaded = () => window.google?.accounts?.id ? resolve(window.google) : reject(new Error('Google Identity did not initialize'))
    const failed = () => reject(new Error('Google Identity could not be loaded'))
    script.addEventListener('load', loaded, { once: true })
    script.addEventListener('error', failed, { once: true })
    if (!script.isConnected) {
      script.src = source
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }
    window.setTimeout(() => {
      if (!window.google?.accounts?.id) failed()
    }, 12_000)
  })
  return googleIdentityPromise
}

export default function Auth({ register = false }) {
  const { user, login, register: signup, googleLogin } = useAuth()
  const navigate = useNavigate()
  const googleButton = useRef(null)
  const [data, setData] = useState({ name: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [googleState, setGoogleState] = useState(googleClientId ? 'loading' : 'missing')
  const [googleError, setGoogleError] = useState('')

  useEffect(() => {
    if (!googleClientId) return
    let active = true
    loadGoogleIdentity()
      .then(() => active && setGoogleState('ready'))
      .catch(() => {
        if (!active) return
        setGoogleState('error')
        setGoogleError('Google sign-in could not load. Check privacy extensions or network settings, then refresh.')
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (googleState !== 'ready' || !googleButton.current) return
    const host = googleButton.current
    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        ux_mode: 'popup',
        use_fedcm_for_button: true,
        itp_support: true,
        callback: async response => {
          if (!response?.credential) {
            setGoogleError('Google did not return a sign-in credential. Please try again.')
            return
          }
          setBusy(true)
          setGoogleError('')
          try {
            await googleLogin(response.credential)
            toast.success('Welcome to Fileforge')
            navigate('/app')
          } catch (error) {
            const message = error.response?.data?.message || 'Google sign-in failed. Please try again.'
            setGoogleError(message)
            toast.error(message)
          } finally {
            setBusy(false)
          }
        },
      })
      let renderedWidth = 0
      const render = () => {
        const width = Math.min(400, Math.max(240, Math.floor(host.clientWidth || 400)))
        if (width === renderedWidth) return
        renderedWidth = width
        host.innerHTML = ''
        window.google.accounts.id.renderButton(host, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: register ? 'signup_with' : 'signin_with',
          logo_alignment: 'left',
          width,
          click_listener: () => setGoogleError(''),
        })
      }
      render()
      const observer = new ResizeObserver(render)
      observer.observe(host)
      return () => observer.disconnect()
    } catch {
      setGoogleState('error')
      setGoogleError('Google sign-in could not start. Confirm this website is an authorized Google OAuth origin.')
    }
  }, [googleState, googleLogin, navigate, register])

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

  return <div className="grid min-h-screen min-h-dvh bg-paper lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,.95fr)]">
    <section className="relative flex min-w-0 flex-col overflow-hidden px-5 py-5 sm:px-8 sm:py-8 md:px-16">
      <div className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-mint/10 blur-3xl"/>
      <div className="flex items-center justify-between gap-4"><Logo/><Link to="/" className="flex min-h-11 items-center gap-2 text-sm font-bold"><HiArrowLeft/> Back</Link></div>
      <div className="relative my-auto w-full max-w-md py-10 sm:mx-auto sm:py-16"><p className="mono text-xs font-bold tracking-widest text-teal">{register ? 'NEW WORKSPACE' : 'WELCOME BACK'}</p><h1 className="mt-4 text-[clamp(2.25rem,8vw,3rem)] font-extrabold leading-[1.05] tracking-[-.05em]">{register ? 'Start forging.' : 'Good to see you.'}</h1><p className="mt-3 text-black/45">{register ? 'Create an account and make your files work harder.' : 'Pick up where you left off.'}</p><div className="mt-8 rounded-2xl border border-black/[.07] bg-white p-3 shadow-[0_14px_45px_rgba(21,27,26,.06)] sm:mt-9"><div className={`relative flex min-h-11 w-full items-center justify-center overflow-hidden rounded-xl ${busy ? 'pointer-events-none opacity-60' : ''}`}>{googleClientId && googleState === 'ready' ? <div className="w-full" ref={googleButton}/> : <button disabled className="flex min-h-11 w-full items-center justify-center gap-3 rounded-full border border-black/10 bg-white px-4 text-sm font-bold text-black/40"><FcGoogle className="text-xl"/>{googleState === 'loading' ? 'Loading Google sign-in…' : googleState === 'missing' ? 'Google sign-in not configured' : 'Google sign-in unavailable'}</button>}</div>{googleError && <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold leading-relaxed text-red-600">{googleError}</p>}</div><div className="my-6 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-black/30"><span className="h-px flex-1 bg-black/10"/>or continue with email<span className="h-px flex-1 bg-black/10"/></div><form onSubmit={submit} className="space-y-5">{register && <Field label="Your name" placeholder="Ada Lovelace" value={data.name} onChange={value => setData({ ...data, name: value })}/>}<Field label="Email address" type="email" placeholder="you@example.com" value={data.email} onChange={value => setData({ ...data, email: value })}/><Field label="Password" type="password" placeholder="At least 8 characters" value={data.password} onChange={value => setData({ ...data, password: value })}/><button disabled={busy} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-ink p-4 font-bold text-white transition hover:bg-teal disabled:opacity-50">{busy ? 'One moment…' : register ? 'Create workspace' : 'Log in'} <HiArrowRight/></button></form><p className="mt-7 text-center text-sm text-black/45">{register ? 'Already have an account?' : 'New to Fileforge?'} <Link className="font-bold text-ink" to={register ? '/login' : '/register'}>{register ? 'Log in' : 'Create an account'}</Link></p></div>
    </section>
    <aside className="relative hidden items-center overflow-hidden bg-[#18211f] p-10 text-white lg:flex xl:p-16"><div className="absolute -right-20 -top-20 h-[450px] w-[450px] rounded-full bg-mint/20 blur-[80px]"/><div className="dot-grid absolute inset-0 opacity-40"/><div className="relative max-w-lg"><div className="mb-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-4 py-2 text-xs font-bold text-mint"><span className="h-2 w-2 rounded-full bg-mint"/>One workspace for every format</div><blockquote className="text-3xl font-bold leading-tight tracking-[-.04em] xl:text-4xl">“The space between <span className="text-mint">having a file</span> and using it should be almost nothing.”</blockquote><div className="mt-10 grid grid-cols-3 gap-3 text-center text-xs font-bold text-white/55"><span className="rounded-xl border border-white/10 bg-white/[.04] p-3">Secure access</span><span className="rounded-xl border border-white/10 bg-white/[.04] p-3">Smart formats</span><span className="rounded-xl border border-white/10 bg-white/[.04] p-3">Private files</span></div></div></aside>
  </div>
}

function Field({ label, onChange, ...props }) {
  return <label className="block text-sm font-bold">{label}<input required {...props} onChange={event => onChange(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 outline-none focus:border-teal focus:ring-4 focus:ring-teal/10"/></label>
}
