package __PACKAGE__;

import android.Manifest;
import android.app.AlarmManager;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int REQ_NOTIFICATION = 7501;
    private boolean exactAlarmDialogShown = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 알림 권한 요청 (안드로이드 13 이상에서 필요)
        if (Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                        != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(
                    new String[]{Manifest.permission.POST_NOTIFICATIONS},
                    REQ_NOTIFICATION
            );
        } else {
            requestExactAlarmAccessIfNeeded();
        }

        // 권한 설정 전에도 지연 알림을 예약하고, 권한을 받으면 정각 알림으로 다시 예약합니다.
        QuoteNotificationScheduler.schedule(this);
    }

    @Override
    protected void onResume() {
        super.onResume();
        QuoteNotificationScheduler.schedule(this);
    }

    @Override
    public void onRequestPermissionsResult(
            int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_NOTIFICATION) {
            requestExactAlarmAccessIfNeeded();
            QuoteNotificationScheduler.schedule(this);
        }
    }

    /** Android 12 이상에서 정각 알림에 필요한 특별 접근을 안내합니다. */
    private void requestExactAlarmAccessIfNeeded() {
        if (Build.VERSION.SDK_INT < 31 || exactAlarmDialogShown) {
            return;
        }

        AlarmManager manager = (AlarmManager) getSystemService(ALARM_SERVICE);
        if (manager == null || manager.canScheduleExactAlarms()) {
            return;
        }

        exactAlarmDialogShown = true;
        new AlertDialog.Builder(this)
                .setTitle("정각 알림 설정")
                .setMessage("매시 정각에 말씀을 받으려면 '알람 및 리마인더 허용'을 켜주세요.")
                .setNegativeButton("나중에", null)
                .setPositiveButton("설정 열기", (dialog, which) -> {
                    try {
                        Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                        intent.setData(Uri.parse("package:" + getPackageName()));
                        startActivity(intent);
                    } catch (Exception ignored) {
                        Intent fallback = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                        fallback.setData(Uri.parse("package:" + getPackageName()));
                        startActivity(fallback);
                    }
                })
                .show();
    }
}
