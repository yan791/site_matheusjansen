import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/* ------------------------------------------------------------------
   Cena 3D: incisivo central (coroa), pilar protético e implante.
   Tudo procedural, sem arquivos de modelo. A coroa fica com a borda
   incisal para baixo, igual aos dentes da foto de onde ela nasce.
   ------------------------------------------------------------------ */

const sstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}
const spow = (v: number, e: number) => Math.sign(v) * Math.pow(Math.abs(v), e)

/** Superfície fechada em anel: point(u, v) com u periódico. */
function ringSurface(
  U: number,
  V: number,
  point: (u: number, v: number) => [number, number, number],
  color?: (v: number) => THREE.Color,
  flip = false,
) {
  const pos = new Float32Array((V + 1) * U * 3)
  const uv = new Float32Array((V + 1) * U * 2)
  const col = color ? new Float32Array((V + 1) * U * 3) : null
  for (let j = 0; j <= V; j++) {
    const v = j / V
    const c = color?.(v)
    for (let i = 0; i < U; i++) {
      const u = i / U
      const k = j * U + i
      const [x, y, z] = point(u, v)
      pos.set([x, y, z], k * 3)
      uv.set([u, v], k * 2)
      if (col && c) col.set([c.r, c.g, c.b], k * 3)
    }
  }
  const idx: number[] = []
  for (let j = 0; j < V; j++) {
    for (let i = 0; i < U; i++) {
      const a = j * U + i
      const b = j * U + ((i + 1) % U)
      const c = (j + 1) * U + i
      const d = (j + 1) * U + ((i + 1) % U)
      if (flip) idx.push(a, c, b, b, c, d)
      else idx.push(a, b, c, b, d, c)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  if (col) g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/* ---------- Coroa: incisivo central superior ---------- */
function incisorGeometry() {
  const cCerv = new THREE.Color('#e6cfae')
  const cBody = new THREE.Color('#efe8dc')
  const cEdge = new THREE.Color('#b9c6cf')
  const cHalo = new THREE.Color('#f4f1ea')
  const tmp = new THREE.Color()

  return ringSurface(
    176,
    200,
    (u, v) => {
      const th = u * Math.PI * 2
      const cs = Math.cos(th)
      const sn = Math.sin(th)

      // silhueta ao longo da altura (v = 0 cervical em cima, 1 borda incisal embaixo)
      let W = 0.305 + 0.135 * sstep(0, 0.72, v)
      let D = THREE.MathUtils.lerp(0.3, 0.07, Math.pow(v, 1.12))
      let y = 0.55 - 1.1 * v

      if (v > 0.9) {
        const q = (v - 0.9) / 0.1
        D *= Math.sqrt(Math.max(0, 1 - q * q))
        W *= 1 - 0.06 * q * q
      }
      if (v < 0.06) {
        const q = 1 - v / 0.06
        const s = Math.sqrt(Math.max(0, 1 - q * q))
        W *= s
        D *= s
        y = 0.55 - 1.1 * 0.06 + 0.075 * q
      }

      let x = W * spow(cs, 2 / 2.7)
      let z = D * spow(sn, 2 / 2.1)
      const xn = W > 1e-5 ? x / W : 0

      if (sn < 0) {
        // face lingual em pá, com cristas marginais
        const fossa = 0.38 * sstep(0.3, 0.86, v) * (1 - Math.pow(Math.abs(xn), 3))
        z *= 1 - fossa
      } else {
        // três lóbulos vestibulares com sulcos suaves
        const g = sstep(0.12, 0.78, v) * (1 - sstep(0.9, 1, v))
        const groove =
          Math.exp(-(((xn - 0.34) / 0.13) ** 2)) + Math.exp(-(((xn + 0.34) / 0.13) ** 2))
        z -= 0.0042 * g * groove * sn
      }

      // convexidade vestibular e leve inclinação
      z += 0.048 * Math.sin(Math.PI * v * 0.95) - 0.022 * v
      // linha cervical curva (sela): sobe no meio das faces, desce nas proximais
      y += (1 - sstep(0, 0.4, v)) * sstep(0, 0.06, v) * (0.085 * sn * sn - 0.04 * cs * cs)
      // mamelões discretos na borda
      if (v > 0.93) y += 0.0028 * Math.sin(xn * Math.PI * 3) * sstep(0.93, 1, v)
      // canto distal um pouco mais arredondado que o mesial
      if (v > 0.8 && x > 0) y += 0.03 * sstep(0.8, 1, v) * Math.pow(Math.max(0, xn), 4)
      x *= 1

      return [x, y, z]
    },
    (v) => {
      tmp.copy(cCerv).lerp(cBody, sstep(0.02, 0.42, v))
      tmp.lerp(cEdge, sstep(0.68, 0.97, v))
      tmp.lerp(cHalo, sstep(0.975, 1, v) * 0.8)
      return tmp.clone()
    },
  )
}

/* ---------- Implante cônico com rosca ---------- */
function implantGeometry(L = 1.25) {
  const pitch = 0.085
  return ringSurface(
    112,
    460,
    (u, v) => {
      const th = u * Math.PI * 2
      const y = L * v
      let r0 = 0.205 - 0.05 * sstep(0.3, 1, v)
      if (v < 0.006) r0 *= v / 0.006
      const phase = y / pitch - u
      const f = phase - Math.floor(phase)
      const tri = Math.pow(1 - Math.abs(2 * f - 1), 1.5)
      const amp = 0.042 * sstep(0.09, 0.14, v) * (1 - sstep(0.88, 0.96, v))
      let r = r0 - 0.012 + amp * tri
      if (v < 0.09 && v >= 0.006) r = 0.214 // colar polido
      if (v > 0.93) {
        const q = (v - 0.93) / 0.07
        r *= Math.sqrt(Math.max(0, 1 - q * q))
      }
      return [r * Math.cos(th), y, r * Math.sin(th)]
    },
    undefined,
    true,
  )
}

/* ---------- Pilar protético ---------- */
function abutmentGeometry() {
  const p = [
    [0, 0],
    [0.1, 0],
    [0.128, 0.018],
    [0.152, 0.29],
    [0.162, 0.305],
    [0.232, 0.345],
    [0.25, 0.372],
    [0.236, 0.43],
    [0.216, 0.515],
    [0.2, 0.55],
    [0, 0.55],
  ].map(([r, y]) => new THREE.Vector2(r, y))
  return new THREE.LatheGeometry(p, 96)
}

/* ---------- Texturas geradas ---------- */
function perikymataTexture() {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 1024
  const g = c.getContext('2d')!
  const img = g.createImageData(c.width, c.height)
  let seed = 7
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296)
  const noise = Array.from({ length: 64 }, () => rnd())
  for (let y = 0; y < c.height; y++) {
    const v = y / c.height
    const amp = 0.55 * (1 - sstep(0.55, 0.95, v)) + 0.12
    const wob = noise[Math.floor(v * 63)] * 0.9
    for (let x = 0; x < c.width; x++) {
      const line = Math.sin((v * 62 + wob + Math.sin(x / c.width * 6.283) * 0.08) * Math.PI * 2)
      const fine = Math.sin((v * 190 + x * 0.013) * Math.PI * 2) * 0.25
      const val = 128 + 127 * amp * (0.75 * line + fine) * 0.5 + (rnd() - 0.5) * 10
      const k = (y * c.width + x) * 4
      img.data[k] = img.data[k + 1] = img.data[k + 2] = val
      img.data[k + 3] = 255
    }
  }
  g.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = THREE.RepeatWrapping
  t.colorSpace = THREE.NoColorSpace
  t.anisotropy = 4
  return t
}

function translucencyTexture() {
  const c = document.createElement('canvas')
  c.width = 4
  c.height = 256
  const g = c.getContext('2d')!
  for (let y = 0; y < c.height; y++) {
    const v = y / c.height
    const t = 0.05 + 0.72 * sstep(0.6, 0.99, v)
    const b = Math.round(t * 255)
    g.fillStyle = `rgb(${b},${b},${b})`
    g.fillRect(0, y, 4, 1)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.NoColorSpace
  return tex
}

/* ------------------------------------------------------------------ */

export type ScreenPoint = { x: number; y: number; front: number }

export type SceneState = {
  rotY: number
  tiltX: number
  explode: number // 0 montado, 1 explodido
  partsIn: number // 0 peças escondidas acima, 1 no lugar
  spin: number // giro do implante (rosqueando)
  camDist: number
  camTargetY: number
  shiftX: number // desloca o grupo na tela (unidades de mundo)
  shiftY: number
  scale: number
}

export class ToothScene {
  renderer: THREE.WebGLRenderer
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
  root = new THREE.Group()
  crown: THREE.Mesh
  abutment: THREE.Mesh
  implant: THREE.Mesh
  partMats: THREE.MeshStandardMaterial[]
  w = 1
  h = 1
  private v3 = new THREE.Vector3()
  private n3 = new THREE.Vector3()
  private camPos = new THREE.Vector3()

  // pontos de interesse (coordenadas locais)
  readonly toothAnchors = [
    { p: new THREE.Vector3(-0.43, -0.12, 0.05), n: new THREE.Vector3(-1, 0, 0.35) }, // forma
    { p: new THREE.Vector3(0.1, 0.12, 0.3), n: new THREE.Vector3(0.1, 0.1, 1) }, // textura
    { p: new THREE.Vector3(-0.08, -0.53, 0.02), n: new THREE.Vector3(0, -0.6, 1) }, // translucidez
    { p: new THREE.Vector3(0.38, 0.3, 0.16), n: new THREE.Vector3(0.9, 0, 0.6) }, // acabamento
  ]

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.toneMapping = THREE.AgXToneMapping
    this.renderer.toneMappingExposure = 1.0
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    const pmrem = new THREE.PMREMGenerator(this.renderer)
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    this.scene.environmentIntensity = 0.5
    pmrem.dispose()

    const key = new THREE.DirectionalLight('#fff1e2', 2.1)
    key.position.set(-4, 2.6, 2.6)
    const rim = new THREE.DirectionalLight('#d4e6ff', 3.2)
    rim.position.set(3.4, 1.4, -3.2)
    const rim2 = new THREE.DirectionalLight('#ffe6d6', 1.4)
    rim2.position.set(-3.4, -1.2, -2.6)
    const fill = new THREE.DirectionalLight('#ffffff', 0.25)
    fill.position.set(2.4, -1.2, 3)
    this.scene.add(key, rim, rim2, fill)

    const enamel = new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      vertexColors: true,
      roughness: 0.34,
      metalness: 0,
      clearcoat: 0.8,
      clearcoatRoughness: 0.16,
      sheen: 0.15,
      sheenRoughness: 0.45,
      sheenColor: new THREE.Color('#fff4e6'),
      ior: 1.62,
      specularIntensity: 0.7,
      transmission: 1,
      transmissionMap: translucencyTexture(),
      thickness: 0.32,
      attenuationColor: new THREE.Color('#e9d8c2'),
      attenuationDistance: 0.8,
      bumpMap: perikymataTexture(),
      bumpScale: 0.25,
    })
    this.crown = new THREE.Mesh(incisorGeometry(), enamel)

    const titanium = new THREE.MeshStandardMaterial({
      color: '#c6cace',
      metalness: 1,
      roughness: 0.4,
      transparent: true,
    })
    const polished = new THREE.MeshStandardMaterial({
      color: '#d4d7da',
      metalness: 1,
      roughness: 0.18,
      transparent: true,
    })
    this.partMats = [titanium, polished]
    this.implant = new THREE.Mesh(implantGeometry(), titanium)
    this.abutment = new THREE.Mesh(abutmentGeometry(), polished)

    this.root.add(this.crown, this.abutment, this.implant)
    this.scene.add(this.root)
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w
    this.h = h
    this.renderer.setPixelRatio(Math.min(dpr, 1.75))
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  /** altura visível em unidades de mundo a uma distância d */
  viewHeight(d: number) {
    return 2 * d * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))
  }

  apply(s: SceneState, time: number) {
    const float = Math.sin(time * 0.8) * 0.012
    this.root.rotation.set(s.tiltX, s.rotY + Math.sin(time * 0.35) * 0.04, 0)
    this.root.scale.setScalar(s.scale)
    this.root.position.set(s.shiftX, s.shiftY + float, 0)

    const e = s.explode
    this.crown.position.y = -0.55 * e
    const hidden = 1 - s.partsIn
    this.abutment.position.y = 0.18 + 0.34 * e + 2.6 * hidden * hidden
    this.implant.position.y = 0.73 + 0.78 * e + 3.4 * hidden * hidden
    this.implant.rotation.y = s.spin
    this.abutment.rotation.y = s.spin * 0.25
    const op = s.partsIn
    for (const m of this.partMats) {
      m.opacity = op
      m.transparent = op < 0.999
      m.depthWrite = op > 0.5
    }
    this.abutment.visible = this.implant.visible = op > 0.002

    this.camPos.set(0, s.camTargetY - 0.04, s.camDist)
    this.camera.position.copy(this.camPos)
    this.camera.lookAt(0, s.camTargetY, 0)
    this.root.updateMatrixWorld(true)
    this.camera.updateMatrixWorld()
  }

  readonly implantAnchors = [
    { obj: 'implant', p: new THREE.Vector3(0.22, 0.62, 0.05) },
    { obj: 'abutment', p: new THREE.Vector3(0.26, 0.37, 0) },
    { obj: 'crown', p: new THREE.Vector3(0.44, -0.05, 0.1) },
  ] as const

  projectImplantAnchor(j: number) {
    const a = this.implantAnchors[j]
    return this.project(this[a.obj], a.p)
  }

  /** projeta um ponto local de um objeto para pixels de tela */
  project(obj: THREE.Object3D, local: THREE.Vector3, normal?: THREE.Vector3): ScreenPoint {
    this.v3.copy(local)
    obj.localToWorld(this.v3)
    let front = 1
    if (normal) {
      this.n3.copy(normal).transformDirection(obj.matrixWorld)
      const toCam = this.camera.position.clone().sub(this.v3).normalize()
      front = this.n3.dot(toCam)
    }
    this.v3.project(this.camera)
    return {
      x: (this.v3.x * 0.5 + 0.5) * this.w,
      y: (-this.v3.y * 0.5 + 0.5) * this.h,
      front,
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.geometry) m.geometry.dispose()
      const mat = m.material as THREE.Material | undefined
      if (mat) mat.dispose()
    })
    this.renderer.dispose()
  }
}
