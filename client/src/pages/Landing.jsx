import { Link } from 'react-router-dom'
import {
  HiArrowRight,
  HiCheck,
  HiOutlineArchiveBox,
  HiOutlineBolt,
  HiOutlineClock,
  HiOutlineDocumentText,
  HiOutlineFilm,
  HiOutlineLockClosed,
  HiOutlinePhoto,
  HiOutlineSparkles
} from 'react-icons/hi2'
import Logo from '../components/Logo'

const formatGroups = [
  { icon: HiOutlinePhoto, title: 'Images', items: ['JPG', 'PNG', 'WebP', 'AVIF', 'HEIC', 'TIFF'] },
  { icon: HiOutlineDocumentText, title: 'Documents', items: ['PDF', 'DOCX', 'PPTX', 'TXT', 'HTML', 'ODT'] },
  { icon: HiOutlineFilm, title: 'Media', items: ['MP4', 'MOV', 'MKV', 'MP3', 'WAV', 'FLAC'] },
  { icon: HiOutlineArchiveBox, title: 'Archives', items: ['ZIP', 'RAR', 'TAR', 'GZIP', '7Z'] }
]

const steps = [
  ['Upload', 'Drop files, browse, or send batches from your workspace.'],
  ['Choose', 'Fileforge detects the source type and shows compatible targets.'],
  ['Convert', 'The backend routes work through the right conversion plugin.'],
  ['Download', 'Save one result, repeat from history, or export batches.']
]

export default function Landing() {
  return (
    <div className="min-h-screen min-h-dvh overflow-hidden bg-paper text-ink">
      <nav className="sticky top-0 z-30 border-b border-black/[.06] bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:h-20 sm:px-5 md:px-8">
          <Logo />
          <div className="hidden items-center gap-8 text-sm font-semibold text-black/55 md:flex">
            <a className="transition hover:text-ink" href="#formats">Formats</a>
            <a className="transition hover:text-ink" href="#how">How it works</a>
            <a className="transition hover:text-ink" href="#security">Security</a>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            <Link to="/login" className="hidden px-4 text-sm font-bold sm:block">Log in</Link>
            <Link to="/register" className="rounded-full bg-ink px-4 py-2.5 text-xs font-bold text-white transition hover:bg-teal sm:px-5 sm:py-3 sm:text-sm">Start converting</Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-5 sm:pt-16 md:px-8 md:pb-24 md:pt-24">
          <div className="absolute -right-60 top-0 h-[500px] w-[500px] rounded-full bg-mint/30 blur-[100px]" />
          <div className="relative grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-bold">
                <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-teal" />
                75+ formats. One simple workspace.
              </div>
              <h1 className="mt-7 font-display text-[clamp(2.8rem,11vw,4.8rem)] font-extrabold leading-[.96] tracking-[-.065em]">
                Every file,<br /><span className="text-teal">made useful.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-black/55 sm:mt-7 sm:text-lg">
                Convert images, documents, videos, audio, and archives without juggling five different tools. Fast, private, beautifully simple.
              </p>
              <div className="landing-actions mt-8 flex flex-wrap gap-3 sm:mt-9">
                <Link to="/register" className="group flex min-h-12 items-center gap-3 rounded-full bg-ink px-6 py-3.5 font-bold text-white sm:py-4">
                  Convert your first file <HiArrowRight className="transition group-hover:translate-x-1" />
                </Link>
                <a href="#how" className="min-h-12 rounded-full border border-black/15 px-6 py-3.5 font-bold transition hover:border-ink sm:py-4">See how it works</a>
              </div>
              <p className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-black/40">
                <span className="flex items-center gap-1"><HiCheck />No credit card</span>
                <span className="flex items-center gap-1"><HiCheck />Files auto-delete</span>
              </p>
            </div>
            <HeroPreview />
          </div>
        </section>

        <section id="formats" className="scroll-mt-24 bg-[#18211f] py-14 text-white sm:py-20">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <div className="grid gap-10 md:grid-cols-3">
              <Feature icon={HiOutlineBolt} title="Remarkably fast" text="Smart routing picks the right conversion engine and keeps you moving." />
              <Feature icon={HiOutlineLockClosed} title="Private by design" text="JWT-secured access and automatic temporary-file cleanup built in." />
              <Feature icon={HiOutlineSparkles} title="Any format, one place" text="From AVIF to ZIP, manage every conversion in a single history." />
            </div>
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {formatGroups.map(group => <FormatGroup key={group.title} {...group} />)}
            </div>
          </div>
        </section>

        <section id="how" className="scroll-mt-24 bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <p className="mono text-xs font-bold uppercase tracking-widest text-teal">Workflow</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-extrabold leading-tight tracking-[-.04em] sm:text-5xl">A conversion flow that stays out of your way.</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-4">
              {steps.map(([title, text], index) => <Step key={title} number={index + 1} title={title} text={text} />)}
            </div>
          </div>
        </section>

        <section id="security" className="scroll-mt-24 bg-paper py-14 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-[.85fr_1.15fr] md:px-8">
            <div>
              <p className="mono text-xs font-bold uppercase tracking-widest text-teal">Security</p>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-.04em] sm:text-5xl">Private workspaces for real-world files.</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SecurityItem title="Protected sessions" text="JWT auth keeps dashboard, history, downloads, and admin routes behind signed sessions." />
              <SecurityItem title="Controlled storage" text="Upload records are owned by users, and stored files are cleaned up automatically after the retention window." />
              <SecurityItem title="Validated inputs" text="The API checks file metadata, conversion targets, YouTube URLs, and request payloads before processing." />
              <SecurityItem title="Production headers" text="Helmet, CORS allowlists, rate limits, and no-store API responses are configured for hosted deployment." />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function HeroPreview() {
  return (
    <div className="dot-grid relative min-h-[390px] rounded-[1.75rem] border border-black/[.06] p-4 sm:min-h-[480px] sm:rounded-[2.5rem] sm:p-10">
      <div className="absolute inset-10 rounded-full bg-teal/15 blur-3xl" />
      <div className="float relative rotate-2 rounded-[1.5rem] bg-white p-4 shadow-soft sm:rounded-[2rem] sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-extrabold sm:text-lg">Quick convert</p>
            <p className="text-xs text-black/40">Drop it. Pick it. Done.</p>
          </div>
          <span className="mono rounded-full bg-mint/50 px-2.5 py-1.5 text-xs sm:px-3">ENCRYPTED</span>
        </div>
        <div className="mt-5 rounded-2xl border-2 border-dashed border-black/10 bg-[#f8faf9] p-6 text-center sm:mt-6 sm:p-8">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ink text-2xl text-mint"><HiOutlineSparkles /></div>
          <p className="mt-4 font-bold">Drop anything here</p>
          <p className="mt-1 text-xs text-black/35">or browse from your device</p>
        </div>
        <div className="mt-4 flex min-w-0 items-center gap-3 rounded-2xl bg-[#f1f4f3] p-3 sm:p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#ffd8cb] text-xs font-extrabold text-[#a6401d]">MP4</span>
          <div className="min-w-0 flex-1">
            <div className="flex justify-between gap-2 text-xs font-bold">
              <span className="truncate">launch-film.mp4</span>
              <span className="shrink-0 text-teal">94%</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-black/10"><div className="h-full w-[94%] rounded-full bg-teal" /></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Feature({ icon: Icon, title, text }) {
  return <div><Icon className="text-3xl text-mint" /><h3 className="mt-5 text-xl font-bold">{title}</h3><p className="mt-2 max-w-sm text-sm leading-relaxed text-white/45">{text}</p></div>
}

function FormatGroup({ icon: Icon, title, items }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
      <div className="flex items-center gap-3">
        <Icon className="text-2xl text-mint" />
        <h3 className="font-extrabold">{title}</h3>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {items.map(item => <span key={item} className="mono rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/70">{item}</span>)}
      </div>
    </div>
  )
}

function Step({ number, title, text }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-paper p-5">
      <span className="mono grid h-9 w-9 place-items-center rounded-full bg-ink text-xs font-bold text-mint">{number}</span>
      <h3 className="mt-5 text-lg font-extrabold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-black/50">{text}</p>
    </div>
  )
}

function SecurityItem({ title, text }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5">
      <HiOutlineLockClosed className="text-2xl text-teal" />
      <h3 className="mt-4 font-extrabold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-black/50">{text}</p>
    </div>
  )
}
