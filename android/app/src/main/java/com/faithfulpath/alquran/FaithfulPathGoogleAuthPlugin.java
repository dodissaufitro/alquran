package com.faithfulpath.alquran;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;

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

    private String webClientId;
    private GoogleSignInClient googleSignInClient;

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

    private PluginCall pendingSignInCall;

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
        Intent signInIntent = googleSignInClient.getSignInIntent();
        startActivityForResult(call, signInIntent, "handleGoogleSignIn");
    }

    @ActivityCallback
    private void handleGoogleSignIn(PluginCall call, ActivityResult result) {
        PluginCall activeCall = call != null ? call : pendingSignInCall;
        pendingSignInCall = null;
        if (activeCall == null) {
            return;
        }

        if (result.getResultCode() == Activity.RESULT_CANCELED) {
            activeCall.reject("Login Google dibatalkan.", "CANCELLED");
            return;
        }

        Intent data = result.getData();
        Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
        try {
            GoogleSignInAccount account = task.getResult(ApiException.class);
            String idToken = account.getIdToken();
            if (idToken == null || idToken.isEmpty()) {
                activeCall.reject("idToken Google kosong. Pastikan OAuth Web client ID benar.", "NO_ID_TOKEN");
                return;
            }

            String email = account.getEmail();
            if (email == null || !email.contains("@")) {
                email = emailFromIdToken(idToken);
            }
            if (email == null || !email.contains("@")) {
                activeCall.reject("Email Google tidak ditemukan.", "NO_EMAIL");
                return;
            }

            JSObject ret = new JSObject();
            ret.put("idToken", idToken);
            ret.put("email", email);

            String name = account.getDisplayName();
            if (name != null && !name.isEmpty()) {
                ret.put("name", name);
            }

            Uri photoUri = account.getPhotoUrl();
            if (photoUri != null) {
                ret.put("picture", photoUri.toString());
            }

            activeCall.resolve(ret);
        } catch (ApiException e) {
            if (e.getStatusCode() == GoogleSignInStatusCodes.SIGN_IN_CANCELLED) {
                activeCall.reject("Login Google dibatalkan.", "CANCELLED");
                return;
            }
            activeCall.reject(
                    "Google Sign-In gagal (kode " + e.getStatusCode() + "): " + e.getMessage(),
                    "SIGN_IN_FAILED"
            );
        } catch (Exception e) {
            activeCall.reject("Gagal memproses login Google: " + e.getMessage(), "SIGN_IN_FAILED");
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
