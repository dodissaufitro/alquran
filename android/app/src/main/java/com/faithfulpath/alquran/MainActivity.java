package com.faithfulpath.alquran;

import android.content.Intent;
import android.util.Log;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginHandle;

import ee.forgr.capacitor.social.login.GoogleProvider;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;

public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {

    private static final String LOG_TAG = "FaithfulPathGoogle";

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        // Wajib sebelum super — teruskan hasil otorisasi Google ke plugin Capgo
        if (requestCode >= GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MIN
                && requestCode < GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MAX) {
            Log.i(LOG_TAG, "Google auth result: code=" + requestCode + " result=" + resultCode);
            PluginHandle pluginHandle = getBridge().getPlugin("SocialLogin");
            if (pluginHandle != null) {
                Plugin plugin = pluginHandle.getInstance();
                if (plugin instanceof SocialLoginPlugin) {
                    ((SocialLoginPlugin) plugin).handleGoogleLoginIntent(requestCode, data);
                } else {
                    Log.e(LOG_TAG, "SocialLogin plugin instance mismatch");
                }
            } else {
                Log.e(LOG_TAG, "SocialLogin plugin handle is null");
            }
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {}
}
