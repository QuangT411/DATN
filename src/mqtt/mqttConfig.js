// MQTT Configuration — chỉnh sửa thông tin tại đây
export const MQTT_CONFIG = {
  host: 'ba662f8f.ala.asia-southeast1.emqxsl.com',
  port: 8084,
  protocol: 'wss',
  username: 'quang',
  password: '12052004',
  clientId: `smartiot_app_${Math.random().toString(16).slice(2, 8)}`,
  keepalive: 60,
  reconnectPeriod: 3000,
  connectTimeout: 10000,
};

// MQTT Topics phải khớp với code ESP32
export const TOPICS = {
  // Chuyển chế độ hoạt động
  MODE: 'irrigation/mode',           // payload: "manual" | "ai"

  // Điều khiển bơm (thủ công)
  PUMP: 'irrigation/control/pump',   // payload: "ON" (bật) | "OFF" (tắt)
  TIME: 'irrigation/control/time',   // payload: số giây (vd: "10")

  // Đọc trạng thái từ ESP32 (subscribe)
  STATUS: 'irrigation/status/pump',  // payload: "ON" | "OFF"
};
