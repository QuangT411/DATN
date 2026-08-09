

Ứng dụng di động **React Native (Expo)** kết hợp với phần cứng **ESP32** giao tiếp qua **LoRa 433MHz**, nền tảng **MQTT / Firebase** để giám sát và điều khiển hệ thống tưới cây thông minh theo thời gian thực.

---

## 📱 Tính năng chính

| Tính năng | Mô tả |
|---|---|
| 🌡️ Giám sát cảm biến | Đọc nhiệt độ, độ ẩm đất, độ ẩm không khí, ánh sáng theo thời gian thực |
| 💧 Điều khiển máy bơm | Bật / Tắt bơm thủ công qua MQTT với hẹn giờ tự động |
| 🤖 Chế độ AI | AI Server tự phân tích cảm biến và kích hoạt bơm tự động |
| 📊 Biểu đồ lịch sử | Xem dữ liệu cảm biến theo 7 / 14 / 30 ngày |
| 🔐 Xác thực người dùng | Đăng ký / Đăng nhập qua Firebase Authentication |
| 🔄 Cập nhật realtime | Trạng thái bơm cập nhật ngay trên UI qua MQTT |
| 💦 Đo lưu lượng nước | Đếm xung flow meter, tính tổng lượng nước đã tưới |
| 📋 Ghi log SD Card | Device lưu dữ liệu cảm biến vào thẻ nhớ khi mất kết nối |

---

## 🛠️ Công nghệ sử dụng

### Mobile App
- **React Native** + **Expo** (~54)
- **React Navigation** (Bottom Tabs + Native Stack)
- **MQTT.js v5** — kết nối WebSocket Secure đến EMQX Cloud
- **Firebase** — Authentication + Realtime Database

### Backend / IoT
- **EMQX Cloud** — MQTT Broker (Asia Southeast)
- **Firebase Realtime Database** — lưu trữ dữ liệu cảm biến & trạng thái
- **ESP32 Gateway** — nhận dữ liệu LoRa, đẩy Firebase, điều khiển relay qua MQTT
- **ESP32 Device** — đọc cảm biến, gửi LoRa, điều khiển bơm, ghi SD Card

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────┐      MQTT (wss)      ┌──────────────────┐      MQTT (TLS)     ┌──────────────────┐
│  Mobile App │ ◄──────────────────► │   EMQX Cloud     │ ◄─────────────────► │  ESP32 Gateway   │
│ (React RN)  │                      │   (Broker)       │                     │  WiFi + LoRa TX  │
└──────┬──────┘                      └──────────────────┘                     └────────┬─────────┘
       │                                                                                │ LoRa 433MHz
       │ read/write                                                                     │
       ▼                                                                       ┌────────▼─────────┐
┌───────────────────────────────────────────────────────────┐                 │  ESP32 Device    │
│               Firebase Realtime Database                   │                 │  BME280 + BH1750 │
│  current/pump_status  |  current/water_liters             │ ◄── write ───── │  Soil + Flow     │
│  sensors/data/...     |  current/flow_rate                │                 │  Relay + SD Card │
└───────────────────────────────────────────────────────────┘                 └──────────────────┘
```

### MQTT Topics

| Topic | Hướng | Payload | Mô tả |
|---|---|---|---|
| `irrigation/device1/control/pump` | App → Gateway → Device | `"1"` / `"0"` | Bật / Tắt bơm |
| `irrigation/device1/control/time` | App → Gateway → Device | `"30"` (giây) | Thời gian hẹn giờ |
| `irrigation/device1/status/pump` | Device → Gateway → App | `"1"` / `"0"` | Phản hồi trạng thái bơm |

---

## 🔩 Phần cứng ESP32

### ESP32 Gateway (`ESP32/Getway.ino`)

Node trung gian kết nối **LoRa ↔ WiFi/MQTT/Firebase**.

| Chức năng | Mô tả |
|---|---|
| **LoRa SX1278 (433MHz)** | Nhận dữ liệu JSON từ Device (NSS=5, RST=14, DIO0=2) |
| **WiFi + MQTT TLS** | Kết nối EMQX Cloud, lắng nghe lệnh điều khiển bơm |
| **Firebase RTDB** | Đẩy dữ liệu cảm biến, trạng thái bơm, lưu lượng nước |
| **OLED SSD1306** | Hiển thị IP, trạng thái WiFi/MQTT, dữ liệu cảm biến |
| **Offline mode** | Hoạt động độc lập khi mất WiFi |

### ESP32 Device (`ESP32/Device.ino`)

Node đầu cuối gắn trực tiếp tại vườn.

| Chức năng | Cảm biến / Module |
|---|---|
| **Nhiệt độ & Độ ẩm không khí** | BME280 (I2C) |
| **Ánh sáng** | BH1750 (I2C) |
| **Độ ẩm đất** | Cảm biến điện trở (ADC Pin 34) — lọc SMA 10 mẫu |
| **Lưu lượng nước** | Flow Meter (Pin 33, hệ số 98.0 xung/L) |
| **Điều khiển bơm** | Relay (Pin 25) — hỗ trợ hẹn giờ tự động |
| **Giao tiếp** | LoRa SX1278 433MHz (30s/lần) |
| **Lưu trữ offline** | SD Card (SPI, CS=4) — ghi dữ liệu khi mất kết nối |

---

## 🚀 Hướng dẫn cài đặt

### Yêu cầu
- Node.js ≥ 18
- Expo CLI (`npm install -g expo-cli`)
- Tài khoản [EMQX Cloud](https://cloud.emqx.com)
- Tài khoản [Firebase](https://console.firebase.google.com)
- Arduino IDE (để nạp firmware ESP32)

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

### 4. Nạp firmware ESP32
- Mở `ESP32/Getway.ino` bằng Arduino IDE → nạp lên board **Gateway**
- Mở `ESP32/Device.ino` bằng Arduino IDE → nạp lên board **Device**
- Cài đặt thư viện cần thiết: `LoRa`, `ArduinoJson`, `FirebaseESP32`, `PubSubClient`, `Adafruit_BME280`, `BH1750`, `Adafruit_SSD1306`

### 5. Chạy ứng dụng
```bash
npm start
```
Sau đó quét QR code bằng **Expo Go** trên điện thoại.

---

## 📁 Cấu trúc thư mục

```
DATN/
├── ESP32/
│   ├── Getway.ino        # Firmware ESP32 Gateway (WiFi + LoRa + MQTT + Firebase)
│   └── Device.ino        # Firmware ESP32 Device (Sensors + LoRa + Relay + SD)
│
└── src/
    ├── context/          # React Context (AuthContext, MqttContext, ThemeContext)
    ├── firebase/         # Firebase config
    ├── mqtt/             # MQTT config & service
    ├── navigation/       # Cấu hình điều hướng (Tab + Stack)
    ├── pages/            # Các màn hình
    │   ├── Home.js       # Tổng quan hệ thống
    │   ├── Sensors.js    # Dữ liệu cảm biến realtime
    │   ├── WaterPump.js  # Điều khiển bơm
    │   ├── Charts.js     # Biểu đồ lịch sử
    │   ├── Settings.js   # Cài đặt & tài khoản
    │   ├── Login.js      # Đăng nhập
    │   └── Register.js   # Đăng ký
    ├── services/         # API & business logic
    └── styles/           # Theme, màu sắc, typography
```

---

## 📄 License

MIT License — © 2024 QuangT411
