import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bell, Check, ChevronDown, LayoutGrid, Share2, Shuffle, Sun } from 'lucide-react'
import quotesConfig from './config/quotes.json'
import Backdrop from './components/Backdrop'

const QUOTES: string[] = (quotesConfig.quotes as unknown[])
  .map((q) => (typeof q === 'string' ? q : ((q as { text?: string })?.text ?? '')))
  .map((q) => q.trim())
  .filter(Boolean)

const NOTIFICATION = (quotesConfig.notification ?? {}) as {
  enabled?: boolean
  intervalMinutes?: number
  activeFrom?: number
  activeTo?: number
}

/** 연중 몇 번째 날인지 (그날의 말씀 결정용, 알림과 같은 규칙) */
function dayOfYear(): number {
  const now = new Date()
  return Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)
}

function formatSchedule(min: number): string {
  if (min === 60) return '매시 정각'
  if (min % 60 === 0) return `${min / 60}시간 간격 정각`
  return `${min}분 간격 정시`
}

/** 위젯 추가 방법 안내 */
const WIDGET_STEPS = [
  '홈 화면의 빈 곳을 꾹 길게 누릅니다',
  '아래에 나타나는 [위젯] 을 누릅니다',
  '목록에서 "오늘의 한 말씀" 을 찾습니다',
  '원하는 크기를 골라 홈 화면에 끌어다 놓습니다',
]

export default function App() {
  const total = QUOTES.length
  // 첫 화면은 알림과 같은 '그날의 말씀'부터 보여줍니다
  const [index, setIndex] = useState(() => (total > 0 ? dayOfYear() % total : 0))
  const [fadeKey, setFadeKey] = useState(0)
  const [copied, setCopied] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const timer = useRef<number | null>(null)

  const quote = QUOTES[index] ?? '글을 준비하고 있어요.'

  const shuffle = useCallback(() => {
    if (total <= 1) return
    let next = index
    while (next === index) next = Math.floor(Math.random() * total)
    setIndex(next)
    setFadeKey((k) => k + 1)
    try {
      navigator.vibrate?.(18)
    } catch {
      /* noop */
    }
  }, [index, total])

  const share = async () => {
    const text = `${quote}\n\n— 오늘의 한 말씀`
    try {
      if (navigator.share) {
        await navigator.share({ text })
        return
      }
      await navigator.clipboard.writeText(text)
      setCopied(true)
      if (timer.current) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* 사용자가 취소한 경우 */
    }
  }

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current) }, [])

  const dateLabel = useMemo(() => {
    const d = new Date()
    const days = ['일', '월', '화', '수', '목', '금', '토']
    return `${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`
  }, [])

  return (
    <div className="font-body relative min-h-dvh text-stone-800">
      <Backdrop />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-6 pb-8 pt-10">
        {/* 헤더 */}
        <header className="animate-rise flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-400 shadow-lg shadow-orange-200">
            <Sun className="h-6 w-6 text-white" strokeWidth={2.3} />
          </div>
          <div>
            <h1 className="font-display text-[22px] font-bold leading-none">오늘의 한 말씀</h1>
            <p className="mt-1.5 text-[12px] text-stone-500">{dateLabel}</p>
          </div>
        </header>

        {/* 말씀 카드 */}
        <main className="flex flex-1 items-center py-8">
          <div className="animate-rise w-full rounded-[32px] bg-white/75 p-7 shadow-xl shadow-amber-100/70 backdrop-blur-md" style={{ animationDelay: '90ms' }}>
            <svg viewBox="0 0 40 30" className="h-7 w-9 text-amber-300" fill="currentColor" aria-hidden>
              <path d="M0 30V16C0 7 5 1 14 0l2 5C10 6 7 9 7 14h7v16H0zm24 0V16C24 7 29 1 38 0l2 5c-6 1-9 4-9 9h7v16H24z" />
            </svg>

            <p
              key={fadeKey}
              className="font-display quote-fade mt-4 text-[22px] font-bold leading-[1.75] text-stone-800"
            >
              {quote}
            </p>

            <div className="mt-6 flex items-center gap-2 border-t border-amber-100 pt-4">
              <span className="text-[11.5px] font-semibold text-orange-500">
                {total > 0 ? `${index + 1} / ${total}` : '준비 중'}
              </span>
              <span className="text-[11.5px] text-stone-400">· 위젯은 30분마다 새 말씀</span>
            </div>
          </div>
        </main>

        {/* 버튼 */}
        <div className="animate-rise space-y-3" style={{ animationDelay: '180ms' }}>
          <button onClick={shuffle} className="btn-primary w-full">
            <Shuffle className="h-4.5 w-4.5" strokeWidth={2.5} />
            다른 말씀 보기
          </button>

          <button onClick={share} className="btn-soft w-full">
            {copied ? (
              <>
                <Check className="h-4.5 w-4.5 text-emerald-600" strokeWidth={2.6} />
                복사되었어요
              </>
            ) : (
              <>
                <Share2 className="h-4.5 w-4.5 text-orange-500" strokeWidth={2.3} />
                이 말씀 나누기
              </>
            )}
          </button>
        </div>

        {/* 매일 알림 안내 */}
        {NOTIFICATION.enabled !== false && (
          <div
            className="animate-rise mt-4 flex items-start gap-3 rounded-3xl bg-white/60 p-4 backdrop-blur-sm"
            style={{ animationDelay: '220ms' }}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Bell className="h-4.5 w-4.5" strokeWidth={2.2} />
            </div>
            <div className="flex-1">
              <p className="text-[13.5px] font-semibold text-stone-700">
                {formatSchedule(NOTIFICATION.intervalMinutes ?? 60)} 말씀 알림
              </p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-stone-500">
                {NOTIFICATION.activeFrom ?? 6}시 ~ {NOTIFICATION.activeTo ?? 23}시 사이에 잠금 화면으로
                말씀이 찾아옵니다. 앱 첫 실행 때 알림 '허용'을 눌러주세요.
              </p>
            </div>
          </div>
        )}

        {/* 위젯 안내 */}
        <div className="animate-rise mt-4 overflow-hidden rounded-3xl bg-white/60 backdrop-blur-sm" style={{ animationDelay: '260ms' }}>
          <button
            onClick={() => setGuideOpen((v) => !v)}
            className="flex w-full items-center gap-2.5 px-5 py-4 text-left"
          >
            <LayoutGrid className="h-4.5 w-4.5 shrink-0 text-orange-500" strokeWidth={2.2} />
            <span className="flex-1 text-[13.5px] font-semibold text-stone-700">홈 화면에 위젯 놓는 방법</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-stone-400 transition-transform duration-300 ${guideOpen ? 'rotate-180' : ''}`}
              strokeWidth={2.4}
            />
          </button>
          {guideOpen && (
            <ol className="space-y-2.5 px-5 pb-5">
              {WIDGET_STEPS.map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-700">
                    {i + 1}
                  </span>
                  <span className="text-[13px] leading-relaxed text-stone-600">{step}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}
