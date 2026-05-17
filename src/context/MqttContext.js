import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as mqttService from '../mqtt/mqttService';
import { TOPICS } from '../mqtt/mqttConfig';
import { ref, update } from 'firebase/database';
import { database } from '../firebase/firebaseConfig';

const MqttContext = createContext(null);

export const MqttProvider = ({ children }) => {
  const [connected, setConnected]   = useState(false);
  const [mode, setModeState]        = useState('manual');
  const [pumpStatus, setPumpStatus] = useState(false); // trạng thái bơm realtime

  useEffect(() => {
    mqttService.connect(
      () => {
        setConnected(true);

        // Lắng nghe phản hồi thực tế từ ESP32 (khi có phần cứng)
        mqttService.subscribe(TOPICS.STATUS, (message) => {
          const isOn = message === '1';
          setPumpStatus(isOn);
          update(ref(database, 'current'), { pump_status: isOn }).catch(() => {});
          console.log(`[MqttContext] Trạng thái bơm từ ESP32: ${isOn ? 'BẬT' : 'TẮT'}`);
        });
      },
      () => setConnected(false),
      (err) => {
        setConnected(false);
        console.error('[MqttContext] Lỗi kết nối:', err.message);
      }
    );

    return () => { mqttService.disconnect(); };
  }, []);

  /** Gửi lệnh MQTT thông thường */
  const publish = useCallback((topic, payload) => {
    return mqttService.publish(topic, payload);
  }, []);

  /**
   * Điều khiển bơm — cập nhật UI ngay mà không chờ ESP32 phản hồi
   * @param {boolean} isOn - true = bật, false = tắt
   * @param {number}  seconds - số giây hẹn giờ (chỉ dùng khi bật)
   */
  const controlPump = useCallback((isOn, seconds = 0) => {
    if (!mqttService.isConnected()) return false;

    if (isOn && seconds > 0) {
      mqttService.publish(TOPICS.TIME, String(seconds));
    }
    mqttService.publish(TOPICS.PUMP, isOn ? '1' : '0');

    // Cập nhật trạng thái ngay lập tức (optimistic update)
    setPumpStatus(isOn);
    update(ref(database, 'current'), { pump_status: isOn }).catch(() => {});
    console.log(`[MqttContext] Điều khiển bơm: ${isOn ? 'BẬT' : 'TẮT'}`);
    return true;
  }, []);

  /** Đổi chế độ: 'manual' | 'ai' */
  const setMode = useCallback((newMode) => {
    const success = mqttService.publish(TOPICS.MODE, newMode);
    if (success) {
      setModeState(newMode);
      update(ref(database, 'current'), { auto_mode: newMode === 'ai' }).catch(() => {});
    }
    return success;
  }, []);

  return (
    <MqttContext.Provider value={{ connected, publish, controlPump, mode, setMode, pumpStatus }}>
      {children}
    </MqttContext.Provider>
  );
};

/**
 * const { connected, controlPump, pumpStatus, mode, setMode } = useMqtt();
 */
export const useMqtt = () => {
  const ctx = useContext(MqttContext);
  if (!ctx) throw new Error('useMqtt phải dùng trong MqttProvider');
  return ctx;
};
