package com.talaqee.myapp;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

import java.util.Locale;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FaithfulPathGoogleAuthPlugin.class);
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }

    @Override
    public void onStart() {
        super.onStart();
        configureWebViewForGoogleSignIn();
        applySystemBarInsets();
        retrySafeAreaInsets();
    }

    /** GIS Google Sign-In di WebView membutuhkan cookie pihak ketiga + DOM storage */
    private void configureWebViewForGoogleSignIn() {
        if (getBridge() == null) {
            return;
        }
        WebView webView = getBridge().getWebView();
        if (webView == null) {
            return;
        }
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);
    }

    /** Kirim tinggi status bar & navigation bar ke CSS (--safe-area-*) */
    private void applySystemBarInsets() {
        ViewCompat.setOnApplyWindowInsetsListener(getWindow().getDecorView(), (view, windowInsets) -> {
            int bottom = windowInsets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;
            int top = windowInsets.getInsets(WindowInsetsCompat.Type.statusBars()).top;
            injectSafeAreaInsets(bottom, top);
            return windowInsets;
        });
        ViewCompat.requestApplyInsets(getWindow().getDecorView());
    }

    private void injectSafeAreaInsets(int bottomPx, int topPx) {
        if (getBridge() == null) {
            return;
        }
        WebView webView = getBridge().getWebView();
        if (webView == null) {
            return;
        }
        int bottom = Math.max(bottomPx, 0);
        int top = Math.max(topPx, 0);
        String js = String.format(
            Locale.US,
            "document.documentElement.style.setProperty('--safe-area-bottom','%dpx');" +
                "document.documentElement.style.setProperty('--safe-area-top','%dpx');" +
                "document.documentElement.classList.toggle('has-system-nav',%d>0);" +
                "window.dispatchEvent(new CustomEvent('safeareainsetchange'," +
                "{detail:{bottom:%d,top:%d}}));",
            bottom,
            top,
            bottom,
            bottom,
            top
        );
        webView.post(() -> webView.evaluateJavascript(js, null));
    }

    private void retrySafeAreaInsets() {
        android.view.View decor = getWindow().getDecorView();
        injectCurrentInsets();
        decor.post(() -> {
            ViewCompat.requestApplyInsets(decor);
            injectCurrentInsets();
        });
        decor.postDelayed(() -> {
            ViewCompat.requestApplyInsets(decor);
            injectCurrentInsets();
        }, 150);
        decor.postDelayed(() -> {
            ViewCompat.requestApplyInsets(decor);
            injectCurrentInsets();
        }, 600);
        decor.postDelayed(this::injectCurrentInsets, 1200);
    }

    /** Baca inset saat ini langsung (sebelum listener pertama jalan). */
    private void injectCurrentInsets() {
        android.view.View decor = getWindow().getDecorView();
        WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(decor);
        if (insets == null) {
            return;
        }
        int bottom = insets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;
        int top = insets.getInsets(WindowInsetsCompat.Type.statusBars()).top;
        injectSafeAreaInsets(bottom, top);
    }

    @Override
    public void onResume() {
        super.onResume();
        applySystemBarInsets();
        retrySafeAreaInsets();
    }

    @Override
    public void onConfigurationChanged(android.content.res.Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        retrySafeAreaInsets();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
    }
}
