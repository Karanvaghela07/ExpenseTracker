import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB09Q8ccgA3i_eInFWjDy5Wb5sIVvrV-Pk",
  authDomain: "expensetracker-4dd5c.firebaseapp.com",
  databaseURL: "https://expensetracker-4dd5c-default-rtdb.firebaseio.com",
  projectId: "expensetracker-4dd5c",
  storageBucket: "expensetracker-4dd5c.firebasestorage.app",
  messagingSenderId: "1048178338392",
  appId: "1:1048178338392:web:40371bd4dd3c530deb382d",
  measurementId: "G-FVQW1MM7S8",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
