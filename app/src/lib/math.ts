export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** 0..1 conforme p atravessa [a, b] */
export const inv = (a: number, b: number, p: number) => clamp((p - a) / (b - a))
export const smooth = (t: number) => t * t * (3 - 2 * t)
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
/** sobe em [a, a+r], segura, desce em [b-r, b] */
export const band = (p: number, a: number, b: number, r = 0.02, openStart = false, openEnd = false) => {
  const up = openStart ? 1 : smooth(inv(a, a + r, p))
  const down = openEnd ? 1 : 1 - smooth(inv(b - r, b, p))
  return up * down
}
