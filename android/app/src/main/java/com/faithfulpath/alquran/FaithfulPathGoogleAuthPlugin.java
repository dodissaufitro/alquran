package com.faithfulpath.alquran;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.util.Base64;
import android.util.Log;

import androidx.activity.result.ActivityResult;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.auth.api.signin.GoogleSignInStatusCodes;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;

import org.json.JSONObject;

import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "FaithfulPathGoogleAuth")
public class FaithfulPathGoogleAuthPlugin extends Plugin {

    private static final String LOG_TAG = "FaithfulPathGoogleAuth";
    private static final String PREFS = "faithfulpath_google_auth";
    private static final String KEY_PENDING = "pending_sign_in_json";

    private String webClientId;
    private GoogleSignInClient googleSignInClient;
    private PluginCall pendingSignInCall;

    @PluginMethod
    public void initialize(PluginCall call) {
        String clientId = call.getString("webClientId", "").trim();
        if (clientId.isEmpty()) {
            call.reject("webClientId wajib diisi.");
            return;
        }
        webClientId = clientId;
        AppCompatActivity activity = getActivity();
        if (activity != null) {
            googleSignInClient = buildClient(activity);
        }
        call.resolve();
    }

    /** Ambil hasil login yang tersimpan saat WebView sempat reload setelah picker Google */
    @PluginMethod
    public void consumePendingSignIn(PluginCall call) {
        JSObject pending = readPendingSignIn();
        if (pending == null) {
            call.resolve();
            return;
        }
        clearPendingSignIn();
        call.resolve(pending);
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        if (webClientId == null || webClientId.isEmpty()) {
            call.reject("Plugin belum di-initialize.");
            return;
        }

        AppCompatActivity activity = getActivity();
        if (activity == null) {
            call.reject("Activity tidak tersedia.");
            return;
        }

        if (googleSignInClient == null) {
            googleSignInClient = buildClient(activity);
        }

        pendingSignInCall = call;
        call.setKeepAlive(true);

        // Keluarkan akun lama agar picker selalu muncul, lalu buka intent di UI thread
        googleSignInClient.signOut().addOnCompleteListener(task -> {
            AppCompatActivity current = getActivity();
            if (current == null) {
                rejectActiveCall("Activity tidak tersedia.");
                return;
            }
            current.runOnUiThread(() -> {
                Intent signInIntent = googleSignInClient.getSignInIntent();
                startActivityForResult(call, signInIntent, "handleGoogleSignIn");
            });
        });
    }

    @ActivityCallback
    private void handleGoogleSignIn(PluginCall call, ActivityResult result) {
        PluginCall activeCall = resolveActiveCall(call);
        if (activeCall == null) {
            Log.w(LOG_TAG, "handleGoogleSignIn: tidak ada PluginCall aktif");
            return;
        }

        Intent data = result.getData();
        Log.d(
                LOG_TAG,
                "handleGoogleSignIn resultCode="
                        + result.getResultCode()
                        + " hasData="
                        + (data != null)
        );

        if (data == null) {
            if (result.getResultCode() == Activity.RESULT_CANCELED) {
                rejectActiveCall(activeCall, "Login Google dibatalkan.", "CANCELLED");
            } else {
                rejectActiveCall(activeCall, "Login Google gagal (tidak ada data).", "SIGN_IN_FAILED");
            }
            return;
        }

        Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
        try {
            GoogleSignInAccount account = task.getResult(ApiException.class);
            JSObject ret = accountToResult(account);
            if (ret == null) {
                rejectActiveCall(activeCall, "Email Google tidak ditemukan.", "NO_EMAIL");
                return;
            }

            persistPendingSignIn(ret);
            activeCall.resolve(ret);
            bridge.releaseCall(activeCall);
            pendingSignInCall = null;
        } catch (ApiException e) {
            Log.e(LOG_TAG, "ApiException status=" + e.getStatusCode(), e);
            if (e.getStatusCode() == GoogleSignInStatusCodes.SIGN_IN_CANCELLED) {
                rejectActiveCall(activeCall, "Login Google dibatalkan.", "CANCELLED");
                return;
            }
            rejectActiveCall(
                    activeCall,
                    "Google Sign-In gagal (kode " + e.getStatusCode() + "): " + e.getMessage(),
                    "SIGN_IN_FAILED"
            );
        } catch (Exception e) {
            Log.e(LOG_TAG, "handleGoogleSignIn error", e);
            rejectActiveCall(activeCall, "Gagal memproses login Google: " + e.getMessage(), "SIGN_IN_FAILED");
        }
    }

    private PluginCall resolveActiveCall(PluginCall call) {
        if (call != null) {
            return call;
        }
        return pendingSignInCall;
    }

    private void rejectActiveCall(PluginCall call, String message, String code) {
        PluginCall activeCall = call != null ? call : pendingSignInCall;
        pendingSignInCall = null;
        if (activeCall != null) {
            activeCall.reject(message, code);
            bridge.releaseCall(activeCall);
        }
    }

    private void rejectActiveCall(String message, String code) {
        rejectActiveCall(null, message, code);
    }

    private void rejectActiveCall(String message) {
        rejectActiveCall(null, message, "SIGN_IN_FAILED");
    }

    private JSObject accountToResult(GoogleSignInAccount account) {
        if (account == null) {
            return null;
        }

        String idToken = account.getIdToken();
        String email = account.getEmail();
        if (email == null || !email.contains("@")) {
            if (idToken != null && !idToken.isEmpty()) {
                email = emailFromIdToken(idToken);
            }
        }
        if (email == null || !email.contains("@")) {
            return null;
        }

        JSObject ret = new JSObject();
        if (idToken != null && !idToken.isEmpty()) {
            ret.put("idToken", idToken);
        }
        ret.put("email", email);

        String name = account.getDisplayName();
        if (name != null && !name.isEmpty()) {
            ret.put("name", name);
        }

        Uri photoUri = account.getPhotoUrl();
        if (photoUri != null) {
            ret.put("picture", photoUri.toString());
        }

        if (!ret.has("idToken")) {
            Log.w(LOG_TAG, "idToken kosong — login via profil email. Periksa OAuth Web client ID + SHA-1 Android.");
        }

        return ret;
    }

    private void persistPendingSignIn(JSObject result) {
        try {
            SharedPreferences prefs = getContext().getSharedPreferences(PREFS, Activity.MODE_PRIVATE);
            prefs.edit().putString(KEY_PENDING, result.toString()).apply();
        } catch (Exception e) {
            Log.w(LOG_TAG, "persistPendingSignIn failed", e);
        }
    }

    private JSObject readPendingSignIn() {
        try {
            SharedPreferences prefs = getContext().getSharedPreferences(PREFS, Activity.MODE_PRIVATE);
            String raw = prefs.getString(KEY_PENDING, null);
            if (raw == null || raw.isEmpty()) {
                return null;
            }
            return new JSObject(raw);
        } catch (Exception e) {
            Log.w(LOG_TAG, "readPendingSignIn failed", e);
            return null;
        }
    }

    private void clearPendingSignIn() {
        try {
            SharedPreferences prefs = getContext().getSharedPreferences(PREFS, Activity.MODE_PRIVATE);
            prefs.edit().remove(KEY_PENDING).apply();
        } catch (Exception ignored) {
            // noop
        }
    }

    private GoogleSignInClient buildClient(@NonNull AppCompatActivity activity) {
        GoogleSignInOptions options =
                new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                        .requestIdToken(webClientId)
                        .requestEmail()
                        .requestProfile()
                        .build();
        return GoogleSignIn.getClient(activity, options);
    }

    private static String emailFromIdToken(String idToken) {
        try {
            String[] parts = idToken.split("\\.");
            if (parts.length < 2) {
                return null;
            }
            byte[] decoded = Base64.decode(parts[1], Base64.URL_SAFE | Base64.NO_PADDING | Base64.NO_WRAP);
            JSONObject payload = new JSONObject(new String(decoded, StandardCharsets.UTF_8));
            String email = payload.optString("email", "");
            return email.isEmpty() ? null : email;
        } catch (Exception ignored) {
            return null;
        }
    }
}
