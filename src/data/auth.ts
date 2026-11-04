import {getAuth, GoogleAuthProvider, signInWithCredential, signOut} from '@react-native-firebase/auth';
import {GoogleOneTapSignIn, isNoSavedCredentialFoundResponse, isSuccessResponse} from 'react-native-nitro-google-signin';

let configured = false;

export async function loginWithGoogle(): Promise<void> {
  if (!configured) {
    await GoogleOneTapSignIn.configure({webClientId: 'autoDetect', autoSelectOnSignIn: false});
    configured = true;
  }
  await GoogleOneTapSignIn.checkPlayServices();
  let result = await GoogleOneTapSignIn.signIn();
  if (isNoSavedCredentialFoundResponse(result)) {
    result = await GoogleOneTapSignIn.createAccount();
  }
  if (isNoSavedCredentialFoundResponse(result)) {
    result = await GoogleOneTapSignIn.presentExplicitSignIn();
  }
  if (!isSuccessResponse(result)) { return; }
  if (!result.data.idToken) { throw new Error('Не удалось подтвердить вход через Google. Попробуйте войти повторно.'); }
  await signInWithCredential(getAuth(), GoogleAuthProvider.credential(result.data.idToken));
}

export async function logout(): Promise<void> {
  await signOut(getAuth());
}
