

Ứng dụng di động **React Native (Expo)** kết hợp với thiết bị **ESP32** và nền tảng **MQTT / Firebase** để giám sát và điều khiển hệ thống tưới cây thông minh theo thời gian thực.

---

## 📱 Tính năng chính

| Tính năng | Mô tả |
|---|---|
| 🌡️ Giám sát cảm biến | Đọc nhiệt độ, độ ẩm đất, độ ẩm không khí, ánh sáng theo thời gian thực |
| 💧 Điều khiển máy bơm | Bật / Tắt bơm thủ công qua MQTT với hẹn giờ tự động |
| 🤖 Chế độ AI | AI Server tự phân tích cảm biến và kích hoạt bơm tự động |
| 📊 Biểu đồ lịch sử | Xem dữ liệu cảm biến theo 7 / 14 / 30 ngày |
| 🔐 Xác thực người dùng | Đăng ký / Đăng nhập qua Firebase Authentication |
| 🔄 Cập nhật realtime | Trạng thái bơm cập nhật ngay trên UI qua MQTT  |

---

## 🛠️ Công nghệ sử dụng

### Mobile App
- **React Native** + **Expo** (~54)
- **React Navigation** (Bottom Tabs + Native Stack)
- **MQTT.js v5** — kết nối WebSocket Secure đến EMQX Cloud
- **Firebase** — Authentication + Realtime Database

### Backend / IoT
- **EMQX Cloud** — MQTT Broker (Asia Southeast)
- **Firebase Realtime Database** — lưu trữ dữ liệu cảm biến
- **ESP32** — đọc cảm biến, điều khiển relay/bơm

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────┐      MQTT (wss)      ┌──────────────┐      MQTT      ┌─────────┐
│  Mobile App │ ◄──────────────────► │ EMQX Cloud   │ ◄────────────► │  ESP32  │
│ (React RN)  │                      │ (Broker)     │                │ + Relay │
└──────┬──────┘                      └──────────────┘                └─────────┘
       │                                                                   │
       │ read/write                                               write sensor data
       ▼                                                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Firebase Realtime Database                           │
│   current/pump_status  |  current/water_liters  |  sensors/data/...        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### MQTT Topics

| Topic | Hướng | Payload | Mô tả |
|---|---|---|---|
| `irrigation/control/pump` | App → ESP32 | `"1"` / `"0"` | Bật / Tắt bơm |
| `irrigation/control/time` | App → ESP32 | `"10"` (giây) | Thời gian hẹn giờ |
| `irrigation/mode` | App → ESP32 | `"manual"` / `"ai"` | Chế độ hoạt động |
| `irrigation/status/pump` | ESP32 → App | `"1"` / `"0"` | Phản hồi trạng thái bơm |

---

## 🚀 Hướng dẫn cài đặt

### Yêu cầu
- Node.js ≥ 18
- Expo CLI (`npm install -g expo-cli`)
- Tài khoản [EMQX Cloud](https://cloud.emqx.com)
- Tài khoản [Firebase](https://console.firebase.google.com)

### 1. Clone repository
```bash
git clone https://github.com/QuangT411/DATN.git
cd DATN
npm install
```

### 2. Cấu hình MQTT
Mở file `src/mqtt/mqttConfig.js` và điền thông tin EMQX Cloud:
```js
export const MQTT_CONFIG = {
  host: 'YOUR_EMQX_HOST.emqxsl.com',
  port: 8084,          // WebSocket over TLS
  protocol: 'wss',
  username: 'YOUR_USERNAME',
  password: 'YOUR_PASSWORD',
};
```

### 3. Cấu hình Firebase
Mở file `src/firebase/firebaseConfig.js` và điền Firebase config của bạn.

### 4. Chạy ứng dụng
```bash
npm start
```
Sau đó quét QR code bằng **Expo Go** trên điện thoại.

---

## 📁 Cấu trúc thư mục

```
src/
├── context/          # React Context (AuthContext, MqttContext, ThemeContext)
├── firebase/         # Firebase config
├── mqtt/             # MQTT config & service
├── navigation/       # Cấu hình điều hướng
├── pages/            # Các màn hình (Home, Sensors, WaterPump, Charts, Settings)
└── styles/           # Theme, màu sắc, typography

```

---
