# 🔧 INSTALACIÓN Y CONFIGURACIÓN HARDWARE - NodeMCU

## 📦 LISTA DE MATERIALES

| Componente | Cantidad | Precio aprox. |
|------------|----------|---------------|
| NodeMCU V3 (ESP8266) | 1 | $5 USD |
| Módulo RFID RC522 | 1 | $3 USD |
| Tarjetas RFID 13.56MHz | 3-5 | $2 USD |
| Llaveros RFID 13.56MHz | 3-5 | Incluido |
| Servo Motor SG90 | 1 | $3 USD |
| Aro LED WS2812B (12 LEDs) | 1 | $4 USD |
| Protoboard 830 puntos | 1 | $3 USD |
| Cables Jumper M-M | 20+ | $2 USD |
| Cables Jumper M-F | 10+ | Incluido |
| Fuente 5V 2A | 1 | $5 USD |
| **TOTAL** | | **~$27 USD** |

---

## 🔌 DIAGRAMA DE CONEXIONES

```
NodeMCU V3 (ESP8266)
====================

RFID RC522        NodeMCU
---------         -------
SDA          -->  D4  (GPIO2)
SCK          -->  D5  (GPIO14)
MOSI         -->  D7  (GPIO13)
MISO         -->  D6  (GPIO12)
RST          -->  D3  (GPIO0)
3.3V         -->  3V3
GND          -->  GND


Servo SG90        NodeMCU
----------        -------
Signal (Amarillo) -->  D1  (GPIO5)
VCC (Rojo)        -->  5V  (o fuente externa)
GND (Negro/Café)  -->  GND


Aro LED WS2812B   NodeMCU
---------------   -------
DIN              -->  D2  (GPIO4)
VCC (+5V)        -->  5V  (fuente externa recomendada)
GND              -->  GND


IMPORTANTE:
- El Servo y el Aro LED consumen bastante corriente
- Se recomienda usar una fuente externa de 5V 2A
- Conectar el GND de la fuente externa al GND del NodeMCU
- El RFID RC522 usa 3.3V (NO conectar a 5V)
```

---

## 💻 INSTALACIÓN DE SOFTWARE

### 1. Instalar Arduino IDE

1. Descargar desde: https://www.arduino.cc/en/software
2. Instalar versión 2.x o superior

### 2. Configurar NodeMCU en Arduino IDE

1. Abrir Arduino IDE
2. Ir a `Archivo > Preferencias`
3. En "Gestor de URLs Adicionales de Tarjetas", agregar:
   ```
   http://arduino.esp8266.com/stable/package_esp8266com_index.json
   ```
4. Ir a `Herramientas > Placa > Gestor de tarjetas`
5. Buscar "esp8266" e instalar **"esp8266 by ESP8266 Community"**
6. Seleccionar placa: `Herramientas > Placa > ESP8266 Boards > NodeMCU 1.0 (ESP-12E Module)`

### 3. Instalar Librerías Necesarias

Ir a `Herramientas > Administrar Bibliotecas` e instalar:

| Librería | Autor | Versión |
|----------|-------|---------|
| **MFRC522** | GithubCommunity | 1.4.11+ |
| **Adafruit NeoPixel** | Adafruit | 1.12.0+ |
| **ArduinoJson** | Benoit Blanchon | 6.21.0+ |
| **Servo** (incluida) | Arduino | Preinstalada |

### 4. Configurar parámetros de compilación

```
Placa: "NodeMCU 1.0 (ESP-12E Module)"
Upload Speed: "115200"
CPU Frequency: "80 MHz"
Flash Size: "4MB (FS:2MB OTA:~1019KB)"
Port: Seleccionar el puerto COM donde está conectado
```

---

## ⚙️ CONFIGURACIÓN DEL CÓDIGO

Abrir `control_acceso_rfid.ino` y modificar:

```cpp
// 1. Credenciales WiFi
const char* WIFI_SSID = "TU_RED_WIFI";           // CAMBIAR
const char* WIFI_PASSWORD = "TU_PASSWORD_WIFI";   // CAMBIAR

// 2. URL del Backend (ya configurada)
const char* API_BASE_URL = "http://54.85.65.240";

// 3. Ajustar ángulos del servo si es necesario
#define BARRERA_CERRADA   0    // Probar entre 0-30°
#define BARRERA_ABIERTA  90    // Probar entre 90-180°
```

---

## 📤 SUBIR CÓDIGO AL NodeMCU

1. Conectar NodeMCU al PC con cable USB
2. Verificar que se detecta el puerto COM (Device Manager en Windows)
3. En Arduino IDE:
   - `Herramientas > Puerto` → Seleccionar puerto COM
   - Click en "Verificar" (✓) para compilar
   - Click en "Subir" (→) para cargar al NodeMCU
4. Abrir Monitor Serie: `Herramientas > Monitor Serie` (115200 baud)

---

## 🧪 PRUEBAS DE FUNCIONAMIENTO

### Test 1: Conexión WiFi
```
Debe mostrar en Monitor Serie:
✓ "WiFi conectado!"
✓ "IP: 192.168.x.x"
✓ LED aro en verde 1 segundo, luego apaga
```

### Test 2: Lectura RFID
```
Acercar tarjeta al lector:
✓ "Tarjeta detectada!"
✓ "MAC: XX:XX:XX:XX:XX"
✓ LED aro en azul (validando)
```

### Test 3: Validación con Backend
```
Si tarjeta registrada en BD:
✓ LED verde
✓ Servo abre barrera (90°)
✓ Espera 10 segundos
✓ Servo cierra barrera (0°)
✓ LED apagado

Si tarjeta NO registrada:
✓ LED rojo por 3 segundos
✓ Servo NO se mueve
✓ LED apagado
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "No se encuentra el puerto COM"
- Instalar driver CH340: https://sparks.gogo.co.nz/ch340.html
- Verificar cable USB (algunos solo cargan, no transmiten datos)

### Error: "RFID no responde"
- Verificar conexiones (especialmente SDA, SCK, MOSI, MISO)
- Verificar que RFID use 3.3V (NO 5V)
- Ejecutar ejemplo: `Archivo > Ejemplos > MFRC522 > DumpInfo`

### Servo no se mueve
- Verificar conexión en D1
- Probar con fuente externa de 5V
- Ajustar ángulos en código

### LED no enciende
- Verificar conexión DIN en D2
- Verificar voltaje 5V
- Reducir brillo: `leds.setBrightness(50);`

### WiFi no conecta
- Verificar SSID y contraseña
- Verificar que sea red 2.4GHz (ESP8266 NO soporta 5GHz)
- Acercar NodeMCU al router

---

## 📸 OBTENER MAC DE TARJETAS RFID

Para registrar tarjetas en la base de datos:

1. Subir el código al NodeMCU
2. Abrir Monitor Serie (115200 baud)
3. Acercar cada tarjeta/llavero al lector
4. Copiar la MAC que aparece, ejemplo:
   ```
   MAC: A1:B2:C3:D4
   ```
5. Usar esa MAC para registrar en la app Android (pantalla Gestión de Sensores)

---

## 🔗 RECURSOS ADICIONALES

- Documentación MFRC522: https://github.com/miguelbalboa/rfid
- Guía NeoPixel: https://learn.adafruit.com/adafruit-neopixel-uberguide
- NodeMCU Pinout: https://i.pinimg.com/originals/88/a5/c8/88a5c8b0cd5e9c374cb4b824ca64f26e.png

---

## ✅ CHECKLIST FINAL

- [ ] Todas las librerías instaladas
- [ ] Conexiones verificadas con multímetro
- [ ] WiFi configurado en código
- [ ] Backend accesible desde red local
- [ ] Código compilado sin errores
- [ ] Monitor Serie muestra conexión WiFi exitosa
- [ ] RFID lee tarjetas correctamente
- [ ] Servo se mueve al validar acceso
- [ ] LED cambia de color según estado
- [ ] Backend registra eventos en BD

**¡Listo para demostración!**
