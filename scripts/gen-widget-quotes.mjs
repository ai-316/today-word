/**
 * src/config/quotes.json 의 글과 알림 설정을
 * 안드로이드가 읽는 XML 리소스로 자동 변환합니다.
 *
 * 사장님은 quotes.json 하나만 수정하면 됩니다:
 *  - quotes       : 위젯/앱/알림에 표시되는 글 목록
 *  - notification : 정시 알림 간격과 알림을 받을 시간대
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const SRC = 'src/config/quotes.json'
const OUT_QUOTES = 'android/app/src/main/res/values/widget_quotes.xml'
const OUT_CONFIG = 'android/app/src/main/res/values/widget_config.xml'

/** 안드로이드 문자열 리소스 규칙에 맞게 escape */
function esc(raw) {
  let s = String(raw)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r\n|\r|\n/g, '\\n')
  if (s.startsWith('@') || s.startsWith('?')) s = '\\' + s
  return s.trim()
}

let quotes = []
let notification = {}
try {
  const json = JSON.parse(readFileSync(SRC, 'utf8'))
  quotes = (json.quotes || [])
    .map((q) => (typeof q === 'string' ? q : q?.text || ''))
    .map((q) => q.trim())
    .filter(Boolean)
  notification = json.notification || {}
} catch (e) {
  console.error('quotes.json 읽기 실패:', e.message)
}

if (quotes.length === 0) {
  quotes = ['오늘 하루도 당신에게 주어진 선물입니다.']
}

const intervalMinutes = Number.isInteger(notification.intervalMinutes)
  ? Math.max(1, notification.intervalMinutes)
  : 60
const activeFrom = Number.isInteger(notification.activeFrom) ? notification.activeFrom : 0
const activeTo = Number.isInteger(notification.activeTo) ? notification.activeTo : 24
const enabled = notification.enabled !== false

const items = quotes.map((q) => `        <item>${esc(q)}</item>`).join('\n')
const xml = `<?xml version="1.0" encoding="utf-8"?>
<!-- 이 파일은 scripts/gen-widget-quotes.mjs 가 자동 생성합니다. 직접 수정하지 마세요. -->
<resources>
    <string-array name="widget_quotes">
${items}
    </string-array>
</resources>
`

const configXml = `<?xml version="1.0" encoding="utf-8"?>
<!-- quotes.json 의 notification 설정에서 자동 생성되었습니다. 직접 수정하지 마세요. -->
<resources>
    <integer name="notification_interval_minutes">${intervalMinutes}</integer>
    <integer name="notification_active_from">${activeFrom}</integer>
    <integer name="notification_active_to">${activeTo}</integer>
    <bool name="notification_enabled">${enabled}</bool>
</resources>
`

mkdirSync(dirname(OUT_QUOTES), { recursive: true })
writeFileSync(OUT_QUOTES, xml, 'utf8')
writeFileSync(OUT_CONFIG, configXml, 'utf8')
console.log(`✅ 위젯 글귀 ${quotes.length}개 생성 → ${OUT_QUOTES}`)
console.log(
  `✅ 알림 설정 생성 (켜짐=${enabled}, 자정 기준 ${intervalMinutes}분 간격, ${activeFrom}시~${activeTo}시) → ${OUT_CONFIG}`
)
