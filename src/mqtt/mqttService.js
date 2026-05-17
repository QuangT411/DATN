import mqtt from 'mqtt';
import { MQTT_CONFIG } from './mqttConfig';

// MQTT Service — quản lý kết nối và giao tiếp
let client = null;
const subscribers = {};   // { topic: [callback, ...] }

/**
 * Kết nối đến EMQX broker
 * @param {function} onConnect   - gọi khi kết nối thành công
 * @param {function} onDisconnect - gọi khi mất kết nối
 * @param {function} onError     - gọi khi có lỗi
 */
export const connect = (onConnect, onDisconnect, onError) => {
  if (client && client.connected) return;

  const url = `${MQTT_CONFIG.protocol}://${MQTT_CONFIG.host}:${MQTT_CONFIG.port}/mqtt`;

  client = mqtt.connect(url, {
    clientId:       MQTT_CONFIG.clientId,
    username:       MQTT_CONFIG.username,
    password:       MQTT_CONFIG.password,
    keepalive:      MQTT_CONFIG.keepalive,
    reconnectPeriod: MQTT_CONFIG.reconnectPeriod,
    connectTimeout: MQTT_CONFIG.connectTimeout,
    clean: true,
  });

  client.on('connect', () => {
    console.log('[MQTT] Kết nối thành công:', MQTT_CONFIG.host);
    onConnect?.();
  });

  client.on('disconnect', () => {
    console.log('[MQTT] Mất kết nối');
    onDisconnect?.();
  });

  client.on('error', (err) => {
    console.error('[MQTT] Lỗi:', err.message);
    onError?.(err);
  });

  client.on('reconnect', () => {
    console.log('[MQTT] Đang kết nối lại...');
  });

  // Phân phối message đến đúng subscriber
  client.on('message', (topic, payload) => {
    const message = payload.toString();
    console.log(`[MQTT] Nhận: ${topic} = ${message}`);
    if (subscribers[topic]) {
      subscribers[topic].forEach((cb) => cb(message));
    }
  });
};

/**
 * Ngắt kết nối
 */
export const disconnect = () => {
  if (client) {
    client.end(true);
    client = null;
    console.log('[MQTT] Đã ngắt kết nối');
  }
};

/**
 * Gửi lệnh lên broker
 * @param {string} topic
 * @param {string} payload
 * @param {number} qos - 0 | 1 | 2 (mặc định 1)
 */
export const publish = (topic, payload, qos = 1) => {
  if (!client || !client.connected) {
    console.warn('[MQTT] Chưa kết nối, không thể publish');
    return false;
  }
  client.publish(topic, String(payload), { qos, retain: false });
  console.log(`[MQTT] Gửi: ${topic} = ${payload}`);
  return true;
};

/**
 * Subscribe topic để nhận tin
 * @param {string} topic
 * @param {function} callback - nhận (message: string)
 */
export const subscribe = (topic, callback) => {
  if (!client || !client.connected) {
    console.warn('[MQTT] Chưa kết nối, không thể subscribe');
    return;
  }
  if (!subscribers[topic]) {
    subscribers[topic] = [];
    client.subscribe(topic, { qos: 1 });
    console.log(`[MQTT] Subscribe: ${topic}`);
  }
  subscribers[topic].push(callback);
};

/**
 * Hủy subscribe topic
 * @param {string} topic
 * @param {function} callback
 */
export const unsubscribe = (topic, callback) => {
  if (subscribers[topic]) {
    subscribers[topic] = subscribers[topic].filter((cb) => cb !== callback);
    if (subscribers[topic].length === 0) {
      delete subscribers[topic];
      client?.unsubscribe(topic);
    }
  }
};

/**
 * Trạng thái kết nối hiện tại
 */
export const isConnected = () => client?.connected ?? false;
