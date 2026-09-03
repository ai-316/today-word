package __PACKAGE__;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import java.util.Calendar;

/**
 * '오늘의 한 말씀' 반복 알림 예약기
 *
 * - 기본: 매시 정각 (quotes.json 의 intervalMinutes 로 조절)
 * - 조용한 시간대 설정 가능 (activeFrom ~ activeTo 시각 사이에만 알림)
 * - 알림이 울릴 때마다 다음 알림을 다시 예약합니다
 */
public class QuoteNotificationScheduler {

    private static final int REQUEST_CODE = 8001;
    public static final String ACTION = "__PACKAGE__.ACTION_DAILY_QUOTE";

    public static void schedule(Context context) {
        boolean enabled = context.getResources().getBoolean(R.bool.notification_enabled);
        if (!enabled) {
            return;
        }

        int interval = context.getResources().getInteger(R.integer.notification_interval_minutes);
        if (interval < 1) {
            interval = 60;
        }
        int activeFrom = context.getResources().getInteger(R.integer.notification_active_from);
        int activeTo = context.getResources().getInteger(R.integer.notification_active_to);

        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) {
            return;
        }

        Intent intent = new Intent(context, QuoteAlarmReceiver.class);
        intent.setAction(ACTION);
        PendingIntent pending = PendingIntent.getBroadcast(
                context,
                REQUEST_CODE,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // 실행 시각이 아니라 자정 기준의 다음 간격 경계에 맞춥니다.
        // 예: 60분 설정에서 9:20에 실행하면 10:00, 이후 11:00, 12:00입니다.
        Calendar now = Calendar.getInstance();
        Calendar next = (Calendar) now.clone();
        next.set(Calendar.SECOND, 0);
        next.set(Calendar.MILLISECOND, 0);

        int minuteOfDay = now.get(Calendar.HOUR_OF_DAY) * 60
                + now.get(Calendar.MINUTE);
        int nextSlot = ((minuteOfDay / interval) + 1) * interval;
        if (nextSlot >= 24 * 60) {
            next.add(Calendar.DAY_OF_YEAR, 1);
            next.set(Calendar.HOUR_OF_DAY, 0);
            next.set(Calendar.MINUTE, 0);
        } else {
            next.set(Calendar.HOUR_OF_DAY, nextSlot / 60);
            next.set(Calendar.MINUTE, nextSlot % 60);
        }

        // 조용한 시간대라면 다음 활동 시작 시각으로 미룹니다
        next = shiftIntoActiveWindow(next, activeFrom, activeTo);

        boolean canExact = true;
        if (Build.VERSION.SDK_INT >= 31) {
            canExact = alarmManager.canScheduleExactAlarms();
        }

        if (canExact && Build.VERSION.SDK_INT >= 23) {
            alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP, next.getTimeInMillis(), pending);
        } else if (Build.VERSION.SDK_INT >= 23) {
            alarmManager.setAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP, next.getTimeInMillis(), pending);
        } else {
            alarmManager.set(AlarmManager.RTC_WAKEUP, next.getTimeInMillis(), pending);
        }
    }

    /** activeFrom ~ activeTo 시간대 밖이면 다음 시작 시각으로 옮깁니다 */
    private static Calendar shiftIntoActiveWindow(Calendar time, int from, int to) {
        if (from <= 0 && to >= 24) {
            return time; // 24시간 항상 알림
        }
        int hour = time.get(Calendar.HOUR_OF_DAY);
        boolean inside = (from < to)
                ? (hour >= from && hour < to)
                : (hour >= from || hour < to); // 자정을 넘는 구간

        if (inside) {
            return time;
        }

        Calendar shifted = (Calendar) time.clone();
        shifted.set(Calendar.HOUR_OF_DAY, Math.max(0, Math.min(23, from)));
        shifted.set(Calendar.MINUTE, 0);
        shifted.set(Calendar.SECOND, 0);
        shifted.set(Calendar.MILLISECOND, 0);
        if (shifted.getTimeInMillis() <= System.currentTimeMillis()) {
            shifted.add(Calendar.DAY_OF_YEAR, 1);
        }
        return shifted;
    }
}
