/*
 * SISTEMA DE CONTROL DE ACCESO RFID - EVALUACIÓN SUMATIVA III
 * Proyecto: Control de Acceso para Condominio con IoT
 * Hardware: NodeMCU V3 (ESP8266) + RFID RC522 + Servo SG90 + Aro LED WS2812B
 * Backend: AWS EC2 - Node.js/Express API
 *
 * CONEXIONES HARDWARE:
 * =====================
 * RFID RC522:
 *   SDA  -> D4 (GPIO2)
 *   SCK  -> D5 (GPIO14)
 *   MOSI -> D7 (GPIO13)
 *   MISO -> D6 (GPIO12)
 *   RST  -> D3 (GPIO0)
 *   3.3V -> 3V3
 *   GND  -> GND
 *
 * Servo Motor:
 *   Signal -> D1 (GPIO5)
 *   VCC    -> 5V
 *   GND    -> GND
 *
 * Aro LED WS2812B (12 LEDs):
 *   DIN -> D2 (GPIO4)
 *   VCC -> 5V
 *   GND -> GND
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Servo.h>
#include <Adafruit_NeoPixel.h>

// ==================== CONFIGURACIÓN ====================

// WiFi Credentials
const char* WIFI_SSID = "TU_RED_WIFI";           // CAMBIAR
const char* WIFI_PASSWORD = "TU_PASSWORD_WIFI";   // CAMBIAR

// Backend API en AWS
const char* API_BASE_URL = "http://54.85.65.240";  // Tu servidor actual

// Pines Hardware
#define RST_PIN         0   // D3 (GPIO0)
#define SS_PIN          2   // D4 (GPIO2)
#define SERVO_PIN       5   // D1 (GPIO5)
#define LED_PIN         4   // D2 (GPIO4)
#define LED_COUNT      12   // Aro de 12 LEDs

// Configuración Barrera
#define BARRERA_CERRADA   0    // Ángulo servo cerrado (0°)
#define BARRERA_ABIERTA  90    // Ángulo servo abierto (90°)
#define TIEMPO_ABIERTA 10000   // 10 segundos abierta

// Estados del sistema
enum Estado {
  ESPERANDO,
  VALIDANDO,
  ACCESO_PERMITIDO,
  ACCESO_DENEGADO,
  APERTURA_MANUAL
};

// ==================== OBJETOS ====================
MFRC522 rfid(SS_PIN, RST_PIN);
Servo servoBarrera;
Adafruit_NeoPixel leds(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);
WiFiClient wifiClient;

// Variables globales
Estado estadoActual = ESPERANDO;
unsigned long tiempoApertura = 0;
String ultimaMAC = "";

// ==================== FUNCIONES LED ====================

void apagarLEDs() {
  leds.clear();
  leds.show();
}

void ledVerde() {
  for(int i = 0; i < LED_COUNT; i++) {
    leds.setPixelColor(i, leds.Color(0, 255, 0)); // Verde
  }
  leds.show();
}

void ledRojo() {
  for(int i = 0; i < LED_COUNT; i++) {
    leds.setPixelColor(i, leds.Color(255, 0, 0)); // Rojo
  }
  leds.show();
}

void ledAzul() {
  for(int i = 0; i < LED_COUNT; i++) {
    leds.setPixelColor(i, leds.Color(0, 0, 255)); // Azul (conectando)
  }
  leds.show();
}

void animacionConexion() {
  // Animación rotativa durante conexión WiFi
  static int pos = 0;
  leds.clear();
  leds.setPixelColor(pos, leds.Color(0, 100, 255));
  leds.show();
  pos = (pos + 1) % LED_COUNT;
  delay(100);
}

// ==================== FUNCIONES BARRERA ====================

void cerrarBarrera() {
  Serial.println("Cerrando barrera...");
  servoBarrera.write(BARRERA_CERRADA);
  delay(500);
}

void abrirBarrera() {
  Serial.println("Abriendo barrera...");
  servoBarrera.write(BARRERA_ABIERTA);
  tiempoApertura = millis();
}

// ==================== FUNCIONES WiFi ====================

void conectarWiFi() {
  Serial.println();
  Serial.print("Conectando a WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 30) {
    animacionConexion();
    Serial.print(".");
    intentos++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi conectado!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    ledVerde();
    delay(1000);
    apagarLEDs();
  } else {
    Serial.println("\nError: No se pudo conectar a WiFi");
    ledRojo();
    delay(3000);
    ESP.restart();
  }
}

// ==================== FUNCIONES API ====================

String obtenerMACRFID() {
  String mac = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) mac += "0";
    mac += String(rfid.uid.uidByte[i], HEX);
    if (i < rfid.uid.size - 1) mac += ":";
  }
  mac.toUpperCase();
  return mac;
}

bool validarRFID(String macRFID) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Error: WiFi desconectado");
    return false;
  }

  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/access/validate";

  http.begin(wifiClient, url);
  http.addHeader("Content-Type", "application/json");

  // Body JSON
  StaticJsonDocument<200> jsonDoc;
  jsonDoc["mac_sensor"] = macRFID;

  String jsonBody;
  serializeJson(jsonDoc, jsonBody);

  Serial.println("Validando RFID: " + macRFID);
  Serial.println("URL: " + url);
  Serial.println("Body: " + jsonBody);

  int httpCode = http.POST(jsonBody);

  bool acceso = false;

  if (httpCode > 0) {
    String payload = http.getString();
    Serial.println("Respuesta API (" + String(httpCode) + "): " + payload);

    StaticJsonDocument<512> responseDoc;
    DeserializationError error = deserializeJson(responseDoc, payload);

    if (!error) {
      acceso = responseDoc["acceso_permitido"] | false;
      String mensaje = responseDoc["mensaje"] | "Sin mensaje";
      Serial.println("Acceso permitido: " + String(acceso ? "SI" : "NO"));
      Serial.println("Mensaje: " + mensaje);
    } else {
      Serial.println("Error parseando JSON: " + String(error.c_str()));
    }
  } else {
    Serial.println("Error HTTP: " + String(httpCode));
    Serial.println(http.errorToString(httpCode));
  }

  http.end();
  return acceso;
}

void verificarComandosRemoto() {
  // Verificar si hay comandos pendientes de apertura/cierre manual desde la app
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/access/get-command";

  http.begin(wifiClient, url);
  int httpCode = http.GET();

  if (httpCode == 200) {
    String payload = http.getString();

    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (!error && doc.containsKey("comando")) {
      String comando = doc["comando"];

      if (comando == "ABRIR") {
        Serial.println("Comando remoto: ABRIR BARRERA");
        estadoActual = APERTURA_MANUAL;
        ledVerde();
        abrirBarrera();
      } else if (comando == "CERRAR") {
        Serial.println("Comando remoto: CERRAR BARRERA");
        cerrarBarrera();
        apagarLEDs();
        estadoActual = ESPERANDO;
      }
    }
  }

  http.end();
}

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n=================================");
  Serial.println("SISTEMA DE CONTROL DE ACCESO RFID");
  Serial.println("Evaluación Sumativa III - IoT");
  Serial.println("=================================\n");

  // Inicializar LEDs
  leds.begin();
  leds.setBrightness(100);
  apagarLEDs();

  // Inicializar Servo
  servoBarrera.attach(SERVO_PIN);
  cerrarBarrera();

  // Inicializar SPI y RFID
  SPI.begin();
  rfid.PCD_Init();
  Serial.println("Lector RFID RC522 inicializado");
  Serial.print("Versión firmware: 0x");
  Serial.println(rfid.PCD_ReadRegister(rfid.VersionReg), HEX);

  // Conectar WiFi
  conectarWiFi();

  Serial.println("\nSistema listo. Esperando tarjetas RFID...\n");
}

// ==================== LOOP PRINCIPAL ====================

void loop() {
  // Verificar comandos remotos cada 2 segundos
  static unsigned long ultimaVerificacion = 0;
  if (millis() - ultimaVerificacion > 2000) {
    verificarComandosRemoto();
    ultimaVerificacion = millis();
  }

  // Control automático de cierre de barrera (después de 10 segundos)
  if ((estadoActual == ACCESO_PERMITIDO || estadoActual == APERTURA_MANUAL) &&
      millis() - tiempoApertura >= TIEMPO_ABIERTA) {
    cerrarBarrera();
    apagarLEDs();
    estadoActual = ESPERANDO;
    Serial.println("Barrera cerrada automáticamente\n");
  }

  // Lectura de tarjetas RFID
  if (estadoActual == ESPERANDO) {
    if (!rfid.PICC_IsNewCardPresent()) return;
    if (!rfid.PICC_ReadCardSerial()) return;

    // Obtener MAC de la tarjeta
    String macRFID = obtenerMACRFID();

    // Evitar lecturas duplicadas
    if (macRFID == ultimaMAC) {
      delay(1000);
      return;
    }

    ultimaMAC = macRFID;

    Serial.println("================================");
    Serial.println("Tarjeta/Llavero detectado!");
    Serial.println("MAC: " + macRFID);
    Serial.println("================================");

    // Cambiar estado a validando
    estadoActual = VALIDANDO;
    ledAzul();

    // Validar con el backend
    bool accesoPermitido = validarRFID(macRFID);

    if (accesoPermitido) {
      // ACCESO PERMITIDO
      Serial.println("*** ACCESO PERMITIDO ***");
      estadoActual = ACCESO_PERMITIDO;
      ledVerde();
      abrirBarrera();
    } else {
      // ACCESO DENEGADO
      Serial.println("*** ACCESO DENEGADO ***");
      estadoActual = ACCESO_DENEGADO;
      ledRojo();

      // Mantener LED rojo por 3 segundos
      delay(3000);
      apagarLEDs();
      estadoActual = ESPERANDO;
    }

    // Detener lectura
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();

    // Limpiar última MAC después de 2 segundos
    delay(2000);
    ultimaMAC = "";
  }

  delay(100);
}
