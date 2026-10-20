import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import firebaseConfig from "../../../firebase-applet-config.json";

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/spreadsheets",
];

function getFirebaseAuth() {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return getAuth(app);
}

export async function signInWithGoogleForDrive(): Promise<{ accessToken: string }> {
  const provider = new GoogleAuthProvider();
  for (const scope of GOOGLE_SCOPES) provider.addScope(scope);
  provider.setCustomParameters({ prompt: "select_account" });

  const result = await signInWithPopup(getFirebaseAuth(), provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (!credential?.accessToken) {
    throw new Error("Google לא החזירה הרשאת גישה ל-Drive. נסה להתחבר שוב ולאשר את ההרשאות.");
  }
  return { accessToken: credential.accessToken };
}
