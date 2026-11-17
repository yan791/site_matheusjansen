import { useEffect, useRef, useState } from 'react'
import { avaliacoes, contato, img, linkAgendar, linkTreinamento, type Avaliacao } from '../data/content'
import { cn } from '../lib/cn'
import { BorderTrail, InView, Magnetic, ProgressiveBlur, TextEffect, Tilt } from './motion/primitives'

/* ---------- Marca ---------- */
export function ToothMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="22.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        d="M19.3 13.5c-2.9 0-4.6 2.2-4.6 5.1 0 3.1 1.4 5 2.1 7.6.7 2.6.9 7.1 2.9 7.1 1.9 0 1.9-4.3 2.7-6.2.3-.8.8-1.2 1.6-1.2s1.3.4 1.6 1.2c.8 1.9.8 6.2 2.7 6.2 2 0 2.2-4.5 2.9-7.1.7-2.6 2.1-4.5 2.1-7.6 0-2.9-1.7-5.1-4.6-5.1-2 0-2.9 1.2-4.7 1.2s-2.7-1.2-4.7-1.2Z"
      />
    </svg>
  )
}

function ArrowOut({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Arrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M4 12h16M14 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Stars({ className }: { className?: string }) {
  return (
    <span className={cn('flex gap-0.5', className)} aria-label="5 de 5 estrelas" role="img">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" className="size-3.5" aria-hidden="true">
          <path fill="currentColor" d="M10 1.8l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z" />
        </svg>
      ))}
    </span>
  )
}

/* ---------- Cabeçalho ---------- */
export function Header() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    let raf = 0
    const probe = () => {
      raf = 0
      const els = document.elementsFromPoint(24, 44)
      const hit = els.find((e) => !e.closest('.site-header') && e.closest('[data-theme]'))
      const t = (hit?.closest('[data-theme]') as HTMLElement | null)?.dataset.theme
      setTheme(t === 'light' ? 'light' : 'dark')
      setScrolled(window.scrollY > 40)
    }
    const on = () => {
      if (!raf) raf = requestAnimationFrame(probe)
    }
    const id = window.setInterval(on, 400)
    window.addEventListener('scroll', on, { passive: true })
    probe()
    return () => {
      window.removeEventListener('scroll', on)
      window.clearInterval(id)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <header className="site-header" data-tone={theme} data-scrolled={scrolled}>
      <a href="#inicio" className="brand" aria-label="Dr. Matheus Jansen, início">
        <ToothMark className="size-9" />
        <span className="brand-name">
          <span className="brand-dr">Dr.</span> Matheus Jansen
        </span>
      </a>
      <nav className="site-nav" aria-label="Principal">
        <a href="#avaliacoes">Avaliações</a>
        <a href="#agendar">Contato</a>
      </nav>
      <div className="header-actions">
        <Magnetic intensity={0.35} range={80}>
          <a href={linkTreinamento()} className="btn-ghost" {...treinoLink()}>
            <span className="hidden sm:inline">Treinamento em resina composta</span>
            <span className="sm:hidden">Treinamento</span>
            <ArrowOut className="size-4" />
          </a>
        </Magnetic>
        <Magnetic intensity={0.35} range={80}>
          <a href={linkAgendar()} className="btn-ghost" {...extLink()}>
            <span className="hidden sm:inline">Agendar consulta</span>
            <span className="sm:hidden">Agendar</span>
            <Arrow className="size-4" />
          </a>
        </Magnetic>
      </div>
    </header>
  )
}

function extLink() {
  return contato.whatsapp ? { target: '_blank', rel: 'noopener noreferrer' } : {}
}

function treinoLink() {
  return contato.treinamento ? { target: '_blank', rel: 'noopener noreferrer' } : {}
}

/* ---------- Cartão de avaliação ---------- */
function ReviewCard({ r, className }: { r: Avaliacao; className?: string }) {
  return (
    <article className={cn('review', className)}>
      <Stars className="text-charcoal" />
      <p className="review-text">“{r.texto}”</p>
      <footer className="review-foot">
        <span className="avatar" aria-hidden="true">
          {r.nome[0]}
        </span>
        <span>
          <span className="block font-medium text-charcoal">{r.nome}</span>
          <span className="block text-[12px] text-charcoal/55">Avaliação no Google</span>
        </span>
      </footer>
    </article>
  )
}

function Photo({ src, alt, caption, className }: { src: string; alt: string; caption: string; className?: string }) {
  return (
    <figure className={cn('mosaic-photo', className)}>
      <img src={src} alt={alt} loading="lazy" />
      <figcaption>{caption}</figcaption>
    </figure>
  )
}

/* ---------- Prova: o mosaico ---------- */
export function Proof() {
  const [alice, tassia, airton, aiane] = avaliacoes
  const items = [
    <Photo key="p1" src={img.facetasSorriso} alt="Sorriso com facetas finalizado" caption="Facetas · o sorriso final" className="aspect-[1.25]" />,
    <ReviewCard key="r1" r={alice} />,
    <Photo key="p2" src={img.facetasIsolamento} alt="Facetas sendo cimentadas com isolamento absoluto" caption="Durante · isolamento absoluto" className="aspect-[1.1]" />,
    <ReviewCard key="r2" r={tassia} />,
    <Photo key="p3" src={img.implanteResultado} alt="Reabilitação com implantes finalizada" caption="Implantes · resultado" className="aspect-[1.35]" />,
    <ReviewCard key="r3" r={airton} />,
    <Photo key="p4" src={img.facetasMacro} alt="Facetas vistas de muito perto" caption="Detalhe das facetas" className="aspect-[1.2]" />,
    <ReviewCard key="r4" r={aiane} />,
  ]
  return (
    <section id="avaliacoes" className="proof" data-theme="light">
      <div className="wrap">
        <div className="proof-head">
          <InView>
            <p className="kicker">Avaliações reais no Google</p>
          </InView>
          <h2 className="display display--ink">
            <TextEffect as="span" className="block">O que dizem</TextEffect>
            <TextEffect as="span" className="block" delay={0.25}>
              os pacientes
            </TextEffect>
          </h2>
          <InView delay={0.3}>
            <p className="lead">Relatos sobre o atendimento, o cuidado e a atenção em cada etapa do tratamento.</p>
          </InView>
        </div>

        <div className="mosaic">
          {items.map((it, i) => (
            <InView key={i} delay={(i % 3) * 0.08} className="mosaic-item" amount={0.15}>
              <Tilt factor={4}>{it}</Tilt>
            </InView>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- A coluna infinita (padrão Watermelon testimonials-4) ---------- */
function QuoteCard({ r }: { r: Avaliacao }) {
  return (
    <article className="quote">
      <span className="quote-mark" aria-hidden="true">
        “
      </span>
      <p>{r.curto}</p>
      <footer>
        <span className="avatar avatar--sm" aria-hidden="true">
          {r.nome[0]}
        </span>
        {r.nome}
        <Stars className="ml-auto text-nude" />
      </footer>
    </article>
  )
}

function Column({ reverse, offset = 0, duration = 46 }: { reverse?: boolean; offset?: number; duration?: number }) {
  const list = [...avaliacoes.slice(offset), ...avaliacoes.slice(0, offset)]
  const cards = list.flatMap((r, i) =>
    i % 2 === 0 ? [<QuoteCard key={`q${i}`} r={r} />, <ReviewCard key={`r${i}`} r={r} className="review--flat" />] : [<ReviewCard key={`r${i}`} r={r} className="review--flat" />, <QuoteCard key={`q${i}`} r={r} />],
  )
  return (
    <div className="marquee-col" aria-hidden="true">
      <div className={cn('marquee-track', reverse && 'marquee-track--rev')} style={{ animationDuration: `${duration}s` }}>
        {cards}
        {cards.map((c, i) => (
          <div key={`d${i}`}>{c}</div>
        ))}
      </div>
    </div>
  )
}

export function Endless() {
  return (
    <section className="endless" data-theme="light" aria-label="Mais avaliações">
      <div className="wrap endless-grid">
        <div className="endless-copy">
          <InView>
            <p className="kicker">Depoimentos</p>
          </InView>
          <h2 className="display display--ink display--md">
            <TextEffect as="span" className="block">Cada história</TextEffect>
            <TextEffect as="span" className="block" delay={0.2}>
              é única
            </TextEffect>
          </h2>
          <InView delay={0.35}>
            <p className="lead">Agradecemos a confiança de cada paciente que passa pelo consultório.</p>
          </InView>
          <InView delay={0.5}>
            <a href="#agendar" className="link-line">
              Agendar consulta
              <Arrow className="size-4" />
            </a>
          </InView>
        </div>

        <div className="endless-cols">
          <Column duration={52} />
          <Column reverse offset={2} duration={60} />
          <div className="endless-fade endless-fade--top">
            <ProgressiveBlur direction="top" className="h-full" />
          </div>
          <div className="endless-fade endless-fade--bottom">
            <ProgressiveBlur direction="bottom" className="h-full" />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- O convite (a única chamada para ação) ---------- */
export function Invite() {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <section id="agendar" className="invite" data-theme="dark">
      <div className="invite-glow" aria-hidden="true" />
      <div className="wrap invite-inner" ref={ref}>
        <InView>
          <p className="kicker kicker--light">Agende sua consulta</p>
        </InView>
        <h2 className="display">
          <TextEffect as="span" className="block">A próxima história</TextEffect>
          <span className="block">
            <TextEffect as="span" delay={0.25}>
              pode ser a
            </TextEffect>{' '}
            <InView delay={0.55} className="inline-block" y={10}>
              <em className="text-nude">sua.</em>
            </InView>
          </span>
        </h2>

        <InView delay={0.2}>
          <ul className="assurances">
            <li>Você entende cada etapa antes de começar</li>
            <li>Atendimento com calma, sem pressa</li>
            <li>Resposta direto pelo WhatsApp</li>
          </ul>
        </InView>

        <InView delay={0.35}>
          <Magnetic intensity={0.4} range={120}>
            <a href={linkAgendar()} className="btn-primary" {...extLink()}>
              <BorderTrail className="bg-[radial-gradient(circle,#fff_0%,rgba(255,255,255,.35)_35%,transparent_70%)]" size={70} duration={4.5} />
              Agendar minha consulta
              <Arrow className="size-5" />
            </a>
          </Magnetic>
          <p className="micro">Você fala direto com a equipe pelo WhatsApp.</p>
        </InView>
      </div>
    </section>
  )
}

/* ---------- Rodapé ---------- */
export function Footer() {
  return (
    <footer className="site-footer" data-theme="dark">
      <div className="wrap footer-inner">
        <div className="flex items-center gap-3">
          <ToothMark className="size-8 text-ivory/80" />
          <div>
            <p className="font-medium text-ivory">Dr. Matheus Jansen</p>
            <p className="text-[13px] text-ivory/55">
              Odontologia estética{contato.cro ? ` · ${contato.cro}` : ''}
            </p>
          </div>
        </div>
        <div className="footer-links">
          {contato.endereco && <p>{contato.endereco}</p>}
          {contato.instagram && (
            <a href={`https://instagram.com/${contato.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
          )}
          <a href={linkAgendar()} {...extLink()}>
            WhatsApp
          </a>
          <a href={linkTreinamento()} {...treinoLink()}>
            Treinamento em resina composta
          </a>
          <a href="#inicio">Voltar ao início</a>
        </div>
        <p className="footer-copy">© {new Date().getFullYear()} Dr. Matheus Jansen. Todos os direitos reservados.</p>
      </div>
    </footer>
  )
}
