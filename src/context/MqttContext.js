import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import * as mqttService from '../mqtt/mqttService';
import { TOPICS } from '../mqtt/mqttConfig';

const MqttContext = createContext(null);

export const MqttProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [mode, setModeState] = useState('manual');
  const [pumpStatus, setPumpStatus] = useState(null); // null = chưa nhận từ broker
  const timerRef = useRef(null);

  useEffect(() => {
    mqttService.connect(
      () => {
        setConnected(true);

        // Lắng nghe trạng thái bơm thực tế từ ESP32 qua MQTT broker
        mqttService.subscribe(TOPICS.STATUS, (message) => {
          const isOn = message === 'ON';
          setPumpStatus(isOn);
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
   * @param {boolean} isOn    - true = bật, false = tắt
   * @param {number}  seconds - số giây hẹn giờ (chỉ dùng khi bật)
   */
  const controlPump = useCallback((isOn, seconds = 0) => {
    if (!mqttService.isConnected()) return false;

    // Xóa bộ đếm thời gian cũ nếu có lệnh mới can thiệp
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (isOn && seconds > 0) {
      mqttService.publish(TOPICS.TIME, String(seconds));

      // Hẹn giờ: gửi lệnh Tắt sau N giây, UI sẽ cập nhật khi ESP32 trả về
      timerRef.current = setTimeout(() => {
        mqttService.publish(TOPICS.PUMP, 'OFF');
        console.log('[MqttContext] Hết thời gian, App tự động tắt bơm');
      }, seconds * 1000);
    }

    mqttService.publish(TOPICS.PUMP, isOn ? 'ON' : 'OFF');

    // Không cập nhật UI ngay — chờ ESP32 publish lại qua irrigation/status/pump
    console.log(`[MqttContext] Đã gửi lệnh bơm: ${isOn ? 'BẬT' : 'TẮT'}, chờ ESP32 xác nhận`);
    return true;
  }, []);

  /**
   * Đổi chế độ hoạt động: 'manual' | 'ai'
   * — mode được lưu trong local state, cập nhật khi người dùng bấm nút trong WaterPump
   */
  const setMode = useCallback((newMode) => {
    const success = mqttService.publish(TOPICS.MODE, newMode);
    if (success) {
      setModeState(newMode);
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
