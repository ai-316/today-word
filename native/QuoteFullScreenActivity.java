package __PACKAGE__;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

/**
 * 잠금화면 위에 말씀을 크게 보여주는 화면
 */
public class QuoteFullScreenActivity extends Activity {

    public static final String EXTRA_QUOTE = "extra_quote";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 잠금화면 위에 표시하고 화면을 켭니다
        if (Build.VERSION.SDK_INT >= 27) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager keyguard = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (keyguard != null) {
                keyguard.requestDismissKeyguard(this, null);
            }
        } else {
            getWindow().addFlags(
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                            | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                            | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            );
        }

        setContentView(R.layout.activity_quote_fullscreen);

        String quote = getIntent() != null ? getIntent().getStringExtra(EXTRA_QUOTE) : null;
        if (quote == null || quote.trim().isEmpty()) {
            String[] quotes = getResources().getStringArray(R.array.widget_quotes);
            quote = quotes.length > 0 ? quotes[0] : "";
        }

        TextView text = findViewById(R.id.fullscreen_quote_text);
        text.setText(quote);

        // 글이 길면 글자 크기를 줄입니다
        float size = 26f;
        int len = quote.length();
        if (len > 110) {
            size = 18f;
        } else if (len > 70) {
            size = 21f;
        } else if (len > 40) {
            size = 24f;
        }
        text.setTextSize(size);

        Button close = findViewById(R.id.fullscreen_close);
        close.setOnClickListener(v -> finish());
    }
}
