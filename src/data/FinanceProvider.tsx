import React, {createContext, useContext, useEffect, useRef, useState} from 'react';
import {AppState} from 'react-native';
import {getAuth, onAuthStateChanged, type User} from '@react-native-firebase/auth';
import {onSnapshot} from '@react-native-firebase/firestore';
import {firebaseConfigured, userCollection, userDocument} from './firebase';
import {initializeUser} from './repository';
import {errorMessage} from './errors';
import {dateKey} from './dates';
import type {Account, Category, Completion, Obligation, Operation, Settings} from './types';

interface FinanceState {
  user: User | null;
  loading: boolean;
  error: string;
  configured: boolean;
  cached: boolean;
  accounts: Account[];
  categories: Category[];
  obligations: Obligation[];
  completions: Completion[];
  operations: Operation[];
  settings: Settings;
  today: string;
  retry: () => void;
}

const emptyData = {accounts: [], categories: [], obligations: [], completions: [], operations: [], settings: {defaultAccountId: null, nextCreditNumber: 1}};
const FinanceContext = createContext<FinanceState | null>(null);

export function FinanceProvider({children}: React.PropsWithChildren) {
  const configured = firebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(configured);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cached, setCached] = useState(false);
  const [data, setData] = useState<Pick<FinanceState, 'accounts' | 'categories' | 'obligations' | 'completions' | 'operations' | 'settings'>>(emptyData);
  const [revision, setRevision] = useState(0);
  const [today, setToday] = useState(dateKey());
  const authUid = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const refresh = () => setToday(dateKey());
    const timer = setInterval(refresh, 30_000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') { refresh(); } });
    return () => { clearInterval(timer); listener.remove(); };
  }, []);

  useEffect(() => {
    if (!configured) { return; }
    return onAuthStateChanged(getAuth(), next => {
      if (authUid.current !== (next?.uid ?? null)) {
        authUid.current = next?.uid ?? null;
        setData(emptyData);
        setLoading(Boolean(next));
        setCached(false);
        setError('');
      }
      setUser(next);
      setAuthLoading(false);
    });
  }, [configured]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let disposed = false;
    const subscriptions: (() => void)[] = [];
    const received = new Set<string>();
    setLoading(true);
    setError('');
    const ready = (name: string) => {
      received.add(name);
      if (received.size === 6) { setLoading(false); }
    };
    const failed = (reason: unknown) => {
      if (!disposed) { setError(errorMessage(reason)); setLoading(false); }
    };
    initializeUser(user.uid).then(() => {
      if (disposed) { return; }
      for (const name of ['accounts', 'categories', 'obligations', 'completions', 'operations'] as const) {
        subscriptions.push(onSnapshot(userCollection(user.uid, name), {includeMetadataChanges: true}, snapshot => {
          if (disposed) { return; }
          const values = snapshot.docs.map(item => ({...item.data(), id: item.id}));
          setData(previous => ({...previous, [name]: values}));
          if (name === 'operations') { setCached(snapshot.metadata.fromCache); }
          ready(name);
        }, failed));
      }
      subscriptions.push(onSnapshot(userDocument(user.uid, 'settings', 'main'), snapshot => {
        if (disposed) { return; }
        if (snapshot.exists()) { setData(previous => ({...previous, settings: snapshot.data() as Settings})); }
        ready('settings');
      }, failed));
    }).catch(failed);
    return () => { disposed = true; subscriptions.forEach(unsubscribe => unsubscribe()); };
  }, [user?.uid, revision]);

  return <FinanceContext.Provider value={{...data, user, configured, loading: authLoading || loading, error, cached, today, retry: () => setRevision(value => value + 1)}}>{children}</FinanceContext.Provider>;
}

export function useFinance(): FinanceState {
  const value = useContext(FinanceContext);
  if (!value) { throw new Error('FinanceProvider отсутствует.'); }
  return value;
}
