import { registerPlugin } from '@capacitor/core'

export interface FaithfulPathGoogleSignInResult {
  idToken?: string
  email?: string
  name?: string
  picture?: string
}

export interface FaithfulPathGoogleAuthPlugin {
  initialize(options: { webClientId: string }): Promise<void>
  signIn(): Promise<FaithfulPathGoogleSignInResult>
  /** Hasil login tersimpan jika WebView reload setelah picker Google */
  consumePendingSignIn(): Promise<FaithfulPathGoogleSignInResult | Record<string, never>>
}

export const FaithfulPathGoogleAuth = registerPlugin<FaithfulPathGoogleAuthPlugin>(
  'FaithfulPathGoogleAuth',
)
