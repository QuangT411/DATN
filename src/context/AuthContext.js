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
      password,
      role: 'user',
      nameDevice: null,
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

  /**
   * Lưu thiết bị:
   * - Tạo/cập nhật document trong devices/{nameDevice}
   * - Ghi nameDevice vào users/{uid}
   * @param {string} nameDevice  - vd: "device1"
   * @param {string} macAddress  - MAC address ESP32
   * @param {string} location    - vd: "Vườn sau"
   */
  const saveDevice = async (nameDevice, macAddress, location) => {
    if (!user) throw new Error('Chưa đăng nhập');
    const nd = nameDevice.trim();
    const mac = macAddress.trim().toUpperCase();
    const loc = location.trim();

    // Tạo/cập nhật document trong collection devices/
    await setDoc(doc(db, 'devices', nd), {
      nameDevice: nd,
      macAddress: mac,
      location: loc,
    });

    // Ghi nameDevice vào user document
    await updateDoc(doc(db, 'users', user.uid), { nameDevice: nd });
    setUserData((prev) => ({ ...prev, nameDevice: nd }));
  };

  /** Đổi mật khẩu (cần xác thực lại trước) */
  const changePassword = async (currentPassword, newPassword) => {
    if (!user) throw new Error('Chưa đăng nhập');
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);

    // Cập nhật mật khẩu mới lên Firestore để đồng bộ với Web quản trị
    await updateDoc(doc(db, 'users', user.uid), { password: newPassword });
    setUserData((prev) => ({ ...prev, password: newPassword }));
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

  const value = { user, userData, loading, register, login, logout, resetPassword, updateUserProfile, saveDevice, changePassword };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
