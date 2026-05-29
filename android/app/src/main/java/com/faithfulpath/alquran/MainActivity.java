package com.faithfulpath.alquran;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FaithfulPathGoogleAuthPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
