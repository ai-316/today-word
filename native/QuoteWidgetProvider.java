package __PACKAGE__;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.TypedValue;
import android.widget.RemoteViews;

import java.util.Random;

/**
 * '오늘의 한 말씀' 홈 화면 위젯
 *
 * - 30분마다 안드로이드가 자동으로 새 글을 띄웁니다 (updatePeriodMillis)
 * - 위젯을 손가락으로 누르면 즉시 다른 글로 바뀝니다
 * - 방금 나온 글은 연속으로 다시 나오지 않습니다
 */
public class QuoteWidgetProvider extends AppWidgetProvider {

    private static final String ACTION_REFRESH = "__PACKAGE__.ACTION_REFRESH_QUOTE";
    private static final String PREFS = "today_word_widget";
    private static final String KEY_LAST = "last_index";

    private final Random random = new Random();

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            render(context, appWidgetManager, id);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (intent != null && ACTION_REFRESH.equals(intent.getAction())) {
            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            int[] ids = manager.getAppWidgetIds(new ComponentName(context, QuoteWidgetProvider.class));
            for (int id : ids) {
                render(context, manager, id);
            }
        }
    }

    /** 글 하나를 골라 위젯 화면을 그립니다 */
    private void render(Context context, AppWidgetManager manager, int widgetId) {
        String[] quotes = context.getResources().getStringArray(R.array.widget_quotes);
        if (quotes.length == 0) {
            return;
        }

        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        int last = prefs.getInt(KEY_LAST, -1);

        int index;
        if (quotes.length == 1) {
            index = 0;
        } else {
            do {
                index = random.nextInt(quotes.length);
            } while (index == last);
        }
        prefs.edit().putInt(KEY_LAST, index).apply();

        String quote = quotes[index];

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_quote);
        views.setTextViewText(R.id.widget_quote_text, quote);

        // 글이 길면 글자 크기를 살짝 줄여 잘리지 않게 합니다
        float size = 16f;
        if (quote.length() > 90) {
            size = 12.5f;
        } else if (quote.length() > 60) {
            size = 14f;
        } else if (quote.length() > 35) {
            size = 15f;
        }
        views.setTextViewTextSize(R.id.widget_quote_text, TypedValue.COMPLEX_UNIT_SP, size);

        // 위젯을 누르면 새 글로 교체
        Intent refresh = new Intent(context, QuoteWidgetProvider.class);
        refresh.setAction(ACTION_REFRESH);
        PendingIntent pending = PendingIntent.getBroadcast(
                context,
                0,
                refresh,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_root, pending);

        manager.updateAppWidget(widgetId, views);
    }
}
