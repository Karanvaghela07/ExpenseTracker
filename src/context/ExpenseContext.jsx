import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  setDoc,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { generateId } from '../utils/helpers';

const ExpenseContext = createContext();

// ── Default values ────────────────────────────────────────────────────────────
const defaultBudgets = {
  'Food': 5000,
  'Travel': 3000,
  'Groceries': 4000,
  'Rent/Bills': 15000,
  'Shopping': 3000,
  'Entertainment': 2000,
  'Health': 2000,
  'Education': 3000,
  'Other': 1000,
};

// ── Reducer (handles local state; Firestore is source of truth) ───────────────
const expenseReducer = (state, action) => {
  switch (action.type) {
    // Expenses are managed directly via Firestore listeners — no local-only mutations needed.
    // These cases update the UI optimistically or handle derived state.

    case 'SET_EXPENSES':
      return { ...state, expenses: action.payload };

    case 'SET_PEOPLE':
      return { ...state, people: action.payload };

    case 'SET_BUDGETS':
      return { ...state, budgets: action.payload };

    case 'SET_USER_PROFILE':
      return { ...state, userProfile: action.payload };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'RESET':
      return { expenses: [], people: [], budgets: defaultBudgets, userProfile: null, loading: false };

    default:
      return state;
  }
};

const initialState = {
  expenses: [],
  people: [],
  budgets: defaultBudgets,
  userProfile: null,
  loading: true,
};

// ── Provider ──────────────────────────────────────────────────────────────────
export const ExpenseProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [state, dispatch] = useReducer(expenseReducer, initialState);

  // ── Real-time Firestore listeners tied to logged-in user ──────────────────
  useEffect(() => {
    if (!currentUser) {
      dispatch({ type: 'RESET' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    const uid = currentUser.uid;

    // 1. Listen to expenses
    const expensesRef = collection(db, 'users', uid, 'expenses');
    const expensesQuery = query(expensesRef, orderBy('date', 'desc'));
    const unsubExpenses = onSnapshot(expensesQuery, (snap) => {
      const expenses = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      dispatch({ type: 'SET_EXPENSES', payload: expenses });
    });

    // 2. Listen to people
    const peopleRef = collection(db, 'users', uid, 'people');
    const unsubPeople = onSnapshot(peopleRef, (snap) => {
      const people = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      dispatch({ type: 'SET_PEOPLE', payload: people });
    });

    // 3. Listen to user profile doc (name, currency, budgets)
    const userDocRef = doc(db, 'users', uid);
    const unsubUser = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        dispatch({ type: 'SET_USER_PROFILE', payload: data });
        if (data.budgets) {
          dispatch({ type: 'SET_BUDGETS', payload: data.budgets });
        }
      }
      dispatch({ type: 'SET_LOADING', payload: false });
    });

    return () => {
      unsubExpenses();
      unsubPeople();
      unsubUser();
    };
  }, [currentUser]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const addExpense = async (expenseData) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const expensesRef = collection(db, 'users', uid, 'expenses');
    // Store timestamp for ordering
    await addDoc(expensesRef, {
      ...expenseData,
      createdAt: serverTimestamp(),
    });
  };

  const editExpense = async (id, updates) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const expenseRef = doc(db, 'users', uid, 'expenses', id);
    await updateDoc(expenseRef, updates);
  };

  const deleteExpense = async (id) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    await deleteDoc(doc(db, 'users', uid, 'expenses', id));
  };

  const addPerson = async (name) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const peopleRef = collection(db, 'users', uid, 'people');
    const docRef = await addDoc(peopleRef, { name });
    return docRef.id;
  };

  const settleUp = async (personName) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const batch = writeBatch(db);

    // Mark all unsettled shared expenses with this person as settled
    state.expenses
      .filter((e) => e.isShared && e.sharedWith === personName && !e.settledUp)
      .forEach((e) => {
        const ref = doc(db, 'users', uid, 'expenses', e.id);
        batch.update(ref, { settledUp: true });
      });

    await batch.commit();
  };

  const saveBudgets = async (budgets) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    await setDoc(doc(db, 'users', uid), { budgets }, { merge: true });
    dispatch({ type: 'SET_BUDGETS', payload: budgets });
  };

  const updateUserProfile = async (updates) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    await setDoc(doc(db, 'users', uid), updates, { merge: true });
  };

  // Build a unified `user` object that matches how pages consume it
  const user = {
    name: currentUser?.displayName || state.userProfile?.name || 'User',
    email: currentUser?.email || state.userProfile?.email || '',
    currency: state.userProfile?.currency || 'INR',
    isLoggedIn: !!currentUser,
    uid: currentUser?.uid || null,
  };

  const value = {
    state: { ...state, user },
    // Firestore actions (replaces dispatch for data mutations)
    addExpense,
    editExpense,
    deleteExpense,
    addPerson,
    settleUp,
    saveBudgets,
    updateUserProfile,
    // Keep dispatch for any local-only state needs
    dispatch,
  };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) throw new Error('useExpense must be used within an ExpenseProvider');
  return context;
};

export default ExpenseContext;
