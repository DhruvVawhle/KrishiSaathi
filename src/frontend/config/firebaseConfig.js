import { initializeApp } from "firebase/app";
// ❌ remove analytics for now
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAiRZMkY19z_roa_8xGuwcS0QtMvavA-90",
  authDomain: "krishisaathi-f77c7.firebaseapp.com",
  projectId: "krishisaathi-f77c7",
  storageBucket: "krishisaathi-f77c7.firebasestorage.app",
  messagingSenderId: "579116463043",
  appId: "1:579116463043:web:3e137a8c18155c61924376",
  measurementId: "G-R6L6531GTL",
};

const app = initializeApp(firebaseConfig);

// 🚨 don't include analytics on localhost — causes recaptcha failure
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export { app };
