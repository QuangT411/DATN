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

/**
 * Tạo MQTT topics động theo deviceId (MAC address của ESP32)
 * @param {string} deviceId - vd: "A4CF12ABCDEF"
 * @returns {{ MODE, PUMP, TIME, STATUS }}
 */
export const getTopics = (deviceId) => ({
  MODE: `irrigation/${deviceId}/mode`,
  PUMP: `irrigation/${deviceId}/control/pump`,
  TIME: `irrigation/${deviceId}/control/time`,
  STATUS: `irrigation/${deviceId}/status/pump`,
});
