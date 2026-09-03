package __PACKAGE__;

import android.app.KeyguardManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import java.util.Random;

/**
 * 알림이 울릴 때 말씀을 잠금화면 전면에 띄웁니다.
 *
 * - 화면이 잠겨 있으면: 전체 화면으로 말씀이 크게 표시됩니다
 * - 화면을 쓰고 있으면: 위에서 내려오는 알림(헤드업)으로 표시됩니다
 */
public class QuoteAlarmReceiver extends BroadcastReceiver {

    private static final String CHANNEL_ID = "quote_fullscreen_v3";
    private static final int NOTIFICATION_ID = 8003;
    private static final Random RANDOM = new Random();

    @Override
    public void onReceive(Context context, Intent intent) {
        String[] quotes = context.getResources().getStringArray(R.array.widget_quotes);
        if (quotes.length == 0) {
            QuoteNotificationScheduler.schedule(context);
            return;
        }

        String quote = quotes[RANDOM.nextInt(quotes.length)];

        NotificationManager manager =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) {
            QuoteNotificationScheduler.schedule(context);
            return;
        }

        // 중요도 높음 채널 — 잠금화면과 화면 위쪽에 크게 표시됩니다
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "오늘의 한 말씀",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("정해진 간격으로 말씀을 전해드립니다");
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            channel.enableVibration(true);
            manager.createNotificationChannel(channel);
        }

        // 전체 화면으로 띄울 화면
        Intent fullScreen = new Intent(context, QuoteFullScreenActivity.class);
        fullScreen.putExtra(QuoteFullScreenActivity.EXTRA_QUOTE, quote);
        fullScreen.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        PendingIntent fullScreenPending = PendingIntent.getActivity(
                context,
                8004,
                fullScreen,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Notification.Builder builder =
                Build.VERSION.SDK_INT >= 26
                        ? new Notification.Builder(context, CHANNEL_ID)
                        : new Notification.Builder(context);

        builder.setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(context.getString(R.string.app_name))
                .setContentText(quote)
                .setStyle(new Notification.BigTextStyle().bigText(quote))
                .setAutoCancel(true)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .setCategory(Notification.CATEGORY_ALARM)
                .setContentIntent(fullScreenPending)
                .setFullScreenIntent(fullScreenPending, true)
                .setDefaults(Notification.DEFAULT_ALL);

        if (Build.VERSION.SDK_INT < 26) {
            builder.setPriority(Notification.PRIORITY_HIGH);
        }

        manager.notify(NOTIFICATION_ID, builder.build());

        // 잠겨 있을 때는 전체 화면을 직접 띄웁니다 (구형 기기 대응)
        if (Build.VERSION.SDK_INT < 29) {
            KeyguardManager keyguard =
                    (KeyguardManager) context.getSystemService(Context.KEYGUARD_SERVICE);
            if (keyguard != null && keyguard.isKeyguardLocked()) {
                try {
                    context.startActivity(fullScreen);
                } catch (Exception ignored) {
                    /* 시스템이 막은 경우 알림만 표시됩니다 */
                }
            }
        }

        // 다음 정각 알림 예약
        QuoteNotificationScheduler.schedule(context);
    }
}
