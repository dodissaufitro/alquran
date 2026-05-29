import { registerPlugin } from '@capacitor/core'

export interface FaithfulPathGoogleSignInResult {
  idToken: string
  email?: string
  name?: string
  picture?: string
}

export interface FaithfulPathGoogleAuthPlugin {
  initialize(options: { webClientId: string }): Promise<void>
  signIn(): Promise<FaithfulPathGoogleSignInResult>
}

export const FaithfulPathGoogleAuth = registerPlugin<FaithfulPathGoogleAuthPlugin>(
  'FaithfulPathGoogleAuth',
)
