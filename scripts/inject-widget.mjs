/**
 * native/ 폴더의 안드로이드 네이티브 코드(위젯 + 매일 알림)를
 * Capacitor가 생성한 android 프로젝트 안으로 복사하고
 * AndroidManifest.xml 에 권한과 컴포넌트(리시버)를 등록합니다.
 *
 * GitHub Actions 빌드 중 자동으로 실행됩니다.
 */
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'node:fs'
import { dirname } from 'node:path'

const cfg = JSON.parse(readFileSync('capacitor.config.json', 'utf8'))
const PKG = cfg.appId
const pkgDir = PKG.split('.').join('/')

const ANDROID = 'android/app/src/main'
const MANIFEST = `${ANDROID}/AndroidManifest.xml`

if (!existsSync(MANIFEST)) {
  console.error('❌ android 프로젝트를 찾을 수 없습니다. npx cap add android 먼저 실행되어야 합니다.')
  process.exit(1)
}

/* ── 매니페스트 삽입 헬퍼 ─────────────────────── */
function insertBeforeApplicationClose(xml, block) {
  const idx = xml.lastIndexOf('</application>')
  if (idx === -1) {
    console.error('❌ AndroidManifest.xml 구조를 이해할 수 없습니다.')
    process.exit(1)
  }
  return xml.slice(0, idx) + block + '    ' + xml.slice(idx)
}

/* 1) Java 파일 복사 (패키지명 자동 치환) */
const JAVA_FILES = [
  'QuoteWidgetProvider.java',
  'QuoteNotificationScheduler.java',
  'QuoteAlarmReceiver.java',
  'BootCompletedReceiver.java',
  'QuoteFullScreenActivity.java',
  'MainActivity.java',
]
for (const file of JAVA_FILES) {
  const src = readFileSync(`native/${file}`, 'utf8')
  const out = `${ANDROID}/java/${pkgDir}/${file}`
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, src.replace(/__PACKAGE__/g, PKG), 'utf8')
  console.log(`✅ ${file} 복사 완료`)
}

/* 2) 위젯/알림 리소스(레이아웃·아이콘·문구) 복사 */
cpSync('native/res', `${ANDROID}/res`, { recursive: true })
console.log('✅ 리소스 복사 완료')

/* 3) AndroidManifest.xml 수정 */
let manifest = readFileSync(MANIFEST, 'utf8')

// 3-1) 알림에 필요한 권한 추가
const NEEDED_PERMISSIONS = [
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.RECEIVE_BOOT_COMPLETED',
  'android.permission.SCHEDULE_EXACT_ALARM',
  'android.permission.USE_FULL_SCREEN_INTENT',
  'android.permission.TURN_SCREEN_ON',
  'android.permission.VIBRATE',
]
const missing = NEEDED_PERMISSIONS.filter((p) => !manifest.includes(p))
if (missing.length > 0) {
  const block = missing.map((p) => `    <uses-permission android:name="${p}" />`).join('\n') + '\n\n'
  manifest = manifest.replace(/<manifest[^>]*>/, (m) => `${m}\n${block}`)
  console.log(`✅ 권한 ${missing.length}개 추가`)
} else {
  console.log('ℹ️  권한이 이미 등록되어 있습니다.')
}

// 3-2) 홈 화면 위젯 등록
if (!manifest.includes('QuoteWidgetProvider')) {
  const receiver = `
        <receiver
            android:name=".QuoteWidgetProvider"
            android:exported="true"
            android:label="@string/widget_name">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
                <action android:name="${PKG}.ACTION_REFRESH_QUOTE" />
            </intent-filter>
            <meta-data
                android:name="android.appwidget.provider"
                android:resource="@xml/quote_widget_info" />
        </receiver>
`
  manifest = insertBeforeApplicationClose(manifest, receiver)
  console.log('✅ 위젯 등록 완료')
} else {
  console.log('ℹ️  위젯이 이미 등록되어 있습니다.')
}

// 3-3) 정각 알림 리시버 등록
if (!manifest.includes('QuoteAlarmReceiver')) {
  const receivers = `
        <receiver
            android:name=".QuoteAlarmReceiver"
            android:exported="false" />
        <receiver
            android:name=".BootCompletedReceiver"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED" />
            </intent-filter>
        </receiver>
`
  manifest = insertBeforeApplicationClose(manifest, receivers)
  console.log('✅ 알림 리시버 등록 완료')
} else {
  console.log('ℹ️  알림 리시버가 이미 등록되어 있습니다.')
}

// 3-4) 잠금화면 전체화면 액티비티 등록
if (!manifest.includes('QuoteFullScreenActivity')) {
  const activity = `
        <activity
            android:name=".QuoteFullScreenActivity"
            android:excludeFromRecents="true"
            android:exported="false"
            android:launchMode="singleTask"
            android:showOnLockScreen="true"
            android:taskAffinity=""
            android:theme="@android:style/Theme.Material.Light.NoActionBar" />
`
  manifest = insertBeforeApplicationClose(manifest, activity)
  console.log('✅ 전체화면 액티비티 등록 완료')
} else {
  console.log('ℹ️  전체화면 액티비티가 이미 등록되어 있습니다.')
}

writeFileSync(MANIFEST, manifest, 'utf8')
console.log('🎉 네이티브 코드 삽입 완료')
