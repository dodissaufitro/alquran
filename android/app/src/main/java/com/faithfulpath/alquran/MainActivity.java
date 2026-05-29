package com.faithfulpath.alquran;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FaithfulPathGoogleAuthPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();
        configureWebViewForGoogleSignIn();
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

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
    }
}
