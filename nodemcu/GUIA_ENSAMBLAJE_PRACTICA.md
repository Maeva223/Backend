# 🔧 GUÍA PRÁCTICA DE ENSAMBLAJE - NodeMCU + RFID

## ⚠️ PRECAUCIONES ANTES DE EMPEZAR

### **1. Seguridad Eléctrica**
- ❌ **NUNCA** conectar/desconectar componentes con el NodeMCU encendido
- ✅ **SIEMPRE** desconectar el USB antes de cambiar conexiones
- ❌ **NO** usar voltajes incorrectos (RFID = 3.3V, Servo/LED = 5V)
- ✅ Verificar polaridad (+, -, GND) **DOS VECES** antes de conectar

### **2. Verificación de Componentes**
Antes de empezar, verifica que tengas:

| Componente | Verificación |
|------------|-------------|
| **NodeMCU V3** | No tenga pines doblados o rotos |
| **RFID RC522** | Módulo completo con antena |
| **Servo SG90** | Cable de 3 pines (café/rojo/naranja) |
| **Aro LED WS2812B** | 12 LEDs, 3 cables (GND/5V/DIN) |
| **Protoboard** | 830 puntos, sin daños |
| **Cables Jumper** | 20+ cables M-M de diferentes colores |
| **Tarjetas RFID** | Al menos 2-3 tarjetas de prueba |

### **3. Organización del Espacio**
- 📌 Superficie plana, bien iluminada
- 📌 Mantener componentes organizados
- 📌 Tener multímetro a mano (opcional pero recomendado)
- 📌 Imprimir diagrama de conexiones

---

## 🎯 ORDEN DE ENSAMBLAJE RECOMENDADO

**¡NO conectes todo a la vez!** Ensambla y prueba por etapas:

### **ETAPA 1: Solo NodeMCU (5 minutos)**
1. Insertar NodeMCU en el centro de la protoboard
2. Conectar USB a la computadora
3. Verificar que encienda el LED azul del NodeMCU
4. **Prueba:** Abrir Arduino IDE > Seleccionar puerto COM > Subir ejemplo "Blink"
5. ✅ **VERIFICAR:** LED integrado parpadea = NodeMCU funciona

**❌ Si no funciona:**
- Cambiar cable USB (algunos solo cargan, no transmiten datos)
- Instalar driver CH340: https://sparks.gogo.co.nz/ch340.html
- Verificar selección de placa en Arduino IDE

---

### **ETAPA 2: NodeMCU + RFID RC522 (15 minutos)**

#### **Conexiones RFID → NodeMCU:**

```
RFID RC522        NodeMCU V3
-----------       ----------
SDA        →      D4  (GPIO2)
SCK        →      D5  (GPIO14)
MOSI       →      D7  (GPIO13)
MISO       →      D6  (GPIO12)
RST        →      D3  (GPIO0)
3.3V       →      3V3 ⚠️ IMPORTANTE: 3.3V, NO 5V
GND        →      GND
```

#### **🚨 ERRORES COMUNES - RFID:**

| Error | Síntoma | Solución |
|-------|---------|----------|
| **Conectar a 5V** | RFID se calienta/quema | ⚠️ USAR 3.3V SIEMPRE |
| **Cable suelto** | No lee tarjetas | Presionar firmemente cables en protoboard |
| **Pines invertidos** | No funciona | Verificar colores de cables con diagrama |
| **SDA/SCK confundidos** | Error de comunicación | Re-verificar conexiones SPI |

#### **Código de Prueba RFID:**

```cpp
// Cargar ejemplo en Arduino IDE:
// Archivo > Ejemplos > MFRC522 > DumpInfo

// Si funciona verás:
// Firmware Version: 0x92
// Scan PICC to see UID, SAK, type, and data blocks...

// Acerca tarjeta: Debe mostrar MAC como: "A1 B2 C3 D4"
```

#### **✅ VERIFICACIÓN ETAPA 2:**
- [ ] Monitor Serie muestra "Firmware Version: 0x92"
- [ ] Al acercar tarjeta RFID, muestra la MAC
- [ ] El RFID no se calienta excesivamente

**❌ Si no lee tarjetas:**
- Verificar que la antena del RFID esté bien conectada al módulo
- Acercar tarjeta a menos de 3cm del lector
- Verificar conexiones SPI (SDA, SCK, MOSI, MISO)

---

### **ETAPA 3: Agregar Servo Motor (10 minutos)**

#### **Conexiones Servo → NodeMCU:**

```
Servo SG90        NodeMCU
----------        -------
Naranja/Amarillo  →  D1  (GPIO5) - Señal
Rojo              →  5V  o VIN
Café/Negro        →  GND
```

#### **🚨 ADVERTENCIA - SERVO:**
- El servo puede consumir hasta **300-500mA**
- El pin 5V del NodeMCU puede NO ser suficiente si también está el LED
- **Solución:** Usar fuente externa de 5V 2A (recomendado para proyecto final)

#### **Código de Prueba Servo:**

```cpp
#include <Servo.h>

Servo servo;

void setup() {
  servo.attach(5); // D1 = GPIO5
  Serial.begin(115200);
}

void loop() {
  Serial.println("Abriendo (90°)...");
  servo.write(90);
  delay(2000);

  Serial.println("Cerrando (0°)...");
  servo.write(0);
  delay(2000);
}
```

#### **✅ VERIFICACIÓN ETAPA 3:**
- [ ] Servo se mueve de 0° a 90° cada 2 segundos
- [ ] Movimiento suave sin vibraciones excesivas
- [ ] No se reinicia el NodeMCU al mover el servo

**❌ Si el servo no se mueve:**
- Verificar que el cable naranja esté en D1 (GPIO5)
- Verificar alimentación 5V
- Cambiar servo por uno nuevo (pueden venir defectuosos)

**❌ Si el NodeMCU se reinicia al mover el servo:**
- El consumo es demasiado alto
- **SOLUCIÓN OBLIGATORIA:** Usar fuente externa de 5V

---

### **ETAPA 4: Agregar Aro LED WS2812B (15 minutos)**

#### **Conexiones LED → NodeMCU:**

```
Aro LED WS2812B   NodeMCU
---------------   -------
DIN (Data)    →   D2  (GPIO4)
VCC (+5V)     →   5V  (o fuente externa ⚠️)
GND           →   GND
```

#### **🚨 ADVERTENCIA CRÍTICA - LED:**
- **12 LEDs a máximo brillo = ~700mA**
- **NodeMCU USB solo provee ~500mA**
- **Riesgo:** NodeMCU se reinicia, se calienta, o se daña

**SOLUCIONES:**
1. **Reducir brillo en código:** `leds.setBrightness(50);` (en lugar de 255)
2. **Usar fuente externa de 5V 2A** (RECOMENDADO para demostración)

#### **Código de Prueba LED:**

```cpp
#include <Adafruit_NeoPixel.h>

#define LED_PIN 4  // D2 = GPIO4
#define LED_COUNT 12

Adafruit_NeoPixel leds(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

void setup() {
  leds.begin();
  leds.setBrightness(50); // ⚠️ REDUCIR BRILLO PARA PRUEBAS
  Serial.begin(115200);
}

void loop() {
  // Rojo
  Serial.println("LED Rojo");
  for(int i = 0; i < LED_COUNT; i++) {
    leds.setPixelColor(i, leds.Color(255, 0, 0));
  }
  leds.show();
  delay(1000);

  // Verde
  Serial.println("LED Verde");
  for(int i = 0; i < LED_COUNT; i++) {
    leds.setPixelColor(i, leds.Color(0, 255, 0));
  }
  leds.show();
  delay(1000);

  // Azul
  Serial.println("LED Azul");
  for(int i = 0; i < LED_COUNT; i++) {
    leds.setPixelColor(i, leds.Color(0, 0, 255));
  }
  leds.show();
  delay(1000);

  // Apagar
  leds.clear();
  leds.show();
  delay(1000);
}
```

#### **✅ VERIFICACIÓN ETAPA 4:**
- [ ] Los 12 LEDs encienden en rojo
- [ ] Los 12 LEDs encienden en verde
- [ ] Los 12 LEDs encienden en azul
- [ ] Se apagan correctamente

**❌ Si solo algunos LEDs encienden:**
- Verificar conexión DIN en D2 (GPIO4)
- Verificar alimentación 5V y GND
- Aumentar voltaje con fuente externa

**❌ Si los colores están incorrectos:**
- Cambiar `NEO_GRB` por `NEO_RGB` en el código

---

### **ETAPA 5: Sistema Completo Integrado (30 minutos)**

#### **Diagrama Final de Conexiones:**

```
┌─────────────────────────────────────────────┐
│           NodeMCU V3 ESP8266                │
├─────────────────────────────────────────────┤
│  3V3  →  RFID (VCC)                         │
│  GND  →  RFID, Servo, LED (GND común)       │
│  D2   →  LED Aro (DIN)                      │
│  D1   →  Servo (Señal)                      │
│  D3   →  RFID (RST)                         │
│  D4   →  RFID (SDA)                         │
│  D5   →  RFID (SCK)                         │
│  D6   →  RFID (MISO)                        │
│  D7   →  RFID (MOSI)                        │
│  5V   →  LED Aro (VCC), Servo (VCC) ⚠️      │
└─────────────────────────────────────────────┘

⚠️ FUENTE EXTERNA RECOMENDADA:
   5V 2A → Servo VCC, LED VCC
   GND → GND común con NodeMCU
```

#### **Código Completo:**
Usar: `Backend/nodemcu/control_acceso_rfid.ino`

#### **Configuración WiFi:**

```cpp
// EN EL CÓDIGO .ino, CAMBIAR:
const char* WIFI_SSID = "TU_WIFI_AQUI";           // ⚠️ CAMBIAR
const char* WIFI_PASSWORD = "TU_PASSWORD_AQUI";   // ⚠️ CAMBIAR
```

#### **✅ VERIFICACIÓN FINAL:**
```
1. Monitor Serie (115200 baud) muestra:
   [✓] "WiFi conectado!"
   [✓] "IP: 192.168.x.x"
   [✓] "Lector RFID inicializado"
   [✓] "Sistema listo. Esperando tarjetas..."

2. Acercar tarjeta RFID:
   [✓] LED aro → AZUL (validando)
   [✓] Monitor: "Validando RFID: XX:XX:XX:XX"
   [✓] Si válida: LED → VERDE, Servo abre
   [✓] Si inválida: LED → ROJO

3. Después de 10 segundos:
   [✓] Servo cierra automáticamente
   [✓] LED apaga
```

---

## 🔥 PROBLEMAS COMUNES Y SOLUCIONES

### **Problema 1: NodeMCU se reinicia constantemente**
**Causa:** Consumo de corriente excesivo

**Soluciones:**
1. Reducir brillo LED: `leds.setBrightness(50);`
2. **Usar fuente externa de 5V 2A**
3. No mover servo y LED al mismo tiempo (en código)

---

### **Problema 2: WiFi no conecta**
**Causa:** Red 5GHz o contraseña incorrecta

**Soluciones:**
1. Verificar que sea red **2.4GHz** (ESP8266 NO soporta 5GHz)
2. Verificar SSID y password (case-sensitive)
3. Acercar NodeMCU al router
4. Verificar que la red permita nuevos dispositivos

**Código debug WiFi:**
```cpp
Serial.print("Conectando a: ");
Serial.println(WIFI_SSID);
Serial.print("Password: ");
Serial.println(WIFI_PASSWORD); // Verificar en Monitor Serie
```

---

### **Problema 3: Backend no responde (Error HTTP)**
**Causa:** Backend no está corriendo o firewall bloquea

**Soluciones:**
1. Verificar backend: `http://54.85.65.240/` en navegador
2. Verificar que NodeMCU y backend estén en misma red (o backend público)
3. Ping desde NodeMCU:
   ```cpp
   WiFiClient client;
   if (client.connect("54.85.65.240", 80)) {
     Serial.println("Backend alcanzable!");
   } else {
     Serial.println("Backend NO alcanzable");
   }
   ```

---

### **Problema 4: RFID lee mal la MAC (caracteres raros)**
**Causa:** Interferencia eléctrica o tarjeta dañada

**Soluciones:**
1. Separar RFID de servo/LED (interferencia magnética)
2. Usar cable más corto para RFID (max 10cm)
3. Agregar capacitor 100uF entre 3.3V y GND del RFID
4. Probar con otra tarjeta RFID

---

## 📋 CHECKLIST PRE-DEMOSTRACIÓN

### **Hardware:**
- [ ] Todos los cables bien conectados y firmes
- [ ] Fuente de 5V externa conectada (si es necesario)
- [ ] RFID separado de servo/LED (evitar interferencia)
- [ ] Servo se mueve suavemente (0° a 90°)
- [ ] LED aro enciende en todos los colores

### **Software:**
- [ ] Backend corriendo: `npm run dev`
- [ ] NodeMCU conectado a WiFi
- [ ] Monitor Serie muestra "Sistema listo"
- [ ] MACs de tarjetas registradas en BD

### **Prueba Completa:**
- [ ] Tarjeta válida → LED verde → Servo abre → 10s → Cierra
- [ ] Tarjeta inválida → LED rojo → Servo NO se mueve
- [ ] App móvil → "Abrir barrera" → LED verde → Servo abre
- [ ] Backend registra eventos en tabla `eventos_acceso`

---

## 💡 CONSEJOS PRO

### **1. Usar Códigos de Color en Cables**
```
ROJO    = 5V / VCC
NEGRO   = GND
AMARILLO = Señales (SDA, SCK, etc.)
VERDE   = Señales de comunicación
AZUL    = Señales PWM (Servo)
```

### **2. Documentar con Fotos**
- Tomar foto del montaje final
- Útil para rearmar si algo se desconecta
- Mostrar en presentación de proyecto

### **3. Tener Componentes de Repuesto**
- 1 NodeMCU extra
- 2-3 tarjetas RFID extra
- Cables jumper adicionales

### **4. Preparar Script de Demostración**
```
1. Mostrar sistema apagado
2. Conectar alimentación
3. Esperar 5 segundos (WiFi conecta)
4. Mostrar Monitor Serie (sistema listo)
5. Tarjeta inválida → LED rojo (demostrar rechazo)
6. Tarjeta válida → LED verde → Servo abre (demostrar acceso)
7. Esperar 10s → Servo cierra automático
8. Abrir app móvil → "Llavero Digital" → Abrir barrera
9. Mostrar historial en app
```

---

## ⚡ OPTIMIZACIONES OPCIONALES

### **1. Mejorar Estabilidad**
```cpp
// Agregar delays entre operaciones críticas
servo.write(90);
delay(100); // Esperar a que servo se mueva
leds.show();
```

### **2. Reducir Consumo**
```cpp
// Apagar WiFi cuando no se use
WiFi.disconnect();
delay(100);
// Reconectar solo cuando sea necesario
WiFi.reconnect();
```

### **3. Agregar LED de Estado**
```cpp
// Usar LED integrado del NodeMCU
pinMode(LED_BUILTIN, OUTPUT);
digitalWrite(LED_BUILTIN, HIGH); // WiFi conectado
```

---

## 🎬 PREPARACIÓN FINAL

**24 horas antes de la demostración:**
1. ✅ Probar sistema completo 3 veces
2. ✅ Verificar todas las conexiones
3. ✅ Cargar baterías/fuente externa
4. ✅ Actualizar MACs en base de datos
5. ✅ Practicar script de demostración

**1 hora antes:**
1. ✅ Verificar backend corriendo
2. ✅ Verificar app instalada en smartphone
3. ✅ Tener Monitor Serie abierto
4. ✅ Tener tarjetas RFID a mano

---

## 🆘 CONTACTO DE EMERGENCIA

Si algo falla durante el ensamblaje:

1. **Revisar:** Esta guía completa
2. **Revisar:** `INSTALACION_HARDWARE.md`
3. **Buscar:** Mensaje de error en Google
4. **Foros:**
   - ESP8266 Community Forum
   - Arduino Forum
   - Stack Overflow

---

## ✅ RESUMEN RÁPIDO

**Lo MÁS importante:**
1. ⚠️ RFID usa 3.3V (NO 5V)
2. ⚠️ Probar cada componente por separado primero
3. ⚠️ Usar fuente externa para Servo + LED
4. ⚠️ WiFi debe ser 2.4GHz
5. ⚠️ Registrar MACs reales en base de datos

**Si todo falla:**
- Volver a ETAPA 1 y probar componente por componente
- Verificar voltajes con multímetro
- Reemplazar componente sospechoso

---

**¡MUCHO ÉXITO EN EL ENSAMBLAJE!** 🚀🔧
