import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as mqttService from '../services/mqttService';
import { getTopics } from '../mqtt/mqttConfig';
import { useAuth } from './AuthContext';

const MqttContext = createContext(null);

const MODE_KEY = '@pump_mode';

export const MqttProvider = ({ children }) => {
  const { userData } = useAuth();
  const deviceId = userData?.nameDevice ?? null;

  const [connected, setConnected] = useState(false);
  const [mode, setModeState] = useState('manual');
  const [pumpStatus, setPumpStatus] = useState(null);
  const timerRef = useRef(null);

  // Khôi phục mode đã lưu khi khởi động app
  useEffect(() => {
    AsyncStorage.getItem(MODE_KEY).then((saved) => {
      if (saved === 'ai' || saved === 'manual') {
        setModeState(saved);
      }
    }).catch(() => { });
  }, []);

  // Kết nối MQTT broker một lần
  useEffect(() => {
    mqttService.connect(
      () => setConnected(true),
      () => setConnected(false),
      (err) => {
        setConnected(false);
        console.error('[MqttContext] Lỗi kết nối:', err.message);
      }
    );

    return () => { mqttService.disconnect(); };
  }, []);

  // Subscribe/unsubscribe topic STATUS khi deviceId thay đổi
  useEffect(() => {
    if (!connected || !deviceId) return;

    const topics = getTopics(deviceId);

    const handleStatus = (message) => {
      const isOn = message === 'ON';
      setPumpStatus(isOn);
      console.log(`[MqttContext] [${deviceId}] Trạng thái bơm: ${isOn ? 'BẬT' : 'TẮT'}`);
    };

    mqttService.subscribe(topics.STATUS, handleStatus);
    console.log(`[MqttContext] Subscribe device: ${deviceId}`);

    return () => {
      mqttService.unsubscribe(topics.STATUS, handleStatus);
      setPumpStatus(null); // reset khi đổi thiết bị
      console.log(`[MqttContext] Unsubscribe device: ${deviceId}`);
    };
  }, [connected, deviceId]);

  /** Gửi lệnh MQTT thông thường */
  const publish = useCallback((topic, payload) => {
    return mqttService.publish(topic, payload);
  }, []);

  /**
   * Điều khiển bơm — gửi lệnh tới đúng deviceId đang chọn
   * @param {boolean} isOn    - true = bật, false = tắt
   * @param {number}  seconds - số giây hẹn giờ (chỉ dùng khi bật)
   */
  const controlPump = useCallback((isOn, seconds = 0) => {
    if (!mqttService.isConnected() || !deviceId) return false;

    const topics = getTopics(deviceId);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (isOn && seconds > 0) {
      mqttService.publish(topics.TIME, String(seconds));

      timerRef.current = setTimeout(() => {
        mqttService.publish(topics.PUMP, 'OFF');
        console.log('[MqttContext] Hết thời gian, App tự động tắt bơm');
      }, seconds * 1000);
    }

    mqttService.publish(topics.PUMP, isOn ? 'ON' : 'OFF');
    console.log(`[MqttContext] [${deviceId}] Gửi lệnh bơm: ${isOn ? 'BẬT' : 'TẮT'}`);
    return true;
  }, [deviceId]);

  /**
   * Đổi chế độ hoạt động: 'manual' | 'ai'
   */
  const setMode = useCallback((newMode) => {
    if (!deviceId) return false;
    const topics = getTopics(deviceId);
    const success = mqttService.publish(topics.MODE, newMode);
    if (success) {
      setModeState(newMode);
      AsyncStorage.setItem(MODE_KEY, newMode).catch(() => { });
    }
    return success;
  }, [deviceId]);

  return (
    <MqttContext.Provider value={{ connected, publish, controlPump, mode, setMode, pumpStatus, deviceId }}>
      {children}
    </MqttContext.Provider>
  );
};

/**
 * const { connected, controlPump, pumpStatus, mode, setMode, deviceId } = useMqtt();
 */
export const useMqtt = () => {
  const ctx = useContext(MqttContext);
  if (!ctx) throw new Error('useMqtt phải dùng trong MqttProvider');
  return ctx;
};

