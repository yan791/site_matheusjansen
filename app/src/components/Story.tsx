import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import type { ToothScene } from '../three/toothScene'
import { img, capitulos, marcacoesDente, marcacoesImplante } from '../data/content'
import { band, clamp, easeInOut, easeOut, inv, lerp, smooth } from '../lib/math'

/* ------------------------------------------------------------------
   A apresentação: uma seção alta com um palco fixo. O progresso do
   scroll (0 a 1) comanda tudo. Ordem: quem faz (o Dr. Matheus), a
   frase, o resultado, o detalhe, o dente 3D, o implante e o caso real.
   ------------------------------------------------------------------ */

type R = readonly [number, number]
// Linha do tempo em progresso de scroll (pontos de partida, validados pelo teste de flick)
const T = {
  // 1. quem faz
  me: [0, 0.08] as R,
  portraitClose: [0.072, 0.118] as R,
  lightClose: [0.08, 0.126] as R,
  tilesOut: [0.076, 0.124] as R,
  // 2. a frase
  people: [0.118, 0.212] as R,
  tilesExit: [0.2, 0.248] as R,
  // 3. o resultado
  frameIn: [0.222, 0.258] as R,
  result: [0.252, 0.332] as R,
  // 4. o detalhe
  zoomMove: [0.326, 0.44] as R,
  zoomScale: [0.342, 0.5] as R,
  isoIn: [0.336, 0.43] as R,
  isoOut: [0.52, 0.56] as R,
  detail: [0.366, 0.466] as R,
  tag: [0.35, 0.44] as R,
  sharpOut: [0.445, 0.49] as R,
  toothIn: [0.458, 0.515] as R,
  frameOut: [0.482, 0.53] as R,
  // 5. o dente em 3D
  tooth: [0.52, 0.66] as R,
  spin: [0.52, 0.67] as R,
  drag: [0.51, 0.67] as R,
  hint: [0.535, 0.655] as R,
  callout: { start: 0.535, step: 0.025, end: 0.665 },
  calloutMobile: { start: 0.53, len: 0.033 },
  // 6. o padrão (implante)
  partsIn: [0.66, 0.715] as R,
  explode: [0.675, 0.735] as R,
  turn: [0.665, 0.725] as R,
  cam: [0.66, 0.73] as R,
  assemble: [0.822, 0.858] as R,
  implant: [0.7, 0.822] as R,
  implCallout: { start: 0.71, step: 0.022, end: 0.822 },
  watermark: [0.675, 0.86] as R,
  toothOut: [0.858, 0.878] as R,
  // 7. caso real
  caseIn: [0.886, 0.918] as R,
  wipe: [0.922, 0.972] as R,
  caseReal: [0.89, 1] as R,
}
const RAMP = 0.015
const CHAPTER_STARTS = [0, 0.118, 0.366, 0.66, 0.87]

// posição do incisivo central alvo dentro da foto macro (frações da imagem)
const TOOTH = { u: 0.642, v: 0.555, w: 0.245, h: 0.79 }
const MACRO_ASPECT = 1394 / 552
const CASE_ASPECT = 1362 / 428

const TILE_SRC = [
  img.facetasMacro,
  img.facetasIsolamento,
  img.facetasSorriso,
  img.implantePlanejamento,
  img.implanteResultado,
]
const TILE_ASPECT = [2.525, 2.355, 2.43, 3.26, 3.11]

function Words({ text, spread = 0.45 }: { text: string; spread?: number }) {
  const ws = text.split(' ')
  return (
    <>
      {ws.map((w, i) => (
        <span key={i}>
          <span
            className="w"
            style={{ '--th': ((i / Math.max(1, ws.length - 1)) * spread).toFixed(3) } as CSSProperties}
          >
            {w}
          </span>
          {i < ws.length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  )
}

function Band({
  id,
  kind,
  className = '',
  children,
}: {
  id: 'me' | 'people' | 'result' | 'detail' | 'tooth' | 'implant' | 'caseReal'
  kind: 'blur' | 'depth' | 'halves' | 'slide' | 'rise'
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`band band--${kind} ${className}`} data-band={id}>
      {children}
    </div>
  )
}

/* cache de estilos: só toca o DOM quando o valor muda */
const cache = new WeakMap<Element, Record<string, string>>()
function css(el: HTMLElement | SVGElement | null, prop: string, val: string) {
  if (!el) return
  let c = cache.get(el)
  if (!c) cache.set(el, (c = {}))
  if (c[prop] === val) return
  c[prop] = val
  if (prop.startsWith('--')) el.style.setProperty(prop, val)
  else (el.style as unknown as Record<string, string>)[prop] = val
}
const f3 = (n: number) => (Math.round(n * 1000) / 1000).toString()
const px = (n: number) => `${Math.round(n * 10) / 10}px`
const at = (r: R, p: number) => inv(r[0], r[1], p)

export default function Story() {
  const rootRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const root = rootRef.current!
    const stage = stageRef.current!
    const canvas = canvasRef.current!
    const $ = <T extends Element = HTMLElement>(s: string) => stage.querySelector(s) as T
    const $$ = <T extends Element = HTMLElement>(s: string) => Array.from(stage.querySelectorAll(s)) as T[]

    const el = {
      ivory: $('.st-ivory'),
      frame: $('.st-frame'),
      sharp: $('.st-frame .sharp'),
      blur: $('.st-frame .soft'),
      tag: $('.st-frame .st-tag'),
      iso: $('.st-iso'),
      spot: $('.st-spot'),
      wm: $('.st-watermark'),
      caseBox: $('.st-case'),
      caseResult: $('.st-case .result'),
      caseHandle: $('.st-case .handle'),
      caseL1: $('.st-case .lbl-1'),
      caseL2: $('.st-case .lbl-2'),
      tiles: $$('.st-tile'),
      portrait: $('.st-portrait'),
      portraitImg: $('.st-portrait img'),
      cue: $('.st-cue'),
      hint: $('.st-hint'),
      chapters: $$('.st-chap li'),
      chapBar: $('.st-chap .bar i'),
      chapNav: $('.st-chap'),
      paths: $$<SVGPathElement>('.st-lines path'),
      dots: $$<SVGGElement>('.st-lines g'),
      labels: $$('.st-callout'),
      bands: $$('[data-band]'),
    }

    // o motor 3D carrega em paralelo; a página já funciona antes dele chegar
    let scene: ToothScene | null = null
    let disposed = false
    import('../three/toothScene')
      .then(({ ToothScene }) => {
        if (disposed) return
        try {
          scene = new ToothScene(canvas)
          layout()
        } catch {
          // sem WebGL: a história segue com as fotos e os textos, sem o dente 3D
          stage.classList.add('no-webgl')
        }
      })
      .catch(() => stage.classList.add('no-webgl'))
    const VH1 = 2 * Math.tan((15 * Math.PI) / 180) // altura visível por unidade de distância (fov 30)

    // ---------- layout ----------
    let vw = 1, vh = 1, mobile = false
    let fW = 1, fH = 1, fX = 0, fY = 0, fStart = 0, fFrac = 1
    let hf = 0.6, d3 = 3.3
    let cW = 1, cH = 1
    let pX = 0, pY = 0, pW = 1, pH = 1
    const labelSize: { w: number; h: number }[] = []
    let tileBase: { x: number; y: number; w: number; h: number }[] = []

    function layout() {
      vw = stage.clientWidth
      vh = stage.clientHeight
      mobile = vw < 768
      scene?.resize(vw, vh, window.devicePixelRatio || 1)

      // moldura da foto macro
      const aspect = mobile ? 1.38 : MACRO_ASPECT
      fW = mobile ? vw * 0.9 : Math.min(vw * 0.62, vh * 0.42 * MACRO_ASPECT, 1100)
      fH = fW / aspect
      fX = (vw - fW) / 2
      fY = vh * (mobile ? 0.5 : 0.53) - fH / 2
      fFrac = Math.min(1, aspect / MACRO_ASPECT)
      fStart = clamp(0.56 - fFrac / 2, 0, 1 - fFrac)
      css(el.frame, 'width', px(fW))
      css(el.frame, 'height', px(fH))
      css(el.frame, 'left', px(fX))
      css(el.frame, 'top', px(fY))
      const objX = fFrac < 1 ? (fStart / (1 - fFrac)) * 100 : 50
      for (const im of [el.sharp, el.blur]) css(im, 'objectPosition', `${f3(objX)}% 50%`)

      // tamanho do dente 3D em repouso (fração da altura da tela)
      hf = mobile ? Math.min(0.36, (0.62 * vw) / 0.8 / vh) : 0.54
      d3 = 1.1 / (hf * VH1)

      // caso real
      const ca = mobile ? 1.7 : CASE_ASPECT
      cW = mobile ? vw * 0.9 : Math.min(vw * 0.64, 1080)
      cH = cW / ca
      css(el.caseBox, 'width', px(cW))
      css(el.caseBox, 'height', px(cH))
      css(el.caseBox, 'left', px((vw - cW) / 2))
      css(el.caseBox, 'top', px(vh * (mobile ? 0.52 : 0.56) - cH / 2))

      // retrato (posição vem do CSS)
      pX = el.portrait.offsetLeft
      pY = el.portrait.offsetTop
      pW = el.portrait.offsetWidth
      pH = el.portrait.offsetHeight

      el.labels.forEach((l, i) => (labelSize[i] = { w: l.offsetWidth, h: l.offsetHeight }))

      const base = mobile
        ? [[0.24, 0.17, 0.44], [0.78, 0.25, 0.38], [0.22, 0.78, 0.4], [0.76, 0.84, 0.4], [0.52, 0.1, 0.3]]
        : [[0.19, 0.22, 0.22], [0.82, 0.2, 0.18], [0.15, 0.77, 0.2], [0.85, 0.79, 0.17], [0.5, 0.87, 0.14]]
      tileBase = base.map(([x, y, w], i) => {
        const tw = w * vw
        const th = tw / TILE_ASPECT[i]
        css(el.tiles[i], 'width', px(tw))
        css(el.tiles[i], 'height', px(th))
        return { x: x * vw, y: y * vh, w: tw, h: th }
      })
    }

    // ---------- arrastar para girar ----------
    let dragRot = 0, dragVel = 0, dragging = false, lastX = 0
    const inC3 = () => shown > T.drag[0] && shown < T.drag[1]
    const onDown = (e: PointerEvent) => {
      if (!inC3()) return
      dragging = true
      lastX = e.clientX
      stage.classList.add('is-dragging')
    }
    const onMove = (e: PointerEvent) => {
      if (!dragging) return
      const dx = e.clientX - lastX
      lastX = e.clientX
      dragVel = dx * 0.012
      dragRot += dragVel
    }
    const onUp = () => {
      dragging = false
      stage.classList.remove('is-dragging')
    }
    stage.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)

    // luz que segue o cursor
    let mx = -9999, my = -9999, sx = -9999, sy = -9999
    const onMouse = (e: MouseEvent) => {
      const r = stage.getBoundingClientRect()
      mx = e.clientX - r.left
      my = e.clientY - r.top
    }
    window.addEventListener('mousemove', onMouse, { passive: true })

    // ---------- progresso ----------
    const progress = () => {
      const r = root.getBoundingClientRect()
      const range = root.offsetHeight - window.innerHeight
      return clamp(-r.top / range)
    }
    let target = progress()
    let shown = target
    const onScroll = () => {
      target = progress()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__story = { get: () => ({ target, shown, running }) }

    const bandRanges = el.bands.map((b) => {
      const id = b.dataset.band as 'me' | 'people' | 'result' | 'detail' | 'tooth' | 'implant' | 'caseReal'
      const [a, z] = T[id]
      return { el: b, a, b: z, first: id === 'me', last: id === 'caseReal' }
    })

    // ---------- o quadro ----------
    function apply(p: number, time: number, dt: number) {
      /* bandas de texto */
      for (const r of bandRanges) {
        const op = band(p, r.a, r.b, RAMP, r.first, r.last)
        const o = r.first ? op * Math.max(loadK, 0.0001) : op
        const k = r.first ? loadK : clamp((p - r.a) / 0.03)
        css(r.el, 'opacity', f3(o))
        css(r.el, '--k', f3(k))
        css(r.el, 'visibility', o < 0.002 ? 'hidden' : 'visible')
      }

      /* dica de scroll */
      css(el.cue, 'opacity', f3(loadK * (1 - smooth(inv(0.01, 0.035, p)))))

      /* fundo: começa em marfim e fecha no retrato, revelando o estúdio escuro */
      const light = 1 - easeInOut(at(T.lightClose, p))
      const pcx = pX + pW / 2
      const pcy = pY + pH / 2
      css(el.ivory, 'opacity', light > 0.001 ? '1' : '0')
      css(el.ivory, 'clipPath', `circle(${f3(light * 150)}% at ${px(pcx)} ${px(pcy)})`)
      stage.dataset.theme = light > 0.5 ? 'light' : 'dark'

      /* capítulos */
      let chap = 0
      CHAPTER_STARTS.forEach((s, i) => p >= s && (chap = i))
      el.chapters.forEach((li, i) => css(li, '--on', i === chap ? '1' : '0'))
      css(el.chapBar, 'transform', `scaleY(${f3(p)})`)
      css(el.chapNav, 'opacity', f3(loadK * (1 - light)))

      /* ---- 1. quem faz: o retrato abre no carregamento e fecha ao rolar ---- */
      const insLoad = lerp(50, 0, easeOut(loadK))
      const insClose = lerp(0, 50, easeInOut(at(T.portraitClose, p)))
      const ins = Math.max(insLoad, insClose)
      css(el.portrait, 'opacity', ins < 49.8 ? '1' : '0')
      css(el.portrait, 'visibility', ins < 49.8 ? 'visible' : 'hidden')
      css(el.portrait, 'clipPath', `inset(${f3(ins * 0.18)}% ${f3(ins)}% ${f3(ins * 0.18)}% ${f3(ins)}% round ${px(16)})`)
      css(el.portraitImg, 'transform', `scale(${f3(lerp(1.14, 1, easeOut(loadK)) * lerp(1, 1.1, at(T.portraitClose, p)))})`)

      /* ---- 2. o trabalho sai de dentro do retrato ---- */
      const tOut = easeOut(at(T.tilesOut, p))
      const tExit = easeInOut(at(T.tilesExit, p))
      const tOp = smooth(inv(T.tilesOut[0], T.tilesOut[0] + 0.024, p)) * (1 - smooth(inv(T.tilesExit[0] + 0.015, T.tilesExit[1], p)))
      el.tiles.forEach((t, i) => {
        const b = tileBase[i]
        if (!b) return
        const drift = Math.sin(time * 0.3 + i * 1.7) * 6
        let cx = lerp(pcx, b.x, tOut)
        let cy = lerp(pcy, b.y, tOut) + drift * tOut
        cx += (cx - vw / 2) * 0.9 * tExit
        cy += (cy - vh / 2) * 0.9 * tExit
        const sc = lerp(0.28, 1, tOut) * (1 + 0.5 * tExit)
        css(t, 'opacity', f3(tOp))
        css(t, 'visibility', tOp < 0.002 ? 'hidden' : 'visible')
        css(t, 'transform', `translate3d(${px(cx - b.w / 2)},${px(cy - b.h / 2)},0) scale(${f3(sc)})`)
      })

      /* ---- 3 e 4. o resultado e o zoom no dente ---- */
      const fIn = easeOut(at(T.frameIn, p))
      const z = easeInOut(at(T.zoomScale, p))
      const zt = easeInOut(at(T.zoomMove, p))
      const tuF = (TOOTH.u - fStart) / fFrac
      const ox = tuF * fW
      const oy = TOOTH.v * fH
      const toothH0 = TOOTH.h * fH
      const sMax = (hf * vh) / toothH0
      const s = lerp(1, sMax, z) * lerp(0.9, 1, fIn)
      const Tx = mobile ? vw * 0.5 : vw * 0.585
      const Ty = vh * 0.5
      const P0x = fX + ox
      const P0y = fY + oy
      const tx = (Tx - P0x) * zt
      const ty = (Ty - P0y) * zt + (1 - fIn) * 30
      const frameOp = fIn * (1 - smooth(at(T.frameOut, p)))
      css(el.frame, 'transformOrigin', `${px(ox)} ${px(oy)}`)
      css(el.frame, 'transform', `translate3d(${px(tx)},${px(ty)},0) scale(${f3(s)})`)
      css(el.frame, 'opacity', f3(frameOp))
      css(el.frame, 'visibility', frameOp < 0.002 ? 'hidden' : 'visible')
      css(el.sharp, 'opacity', f3(1 - smooth(at(T.sharpOut, p))))
      css(el.tag, 'opacity', f3(band(p, T.tag[0], T.tag[1], 0.02)))

      // isolamento: escurece tudo em volta do dente
      const iso = smooth(at(T.isoIn, p)) * (1 - smooth(at(T.isoOut, p)))
      const tsx = P0x + tx
      const tsy = P0y + ty
      const rw = TOOTH.w * (fH * MACRO_ASPECT) * s * 0.66
      const rh = toothH0 * s * 0.6
      css(el.iso, 'opacity', f3(iso))
      css(el.iso, '--mx', px(tsx))
      css(el.iso, '--my', px(tsy))
      css(el.iso, '--rx', px(rw * lerp(2.4, 1, iso)))
      css(el.iso, '--ry', px(rh * lerp(2.4, 1, iso)))

      /* ---- 5 e 6. o dente em 3D e o implante ---- */
      const toothIn = smooth(at(T.toothIn, p))
      const toothOut = smooth(at(T.toothOut, p))
      const canvasOp = toothIn * (1 - toothOut)
      css(canvas, 'opacity', f3(canvasOp))

      const c3 = easeInOut(at(T.spin, p))
      const assemble = easeInOut(at(T.assemble, p))
      const partsIn = easeOut(at(T.partsIn, p))
      const ex = easeInOut(at(T.explode, p)) * (1 - assemble)
      const turn34 = easeInOut(at(T.turn, p)) * (1 - assemble)

      if (!dragging) {
        dragRot += dragVel
        dragVel *= Math.pow(0.9, dt / 16.67)
        if (!inC3()) dragRot *= Math.pow(0.9, dt / 16.67)
      }

      const dEx = 3.9 / ((mobile ? 0.56 : 0.8) * VH1)
      const dAs = 2.6 / ((mobile ? 0.55 : 0.7) * VH1)
      const camK = easeInOut(at(T.cam, p))
      const camBack = easeInOut(inv(T.assemble[0], T.assemble[1] + 0.005, p))
      let camDist = lerp(d3, dEx, camK)
      camDist = lerp(camDist, dAs, camBack)
      let camTargetY = lerp(0, 0.83, camK)
      camTargetY = lerp(camTargetY, 0.7, camBack)

      const tx3 = mobile ? lerp(vw * 0.5, vw * 0.36, camK * (1 - camBack)) : Tx
      const pxPerUnit = vh / (VH1 * camDist)
      scene?.apply(
        {
          rotY: c3 * Math.PI * 2 - 0.5 * turn34 + dragRot,
          tiltX: 0.05,
          explode: ex,
          partsIn,
          spin: -Math.PI * 4 * assemble + partsIn * Math.PI * 2,
          camDist,
          camTargetY,
          shiftX: (tx3 - vw / 2) / pxPerUnit,
          shiftY: mobile ? (-vh * 0.1 * camK * (1 - camBack)) / pxPerUnit : 0,
          scale: lerp(0.965, 1, toothIn) * lerp(1, 0.55, toothOut),
        },
        time,
      )

      /* marcações do dente (0..3) e do implante (4..6) */
      const leftX = tx3 - (hf * vh * 0.4 + 110)
      const rightX = tx3 + (hf * vh * 0.4 + 110)
      for (let i = 0; i < 7 && scene; i++) {
        const lab = el.labels[i]
        const path = el.paths[i]
        const dot = el.dots[i]
        const sz = labelSize[i] || { w: 200, h: 40 }
        let a: { x: number; y: number; front: number }
        let lx = 0, ly = 0, side = 1, op = 0, k = 0
        let mobileCap = false
        if (i < 4) {
          const an = scene.toothAnchors[i]
          a = scene.project(scene.crown, an.p, an.n)
          if (mobile) {
            const ms = T.calloutMobile.start + i * T.calloutMobile.len
            op = band(p, ms, ms + T.calloutMobile.len, 0.01) * canvasOp
            k = easeOut(inv(ms, ms + 0.018, p))
            lx = 20
            ly = vh * 0.76
            mobileCap = true
          } else {
            const st = T.callout.start + i * T.callout.step
            op = band(p, st, T.callout.end, RAMP) * canvasOp
            k = easeOut(inv(st, st + 0.025, p))
            side = i === 0 || i === 2 ? -1 : 1
            ly = vh * [0.49, 0.56, 0.7, 0.33][i]
            lx = side < 0 ? leftX - sz.w : rightX
          }
        } else {
          const j = i - 4
          const st = T.implCallout.start + j * T.implCallout.step
          op = band(p, st, T.implCallout.end, RAMP) * canvasOp
          k = easeOut(inv(st, st + 0.025, p))
          a = scene.projectImplantAnchor(j)
          side = 1
          lx = mobile ? Math.min(vw - 12 - sz.w, a.x + 40) : Math.min(vw - sz.w - 40, tx3 + 170)
          ly = a.y - 10
        }
        const facing = clamp(a.front * 3 + 0.4)
        css(lab, 'opacity', f3(op))
        css(lab, 'visibility', op < 0.002 ? 'hidden' : 'visible')
        css(lab, 'transform', `translate3d(${px(lx)},${px(ly)},0)`)
        css(lab, '--k', f3(k))
        css(path, 'opacity', f3(op))
        if (mobileCap) {
          const yy = ly - 14
          path.setAttribute('d', `M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${a.x.toFixed(1)} ${yy.toFixed(1)}L${(lx + 4).toFixed(1)} ${yy.toFixed(1)}`)
        } else {
          const attachX = side < 0 ? lx + sz.w + 10 : lx - 10
          const attachY = ly + 9
          const elbowX = attachX - side * 26
          path.setAttribute('d', `M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${elbowX.toFixed(1)} ${attachY.toFixed(1)}L${attachX.toFixed(1)} ${attachY.toFixed(1)}`)
        }
        css(path, 'strokeDashoffset', f3(1 - k))
        css(dot, 'opacity', f3(op * facing))
        css(dot, 'transform', `translate(${px(a.x)},${px(a.y)})`)
      }

      /* dica de arrastar */
      css(el.hint, 'opacity', f3(band(p, T.hint[0], T.hint[1], 0.02)))

      /* marca d'água */
      css(el.wm, 'opacity', f3(band(p, T.watermark[0], T.watermark[1], 0.03)))
      css(el.wm, 'transform', `translate3d(-50%,-50%,0) scale(${f3(lerp(1.12, 1, easeOut(inv(T.watermark[0], T.watermark[0] + 0.11, p))))})`)

      /* ---- 7. caso real ---- */
      const cIn = easeOut(at(T.caseIn, p))
      const wipe = easeInOut(at(T.wipe, p))
      css(el.caseBox, 'opacity', f3(cIn))
      css(el.caseBox, 'visibility', cIn < 0.002 ? 'hidden' : 'visible')
      css(el.caseBox, 'transform', `translate3d(0,${px((1 - cIn) * 40)},0) scale(${f3(lerp(0.94, 1, cIn))})`)
      css(el.caseResult, 'clipPath', `inset(0 0 0 ${f3((1 - wipe) * 100)}%)`)
      css(el.caseHandle, 'transform', `translate3d(${px((1 - wipe) * cW)},0,0)`)
      css(el.caseHandle, 'opacity', f3(wipe > 0.001 && wipe < 0.999 ? 1 : 0))
      css(el.caseL1, 'opacity', f3(1 - smooth(inv(0.55, 0.95, wipe))))
      css(el.caseL2, 'opacity', f3(0.35 + wipe * 0.65))

      /* luz do cursor (só no estúdio escuro) */
      sx = sx < -999 ? mx : lerp(sx, mx, 1 - Math.pow(0.86, dt / 16.67))
      sy = sy < -999 ? my : lerp(sy, my, 1 - Math.pow(0.86, dt / 16.67))
      css(el.spot, 'transform', `translate3d(${px(sx - 300)},${px(sy - 300)},0)`)
      css(el.spot, 'opacity', f3((1 - light) * (mx > -999 ? 1 : 0)))

      return canvasOp
    }

    // ---------- loop ----------
    let raf = 0
    let running = false
    let last = 0
    let loadK = 0
    const t0 = performance.now()
    function tick(now: number) {
      raf = 0
      const dt = Math.min(64, now - (last || now))
      last = now
      loadK = clamp((now - t0 - 150) / 1300)
      shown += (target - shown) * (1 - Math.pow(1 - 0.2, dt / 16.67))
      if (Math.abs(target - shown) < 0.00005) shown = target
      const cOp = apply(shown, now / 1000, dt)
      if (cOp > 0.001) scene?.render()
      if (running) raf = requestAnimationFrame(tick)
    }
    const start = () => {
      if (running) return
      running = true
      last = 0
      raf = requestAnimationFrame(tick)
    }
    const stop = () => {
      running = false
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    }

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !document.hidden) start()
        else stop()
      },
      { rootMargin: '200px 0px' },
    )
    io.observe(root)
    const onVis = () => {
      if (document.hidden) stop()
      else if (root.getBoundingClientRect().bottom > -200) start()
    }
    document.addEventListener('visibilitychange', onVis)

    const ro = new ResizeObserver(() => {
      layout()
      target = progress()
    })
    ro.observe(stage)
    layout()
    start()

    return () => {
      disposed = true
      stop()
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      stage.removeEventListener('pointerdown', onDown)
      scene?.dispose()
    }
  }, [])

  return (
    <section ref={rootRef} className="story" id="inicio" aria-label="Apresentação">
      <div ref={stageRef} className="stage" data-theme="light">
        {/* fundo */}
        <div className="st-dark" aria-hidden="true">
          <div className="st-glow" />
          <div className="st-grid" />
        </div>
        <div className="st-ivory" aria-hidden="true" />
        <div className="st-spot" aria-hidden="true" />
        <div className="st-watermark" aria-hidden="true">Precisão</div>

        {/* 1: quem faz */}
        <div className="st-portrait">
          <img src={img.drMatheus} alt="Dr. Matheus Jansen no consultório" fetchPriority="high" />
        </div>

        {/* 2: o trabalho dele */}
        {TILE_SRC.map((src, i) => (
          <div key={i} className="st-tile" aria-hidden="true">
            <img src={src} alt="" />
          </div>
        ))}

        {/* 3 e 4: a foto real */}
        <figure className="st-frame">
          <img className="soft" src={img.facetasMacroBlur} alt="" aria-hidden="true" />
          <img className="sharp" src={img.facetasMacro} alt="Facetas feitas pelo Dr. Matheus Jansen, vistas de perto" />
          <figcaption className="st-tag chip">Caso real · facetas</figcaption>
        </figure>
        <div className="st-iso" aria-hidden="true" />

        {/* 5 e 6: o dente em 3D */}
        <canvas ref={canvasRef} className="st-canvas" aria-hidden="true" />
        <svg className="st-lines" aria-hidden="true">
          {Array.from({ length: 7 }, (_, i) => (
            <path key={i} pathLength={1} />
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <g key={i}>
              <circle r="9" className="halo" />
              <circle r="3" />
            </g>
          ))}
        </svg>
        {marcacoesDente.map((m, i) => (
          <div key={m.n} className={`st-callout ${i === 0 || i === 2 ? 'is-left' : ''}`}>
            <span className="num">{m.n}</span>
            <span className="ttl">{m.titulo}</span>
            <span className="txt">{m.texto}</span>
          </div>
        ))}
        {marcacoesImplante.map((m) => (
          <div key={m.titulo} className="st-callout st-callout--impl">
            <span className="ttl">{m.titulo}</span>
            <span className="txt">{m.texto}</span>
          </div>
        ))}
        <p className="st-hint" aria-hidden="true">
          <span className="arrows">←</span> Arraste para girar <span className="arrows">→</span>
        </p>

        {/* 7: caso real */}
        <figure className="st-case">
          <img src={img.implantePlanejamento} alt="Planejamento da prótese sobre implantes no modelo" />
          <div className="result">
            <img src={img.implanteResultado} alt="O mesmo caso finalizado, na boca do paciente" />
          </div>
          <span className="handle" aria-hidden="true" />
          <figcaption>
            <span className="lbl-1 chip">01 · Planejamento</span>
            <span className="lbl-2 chip">02 · Resultado</span>
          </figcaption>
        </figure>

        {/* textos */}
        <Band id="me" kind="rise" className="b-me">
          <p className="eyebrow">
            <Words text="Reabilitação oral e estética" spread={0.2} />
          </p>
          <h1 className="display">
            <Words text="Esse sou" /> <em className="w" style={{ '--th': '0.45' } as CSSProperties}>eu.</em>
          </h1>
          <p className="name">
            <span className="w" style={{ '--th': '0.5' } as CSSProperties}>Dr. Matheus Jansen</span>
          </p>
          <p className="role">
            <span className="w" style={{ '--th': '0.6' } as CSSProperties}>Cirurgião-dentista</span>
          </p>
          <ul className="creds">
            <li>Membro da Sociedade Brasileira de Odontologia Estética</li>
            <li>Mentorias</li>
          </ul>
          <p className="sub">Conheça, a seguir, um pouco do trabalho realizado no consultório.</p>
        </Band>

        <Band id="people" kind="rise" className="b-people">
          <h2 className="display">
            <Words text="Técnica e cuidado" spread={0.35} />
            <br />
            <Words text="em cada" spread={0.1} />{' '}
            <em className="w accent" style={{ '--th': '0.5' } as CSSProperties}>etapa.</em>
          </h2>
        </Band>

        <Band id="result" kind="blur" className="b-result">
          <p className="eyebrow">
            <Words text="Casos reais" spread={0.2} />
          </p>
          <h2 className="display b-result__t1">
            <Words text="Estética com" />
          </h2>
          <p className="display b-result__t2">
            <em className="w" style={{ '--th': '0.45' } as CSSProperties}>naturalidade.</em>
          </p>
        </Band>

        <Band id="detail" kind="depth" className="b-detail">
          <h2 className="display">
            <Words text="Cada" />{' '}
            <br />
            <em className="w" style={{ '--th': '0.25' } as CSSProperties}>detalhe</em>{' '}
            <br />
            <span className="w" style={{ '--th': '0.45' } as CSSProperties}>importa.</span>
          </h2>
        </Band>

        <Band id="tooth" kind="blur" className="b-tooth">
          <h2 className="display display--sm">
            <Words text="Não se trata apenas" />
            <br />
            <Words text="de transformar" />{' '}
            <em className="w" style={{ '--th': '0.5' } as CSSProperties}>dentes.</em>
          </h2>
          <p className="sub">É devolver saúde, função e harmonia ao sorriso.</p>
        </Band>

        <Band id="implant" kind="halves" className="b-implant">
          <h2 className="display display--sm">
            <span className="half-a">
              <Words text="Existe um padrão" />
            </span>
            <br />
            <span className="half-b">
              <Words text="por trás de cada" /> <em className="w" style={{ '--th': '0.45' } as CSSProperties}>sorriso.</em>
            </span>
          </h2>
          <p className="sub">Planejamento digital, técnica e tempo. Nada fica por conta do acaso.</p>
        </Band>

        <Band id="caseReal" kind="slide" className="b-case">
          <h2 className="display display--sm">
            <Words text="Do planejamento" />
            <br />
            <span className="w" style={{ '--th': '0.3' } as CSSProperties}>ao</span>{' '}
            <em className="w" style={{ '--th': '0.45' } as CSSProperties}>sorriso.</em>
          </h2>
          <p className="sub">Caso real de reabilitação com implantes.</p>
        </Band>

        {/* navegação da apresentação */}
        <nav className="st-chap" aria-label="Capítulos">
          <span className="bar">
            <i />
          </span>
          <ol>
            {capitulos.map((c) => (
              <li key={c.n}>
                <span className="n">{c.n}</span>
                <span className="t">{c.nome}</span>
              </li>
            ))}
          </ol>
        </nav>

        <div className="st-cue" aria-hidden="true">
          <span className="shimmer">Role para conhecer o trabalho</span>
          <span className="line" />
        </div>
      </div>
    </section>
  )
}
