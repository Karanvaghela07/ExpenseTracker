import { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(undefined); // undefined = not yet resolved
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user); // null = logged out, User object = logged in
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // ── Sign Up ───────────────────────────────────────────────────────────────
  const signUp = async (name, email, password) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    await updateProfile(user, { displayName: name });

    await setDoc(doc(db, 'users', user.uid), {
      name,
      email,
      currency: 'INR',
      createdAt: serverTimestamp(),
    });

    return user;
  };

  // ── Log In ────────────────────────────────────────────────────────────────
  const logIn = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // ── Google Sign In (popup) ────────────────────────────────────────────────
  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Create Firestore profile for new Google users
    const userDocRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) {
      await setDoc(userDocRef, {
        name: user.displayName || 'User',
        email: user.email,
        currency: 'INR',
        createdAt: serverTimestamp(),
      });
    }

    return user;
  };

  // ── Log Out ───────────────────────────────────────────────────────────────
  const logOut = () => signOut(auth);

  // ── Change Password ───────────────────────────────────────────────────────
  const changePassword = async (currentPassword, newPassword) => {
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);
    await updatePassword(currentUser, newPassword);
  };

  // ── Update Profile ────────────────────────────────────────────────────────
  const updateUserName = async (name) => {
    await updateProfile(currentUser, { displayName: name });
    await setDoc(doc(db, 'users', currentUser.uid), { name }, { merge: true });
  };

  const value = {
    currentUser,
    authLoading,
    signUp,
    logIn,
    signInWithGoogle,
    logOut,
    changePassword,
    updateUserName,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export default AuthContext;
