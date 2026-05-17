import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null); // dữ liệu Firestore (username, phone...)

  const register = async (email, password, username, phone) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      username,
      email,
      phone,
      role: 'user',
      createdAt: serverTimestamp()
    });
    await sendEmailVerification(userCredential.user);
    await signOut(auth);
    return userCredential.user;
  };

  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    if (!userCredential.user.emailVerified) {
      await signOut(auth);
      throw new Error('Chưa xác minh email. Vui lòng kiểm tra hộp thư của bạn.');
    }
    return userCredential.user;
  };

  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
    setUserData(null);
  };

  /** Lấy dữ liệu Firestore của user */
  const fetchUserData = async (uid) => {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) setUserData(snap.data());
    } catch (e) {
      console.warn('[AuthContext] fetchUserData:', e.message);
    }
  };

  /** Cập nhật thông tin người dùng (username, phone) */
  const updateUserProfile = async ({ username, phone }) => {
    if (!user) throw new Error('Chưa đăng nhập');
    await updateDoc(doc(db, 'users', user.uid), { username, phone });
    setUserData((prev) => ({ ...prev, username, phone }));
  };

  /** Đổi mật khẩu (cần xác thực lại trước) */
  const changePassword = async (currentPassword, newPassword) => {
    if (!user) throw new Error('Chưa đăng nhập');
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.emailVerified) {
        setUser(currentUser);
        fetchUserData(currentUser.uid); // tải thông tin Firestore
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = { user, userData, loading, register, login, logout, resetPassword, updateUserProfile, changePassword };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
