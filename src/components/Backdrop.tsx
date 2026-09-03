import { useMemo } from 'react'

/** 밝은 아침 느낌의 배경 — 햇살, 구름, 떠다니는 빛알갱이 */
export default function Backdrop() {
  const motes = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 5 + Math.random() * 8,
        delay: Math.random() * 16,
        duration: 14 + Math.random() * 10,
        sway: 16 + Math.random() * 28,
        opacity: 0.35 + Math.random() * 0.4,
        warm: Math.random() > 0.4,
      })),
    [],
  )

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #CDEBFF 0%, #E4F4FF 30%, #FFF6DC 68%, #FFEECB 100%)',
        }}
      />

      {/* 아침 해 */}
      <div className="absolute -top-24 -right-16 h-72 w-72">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(255,224,138,0.95) 0%, rgba(255,214,120,0.5) 42%, rgba(255,214,120,0) 70%)',
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: 'radial-gradient(circle at 38% 32%, #FFFDF3, #FFDE8A)' }}
        />
      </div>

      {/* 구름 */}
      {[
        { top: '8%', left: '3%', scale: 0.95, dur: '72s' },
        { top: '17%', left: '60%', scale: 0.68, dur: '88s' },
      ].map((c, i) => (
        <div
          key={i}
          className="cloud absolute"
          style={{
            top: c.top,
            left: c.left,
            ['--cs' as string]: c.scale,
            animationDuration: c.dur,
          }}
        >
          <div className="h-9 w-24 rounded-full bg-white/80 blur-[6px]" />
          <div className="-mt-7 ml-4 h-10 w-14 rounded-full bg-white/85 blur-[6px]" />
          <div className="-mt-8 ml-12 h-7 w-12 rounded-full bg-white/70 blur-[6px]" />
        </div>
      ))}

      {/* 떠다니는 빛알갱이 */}
      {motes.map((m) => (
        <span
          key={m.id}
          className="mote absolute block rounded-full"
          style={{
            left: `${m.left}%`,
            width: m.size,
            height: m.size,
            animationDelay: `${m.delay}s`,
            animationDuration: `${m.duration}s`,
            opacity: m.opacity,
            ['--sway' as string]: `${m.sway}px`,
            background: m.warm
              ? 'radial-gradient(circle at 35% 30%, #FFF6D8, #FFD98A)'
              : 'radial-gradient(circle at 35% 30%, #FFFFFF, #DCEEFF)',
          }}
        />
      ))}
    </div>
  )
}
