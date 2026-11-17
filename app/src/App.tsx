import { useEffect } from 'react'
import { MotionConfig } from 'motion/react'
import Lenis from 'lenis'
import Story from './components/Story'
import { Endless, Footer, Header, Invite, Proof } from './components/Sections'
import { ScrollProgress } from './components/motion/primitives'

export default function App() {
  useEffect(() => {
    // rolagem com inércia suave (a animação roda sempre, sem opção de desligar)
    const lenis = new Lenis({ autoRaf: true, lerp: 0.11, anchors: { offset: 0 }, smoothWheel: true })
    return () => lenis.destroy()
  }, [])

  return (
    <MotionConfig reducedMotion="never">
      <ScrollProgress className="bg-nude/80" />
      <div className="grain" aria-hidden="true" />
      <Header />
      <main id="main" tabIndex={-1}>
        <Story />
        <Proof />
        <Endless />
        <Invite />
      </main>
      <Footer />
    </MotionConfig>
  )
}
