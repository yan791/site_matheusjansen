/* ------------------------------------------------------------------
   Componentes de movimento adaptados do motion-primitives (ibelick,
   licença MIT): TextEffect, InView, Magnetic, BorderTrail,
   ProgressiveBlur, Tilt e ScrollProgress. Mesmos valores padrão dos
   originais, enxugados para este site.
   ------------------------------------------------------------------ */
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from 'motion/react'
import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

/* ---------- TextEffect (preset fade-in-blur, por palavra) ---------- */
const wordVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(12px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

export function TextEffect({
  children,
  as = 'p',
  className,
  delay = 0,
  stagger = 0.05,
}: {
  children: string
  as?: 'p' | 'h2' | 'h3' | 'span'
  className?: string
  delay?: number
  stagger?: number
}) {
  const Tag = motion[as]
  const words = children.split(' ')
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      variants={{ visible: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
      aria-label={children}
    >
      {words.map((w, i) => (
        <motion.span key={i} variants={wordVariants} className="inline-block" aria-hidden="true">
          {w}
          {i < words.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </Tag>
  )
}

/* ---------- InView ---------- */
export function InView({
  children,
  className,
  delay = 0,
  y = 24,
  blur = 10,
  amount = 0.25,
}: {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  blur?: number
  amount?: number
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: `blur(${blur}px)` }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

/* ---------- Magnetic ---------- */
const SPRING = { stiffness: 26.7, damping: 4.1, mass: 0.2 }
export function Magnetic({
  children,
  intensity = 0.6,
  range = 100,
  className,
}: {
  children: ReactNode
  intensity?: number
  range?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, SPRING)
  const sy = useSpring(y, SPRING)
  useEffect(() => {
    if (!matchMedia('(pointer: fine)').matches) return
    const onMove = (e: MouseEvent) => {
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const dist = Math.hypot(dx, dy)
      if (dist <= range) {
        const s = 1 - dist / range
        x.set(dx * intensity * s)
        y.set(dy * intensity * s)
      } else {
        x.set(0)
        y.set(0)
      }
    }
    document.addEventListener('mousemove', onMove, { passive: true })
    return () => document.removeEventListener('mousemove', onMove)
  }, [intensity, range, x, y])
  return (
    <motion.div ref={ref} className={cn('inline-block', className)} style={{ x: sx, y: sy }}>
      {children}
    </motion.div>
  )
}

/* ---------- BorderTrail ---------- */
export function BorderTrail({
  className,
  size = 60,
  duration = 5,
  radius = 999,
}: {
  className?: string
  size?: number
  duration?: number
  radius?: number
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]"
      aria-hidden="true"
    >
      <motion.div
        className={cn('absolute aspect-square', className)}
        style={{ width: size, offsetPath: `rect(0 auto auto 0 round ${radius}px)` }}
        animate={{ offsetDistance: ['0%', '100%'] }}
        transition={{ repeat: Infinity, duration, ease: 'linear' }}
      />
    </div>
  )
}

/* ---------- ProgressiveBlur ---------- */
export function ProgressiveBlur({
  direction = 'top',
  layers = 8,
  intensity = 0.4,
  className,
}: {
  direction?: 'top' | 'bottom'
  layers?: number
  intensity?: number
  className?: string
}) {
  const n = Math.max(layers, 2)
  const seg = 1 / (n + 1)
  const angle = direction === 'top' ? 0 : 180
  return (
    <div className={cn('pointer-events-none relative', className)} aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => {
        const stops = [i * seg, (i + 1) * seg, (i + 2) * seg, (i + 3) * seg].map(
          (pos, pi) => `rgba(255,255,255,${pi === 1 || pi === 2 ? 1 : 0}) ${pos * 100}%`,
        )
        const grad = `linear-gradient(${angle}deg, ${stops.join(', ')})`
        return (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              maskImage: grad,
              WebkitMaskImage: grad,
              backdropFilter: `blur(${i * intensity}px)`,
              WebkitBackdropFilter: `blur(${i * intensity}px)`,
            }}
          />
        )
      })}
    </div>
  )
}

/* ---------- Tilt ---------- */
export function Tilt({
  children,
  className,
  factor = 8,
}: {
  children: ReactNode
  className?: string
  factor?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 260, damping: 26 })
  const sy = useSpring(y, { stiffness: 260, damping: 26 })
  const rotateX = useTransform(sy, [-0.5, 0.5], [factor, -factor])
  const rotateY = useTransform(sx, [-0.5, 0.5], [-factor, factor])
  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onMouseMove={(e) => {
        if (!ref.current) return
        const r = ref.current.getBoundingClientRect()
        x.set((e.clientX - r.left) / r.width - 0.5)
        y.set((e.clientY - r.top) / r.height - 0.5)
      }}
      onMouseLeave={() => {
        x.set(0)
        y.set(0)
      }}
    >
      {children}
    </motion.div>
  )
}

/* ---------- ScrollProgress ---------- */
export function ScrollProgress({ className }: { className?: string }) {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 50, restDelta: 0.001 })
  return <motion.div className={cn('fixed inset-x-0 top-0 z-50 h-px origin-left', className)} style={{ scaleX }} />
}
