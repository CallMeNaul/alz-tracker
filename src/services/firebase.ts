
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAp19vXErWWy8NusrMss2CelFKWO4PDtOM",
  authDomain: "alzheimer-diagnosing.firebaseapp.com",
  projectId: "alzheimer-diagnosing",
  storageBucket: "alzheimer-diagnosing.appspot.com",
  messagingSenderId: "366076077234",
  appId: "1:366076077234:web:944e18ae1575ec2e13d5ab",
  measurementId: "G-2CQ52VQT1W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
