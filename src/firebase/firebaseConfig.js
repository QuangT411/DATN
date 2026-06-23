import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, browserLocalPersistence } from 'firebase/auth';
import { Platform } from 'react-native';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyD5uCIlPlwSyn_gy0rDeu6o62ts7JnWY38",
  authDomain: "precise-irrigation-6c076.firebaseapp.com",
  databaseURL: "https://precise-irrigation-6c076-default-rtdb.firebaseio.com",
  projectId: "precise-irrigation-6c076",
  storageBucket: "precise-irrigation-6c076.firebasestorage.app",
  messagingSenderId: "442443464619",
  appId: "1:442443464619:web:306b7dc10eb94cd4625cee",
  measurementId: "G-01EFC193E1"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: Platform.OS === 'web'
    ? browserLocalPersistence
    : getReactNativePersistence(ReactNativeAsyncStorage),
});

export const db = getFirestore(app);
export const database = getDatabase(app);
export default app;

