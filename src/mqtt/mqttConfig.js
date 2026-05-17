// MQTT Configuration — chỉnh sửa thông tin tại đây
export const MQTT_CONFIG = {
  host: 'ba662f8f.ala.asia-southeast1.emqxsl.com',
  port: 8084,                        // WebSocket port
  protocol: 'wss',                   // 'ws' hoặc 'wss' (có SSL)
  username: 'quang',         // ← Bạn cần tự điền User được tạo trong phần Authentication
  password: '12052004',         // ← Bạn cần tự điền Pass được tạo trong phần Authentication
  clientId: `smartiot_app_${Math.random().toString(16).slice(2, 8)}`,
  keepalive: 60,
  reconnectPeriod: 3000,             // reconnect sau 3 giây nếu mất kết nối
  connectTimeout: 10000,
};

// MQTT Topics — phải khớp với code ESP32
export const TOPICS = {
  // Chuyển chế độ hoạt động
  MODE: 'irrigation/mode',           // payload: "manual" | "ai"

  // Điều khiển bơm (thủ công)
  PUMP: 'irrigation/control/pump',   // payload: "1" (bật) | "0" (tắt)
  TIME: 'irrigation/control/time',   // payload: số giây (vd: "10")

  // Đọc trạng thái từ ESP32 (subscribe)
  STATUS: 'irrigation/status/pump',  // payload: "1" | "0"
};
