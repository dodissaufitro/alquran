package com.faithfulpath.alquran;

import android.util.Base64;

import androidx.annotation.NonNull;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialException;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "FaithfulPathGoogleAuth")
public class FaithfulPathGoogleAuthPlugin extends Plugin {

    private String webClientId;
    private CredentialManager credentialManager;

    @PluginMethod
    public void initialize(PluginCall call) {
        String clientId = call.getString("webClientId", "").trim();
        if (clientId.isEmpty()) {
            call.reject("webClientId wajib diisi.");
            return;
        }
        webClientId = clientId;
        credentialManager = CredentialManager.create(getContext());
        call.resolve();
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        if (webClientId == null || webClientId.isEmpty()) {
            call.reject("Plugin belum di-initialize.");
            return;
        }
        if (credentialManager == null) {
            credentialManager = CredentialManager.create(getContext());
        }

        GetSignInWithGoogleOption googleOption =
                new GetSignInWithGoogleOption.Builder(webClientId).build();
        GetCredentialRequest request =
                new GetCredentialRequest.Builder().addCredentialOption(googleOption).build();

        Executor executor = Executors.newSingleThreadExecutor();
        credentialManager.getCredentialAsync(
                getContext(),
                request,
                null,
                executor,
                new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                    @Override
                    public void onResult(GetCredentialResponse response) {
                        resolveSignIn(call, response);
                    }

                    @Override
                    public void onError(@NonNull GetCredentialException e) {
                        rejectOnUi(call, "Google Sign-In gagal: " + e.getMessage());
                    }
                });
    }

    private void resolveSignIn(PluginCall call, GetCredentialResponse response) {
        try {
            Credential credential = response.getCredential();
            if (!(credential instanceof CustomCredential customCredential)) {
                rejectOnUi(call, "Kredensial Google tidak dikenali.");
                return;
            }
            if (!GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(customCredential.getType())) {
                rejectOnUi(call, "Tipe kredensial Google tidak didukung.");
                return;
            }

            GoogleIdTokenCredential googleCred =
                    GoogleIdTokenCredential.createFrom(customCredential.getData());
            String idToken = googleCred.getIdToken();
            if (idToken == null || idToken.isEmpty()) {
                rejectOnUi(call, "idToken Google kosong.");
                return;
            }

            String email = emailFromIdToken(idToken);
            if (email == null || !email.contains("@")) {
                String accountId = googleCred.getId();
                if (accountId != null && accountId.contains("@")) {
                    email = accountId;
                }
            }

            JSObject ret = new JSObject();
            ret.put("idToken", idToken);
            if (email != null) {
                ret.put("email", email);
            }
            String name = googleCred.getDisplayName();
            if (name != null && !name.isEmpty()) {
                ret.put("name", name);
            }
            if (googleCred.getProfilePictureUri() != null) {
                ret.put("picture", googleCred.getProfilePictureUri().toString());
            }

            resolveOnUi(call, ret);
        } catch (Exception e) {
            rejectOnUi(call, "Gagal memproses login Google: " + e.getMessage());
        }
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

    private void resolveOnUi(PluginCall call, JSObject data) {
        if (getActivity() == null) {
            call.resolve(data);
            return;
        }
        getActivity().runOnUiThread(() -> call.resolve(data));
    }

    private void rejectOnUi(PluginCall call, String message) {
        if (getActivity() == null) {
            call.reject(message);
            return;
        }
        getActivity().runOnUiThread(() -> call.reject(message));
    }
}
