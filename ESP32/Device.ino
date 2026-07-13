#include <Arduino.h>
#include <Wire.h>
#include <SPI.h>
#include <LoRa.h>
#include <ArduinoJson.h>
#include <BH1750.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <SD.h>

// ===== LoRa SX1278 (433MHz) =====
#define LORA_NSS   5
#define LORA_RST   14
#define LORA_DIO0  2
#define LORA_FREQ  433E6

// ===== SD CARD =====
#define SD_CS_PIN  15
bool sdAvailable = false;

// ===== RELAY / BƠM =====
#define RELAY_PIN       25
#define RELAY_ON_LEVEL  HIGH
#define RELAY_OFF_LEVEL LOW

// ===== SOIL MOISTURE =====
const int AirValue   = 3000;
const int WaterValue = 1750;
const int SensorPin  = 34;

// ===== SOIL SMA FILTER =====
const int           SMA_WINDOW     = 10;
const unsigned long SOIL_SAMPLE_MS = 30000UL; 
float               soilSmaBuffer[SMA_WINDOW];
int                 soilSmaIndex   = 0;
int                 soilSmaCount   = 0;
unsigned long       lastSoilSampleMs = 0;

// ===== FLOW METER =====
const int   FLOW_PIN           = 33;
const float CALIBRATION_FACTOR = 98.0;

volatile unsigned long sessionPulseCount = 0;  // tổng xung từ lúc relay ON
unsigned long          relayStartMs      = 0;  // millis() khi relay bắt đầu ON

float flowRateLMin = 0.0;  // Q trung bình của phiên tưới vừa kết thúc
float totalVolumeL = 0.0;  // tổng lượng nước cộng dồn qua tất cả phiên

void IRAM_ATTR flowISR() {
  sessionPulseCount++;  // tích lũy toàn phiên (chỉ reset khi relay ON)
}

// ===== RELAY STATE =====
bool          relayOn         = false;
unsigned long relayDurationMs = 0;
unsigned long relayOffAtMs    = 0;
bool          relayConnected  = false;  // true nếu phát hiện relay đã kết nối

// Phát hiện relay: dùng INPUT_PULLUP — optocoupler module có pull-down ~1kΩ
// mạnh hơn pull-up nội ESP32 (45kΩ) → kéo pin xuống LOW khi có relay cắm vào
bool detectRelayConnected()
{
  pinMode(RELAY_PIN, INPUT_PULLUP);
  delay(10);
  bool found = (digitalRead(RELAY_PIN) == LOW);
  digitalWrite(RELAY_PIN, RELAY_OFF_LEVEL);  // giữ LOW trước khi chuyển OUTPUT → tránh relay click
  pinMode(RELAY_PIN, OUTPUT);
  return found;
}

// ===== SENSOR =====
Adafruit_BME280 bme;
BH1750  lightMeter;

// ===== SEND =====
unsigned long lastSendMs   = 0;
const unsigned long SEND_WINDOW_MS   = 300000;

// ===== LORA FAULT TRACKING =====
int loraFailCount = 0;

int readSoilRaw()
{
  return analogRead(SensorPin);
}

float mapSoilPercentF(float soilRaw)
{
  float pct = (AirValue - soilRaw) / (float)(AirValue - WaterValue) * 100.0f;
  return constrain(pct, 0.0f, 100.0f);
}

// Thêm 1 mẫu vào SMA buffer (gọi mỗi 30 giây)
void soilSmaPush(float pct)
{
  soilSmaBuffer[soilSmaIndex] = pct;
  soilSmaIndex = (soilSmaIndex + 1) % SMA_WINDOW;
  if (soilSmaCount < SMA_WINDOW) soilSmaCount++;
}

// Tính trung bình SMA từ các mẫu hợp lệ
float getSoilSMA()
{
  if (soilSmaCount == 0) return 0.0f;
  float sum = 0.0f;
  for (int i = 0; i < soilSmaCount; i++) sum += soilSmaBuffer[i];
  return sum / soilSmaCount;
}

//  SD CARD
void initSD()
{
  if (SD.begin(SD_CS_PIN)) {
    sdAvailable = true;
    Serial.println("✅ SD Card OK");
  } else {
    sdAvailable = false;
    Serial.println("⚠️  SD Card FAIL — sẽ không lưu offline");
  }
}

void saveToSD(float t, float h, float p, float lux, float soil,
              float flow, float vol)
{
  if (!sdAvailable) return;

  const char* filename = "/FIELD_DATA.csv";

  // Ghi header nếu file chưa tồn tại
  if (!SD.exists(filename)) {
    File fh = SD.open(filename, FILE_WRITE);
    if (fh) {
      fh.println("temperature,humidity,pressure_hpa,"
                 "light_lux,soil_percent,flow_L_min,total_volume_L");
      fh.close();
    }
  }

  File f = SD.open(filename, FILE_APPEND);
  if (!f) {
    Serial.println("❌ SD: mở file thất bại");
    return;
  }

  f.printf("%.2f,%.2f,%.2f,%.2f,%.2f,%.3f,%.3f\n",
           t, h, p, lux, soil, flow, vol);
  f.close();

  Serial.println("💾 SD lưu OK");
}

//  LoRa INIT
void initLoRa()
{
  LoRa.setPins(LORA_NSS, LORA_RST, LORA_DIO0);
  if (!LoRa.begin(LORA_FREQ)) {
    Serial.println("❌ LoRa khởi tạo thất bại! Kiểm tra kết nối dây.");
    while (true) { delay(1000); }
  }
  LoRa.setSpreadingFactor(12);                     // SF12: tầm xa tối đa
  LoRa.setSignalBandwidth(125E3);                   // BW125kHz
  LoRa.setCodingRate4(8);                           // CR4/8: chống nhiễu tốt nhất
  LoRa.setTxPower(18, PA_OUTPUT_PA_BOOST_PIN);      // 18dBm — max theo spec module phần cứng
  LoRa.setPreambleLength(12);                       // Preamble dài hơn để bắt sóng dễ hơn
  LoRa.enableCrc();
  Serial.println("✅ LoRa OK (433MHz, SF12, BW125, CR4/8, 18dBm)");
}

//  LORA REINIT (dùng khi gửi thất bại)
bool reinitLoRa()
{
  Serial.println("🔄 Reinit LoRa...");
  LoRa.end();
  delay(500);
  LoRa.setPins(LORA_NSS, LORA_RST, LORA_DIO0);
  if (!LoRa.begin(LORA_FREQ)) {
    Serial.println("❌ LoRa reinit thất bại!");
    return false;
  }
  LoRa.setSpreadingFactor(12);
  LoRa.setSignalBandwidth(125E3);
  LoRa.setCodingRate4(8);
  LoRa.setTxPower(18, PA_OUTPUT_PA_BOOST_PIN);
  LoRa.setPreambleLength(12);
  LoRa.enableCrc();
  loraFailCount = 0;
  Serial.println("✅ LoRa reinit OK");
  return true;
}

//  GỬI CÓ RETRY (tối đa maxRetry lần) → reinit nếu hết retry
bool sendWithRetry(const String& payload, int maxRetry = 3)
{
  for (int i = 0; i < maxRetry; i++) {
    LoRa.beginPacket();
    LoRa.print(payload);
    if (LoRa.endPacket(true) == 1) {
      loraFailCount = 0;
      return true;
    }
    Serial.printf("⚠️  Gửi thất bại lần %d/%d\n", i + 1, maxRetry);
    delay(500);
  }
  // Hết retry → reinit LoRa
  loraFailCount++;
  Serial.printf("❌ Retry hết (%d lần) → reinit LoRa (fail #%d)\n", maxRetry, loraFailCount);
  reinitLoRa();
  return false;
}

//  RELAY
void setRelayState(bool on)
{
  relayOn = on;
  digitalWrite(RELAY_PIN, on ? RELAY_ON_LEVEL : RELAY_OFF_LEVEL);

  if (on) {
    // ── Bắt đầu phiên tưới: reset bộ đếm xung phiên ──
    noInterrupts();
    sessionPulseCount = 0;
    interrupts();
    relayStartMs = millis();
    Serial.println("💧 Relay/Bơm: ON  → bắt đầu đếm xung phiên");
  } else {
    // ── Kết thúc phiên tưới: tính F → Q → Volume ──
    if (relayStartMs > 0) {
      unsigned long elapsedMs = millis() - relayStartMs;
      if (elapsedMs > 500) {  // bỏ qua nếu relay bật < 0.5s (tránh chia 0)
        noInterrupts();
        unsigned long totalPulses = sessionPulseCount;
        interrupts();

        float T_s  = elapsedMs / 1000.0f;           // thời gian bật (giây)
        float F    = totalPulses / T_s;             // tần số xung (Hz)
        float Q    = F / CALIBRATION_FACTOR;        // lưu lượng (L/min)
        float vol  = Q * T_s / 60.0f;              // thể tích phiên (L)

        flowRateLMin  = Q;          // Q trung bình phiên → gửi LoRa
        totalVolumeL += vol;        // cộng dồn qua các phiên

        Serial.printf("💧 Relay/Bơm: OFF → T=%.1fs | Pulses=%lu | F=%.2fHz | Q=%.3fL/min | Vol=%.3fL | Total=%.3fL\n",
                      T_s, totalPulses, F, Q, vol, totalVolumeL);
      } else {
        Serial.println("💧 Relay/Bơm: OFF → phiên quá ngắn, bỏ qua tính lưu lượng");
      }
      relayStartMs = 0;
    } else {
      Serial.println("💧 Relay/Bơm: OFF");
    }
    relayOffAtMs = 0;
  }

  if (on && relayDurationMs > 0) {
    relayOffAtMs = millis() + relayDurationMs;
    Serial.printf("   Tự tắt sau (s): %lu\n", relayDurationMs / 1000);
  }
}

//  GỬI ACK TRẠNG THÁI BƠM VỀ LORA_RECEIVE
void sendPumpAck(bool on)
{
  StaticJsonDocument<128> doc;
  doc["ack"]   = "PUMP";
  doc["state"] = on ? "ON" : "OFF";

  String payload;
  serializeJson(doc, payload);

  if (sendWithRetry(payload)) {
    Serial.print("📡 LoRa → ACK bơm: ");
    Serial.println(payload);
  } else {
    Serial.println("❌ Gửi ACK bơm thất bại sau retry + reinit");
  }
}

//  GỬI DATA CẢM BIẾN QUA LORA
void sendSensorData(float t, float h, float p, float lux, float soil)
{
  StaticJsonDocument<256> doc;
  doc["t"]    = t;
  doc["h"]    = h;
  doc["p"]    = p;
  doc["lux"]  = lux;
  doc["soil"] = soil;
  doc["flow"] = flowRateLMin;
  doc["vol"]  = totalVolumeL;

  String payload;
  serializeJson(doc, payload);

  if (sendWithRetry(payload)) {
    Serial.print("📡 LoRa → gửi sensor: ");
    Serial.println(payload);
  } else {
    Serial.println("❌ Gửi sensor thất bại sau retry + reinit");
  }
}

void checkLoRaCommand()
{
  int packetSize = LoRa.parsePacket();
  if (packetSize == 0) return;

  String received = "";
  while (LoRa.available()) {
    received += (char)LoRa.read();
  }

  int rssi = LoRa.packetRssi();
  Serial.print("📥 LoRa ← lệnh bơm (RSSI=");
  Serial.print(rssi);
  Serial.print("dBm): ");
  Serial.println(received);

  StaticJsonDocument<128> doc;
  DeserializationError err = deserializeJson(doc, received);
  if (err) {
    Serial.print("⚠️  JSON parse error: ");
    Serial.println(err.c_str());
    return;
  }

  const char* cmd = doc["cmd"] | "";
  if (strcmp(cmd, "PUMP") != 0) return;  // bỏ qua lệnh không rõ

  const char* state = doc["state"] | "OFF";
  long        dur   = doc["dur"]   | 0;

  relayDurationMs = (dur > 0) ? (unsigned long)dur * 1000UL : 0;

  bool turnOn = (strcmp(state, "ON") == 0);
  setRelayState(turnOn);

  // Gửi ACK xác nhận trạng thái thực tế về gateway
  delay(50);  // nhường bus LoRa trước khi TX
  if (relayConnected) sendPumpAck(turnOn);
}

// SET UP
void setup()
{
  Serial.begin(115200);

  // GPIO
  relayConnected = detectRelayConnected();
  if (relayConnected) {
    Serial.println("✅ Relay đã kết nối");
  } else {
    Serial.println("⚠️  Không phát hiện relay — ACK sẽ bị tắt");
  }
  pinMode(RELAY_PIN, OUTPUT);
  setRelayState(false);

  pinMode(FLOW_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(FLOW_PIN), flowISR, RISING);

  // I2C + Cảm biến
  Wire.begin(21, 22);
  lightMeter.begin();
  if (!bme.begin(0x76)) {
    Serial.println("⚠️  BME280 không tìm thấy (kiểm tra địa chỉ I2C)");
  }

  // SD Card
  initSD();

  // LoRa
  initLoRa();

  lastSendMs = millis();
}


void loop()                                                                                       
{
  // --- Lắng nghe lệnh bơm từ lora_recieve ---
  checkLoRaCommand();

  // --- Relay tự tắt theo timer ---
  if (relayOn && relayOffAtMs > 0 && (long)(millis() - relayOffAtMs) >= 0) {
    Serial.println("⏰ Hết giờ → tắt bơm tự động");
    setRelayState(false);
    if (relayConnected) sendPumpAck(false);
  }

  // --- SOIL SMA: lấy 1 mẫu mỗi 30 giây (non-blocking) ---
  if (millis() - lastSoilSampleMs >= SOIL_SAMPLE_MS) {
    lastSoilSampleMs = millis();
    float rawPct = mapSoilPercentF((float)readSoilRaw());
    soilSmaPush(rawPct);
  }

  // --- Gửi dữ liệu mỗi 5 phút ---
  if (millis() - lastSendMs >= SEND_WINDOW_MS) {
    // SMA — trung bình 10 mẫu x 30s
    float soilPercent = roundf(getSoilSMA() * 100.0f) / 100.0f;

    float t   = bme.readTemperature();
    float h   = bme.readHumidity();
    float p   = bme.readPressure() / 100.0F;
    float lux = lightMeter.readLightLevel();

    sendSensorData(t, h, p, lux, soilPercent);
    saveToSD(t, h, p, lux, soilPercent, flowRateLMin, totalVolumeL);

    Serial.printf("T=%.2fC H=%.2f%% P=%.2fhPa Lux=%.2f Soil(SMA)=%.2f%% Flow=%.3fL/m Vol=%.3fL\n",
            t, h, p, lux, soilPercent, flowRateLMin, totalVolumeL);

    lastSendMs = millis();
  }

  delay(10);
}
