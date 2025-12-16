# 🌤️ Configuración OpenWeatherMap - Backend

## ✅ Implementación Completada

El backend ahora consume la **API de OpenWeatherMap** para obtener datos reales de temperatura y humedad.

### 🏗️ Arquitectura:

```
┌─────────────┐      ┌──────────┐      ┌──────────────────┐
│ Android App │ ───> │ Backend  │ ───> │ OpenWeatherMap   │
│             │      │ Node.js  │      │ API              │
└─────────────┘      └──────────┘      └──────────────────┘
                          │
                          │ Fallback si falla
                          ▼
                    ┌────────────┐
                    │  Datos     │
                    │  Simulados │
                    └────────────┘
```

---

## 📋 Archivos Modificados:

1. ✅ `.env.example` - Variables de configuración agregadas
2. ✅ `.env` - Archivo creado con API key real
3. ✅ `src/routes/iot.js` - Consume OpenWeatherMap con caché y fallback

---

## 🚀 Cómo Iniciar el Backend

### **PASO 1: Instalar dependencias** (solo primera vez)

```bash
cd C:\Users\saemm\OneDrive\Documentos\GitHub\Backend
npm install
```

### **PASO 2: Iniciar servidor**

```bash
npm run dev
```

**Salida esperada:**
```
[nodemon] starting `node src/server.js`
Server running on http://localhost:3000
```

### **PASO 3: Probar el endpoint**

Abre en el navegador: `http://localhost:3000/iot/data`

**Respuesta esperada (con API funcionando):**
```json
{
  "temperature": 18.5,
  "humidity": 47,
  "city": "La Serena",
  "timestamp": "03/12/2025, 01:30:45",
  "source": "openweathermap"
}
```

**Respuesta con fallback (si API falla):**
```json
{
  "temperature": 23.4,
  "humidity": 56.7,
  "timestamp": "03/12/2025, 01:30:45",
  "source": "simulated"
}
```

---

## ⚙️ Variables de Entorno

El archivo `.env` contiene:

```env
# OpenWeatherMap API
OPENWEATHER_API_KEY=ba8bcdc16e2294be50b7db7fe4e48ec0
OPENWEATHER_CITY=La Serena,CL
OPENWEATHER_CACHE_MINUTES=10
```

### **Descripción:**

| Variable | Valor Actual | Descripción |
|----------|--------------|-------------|
| `OPENWEATHER_API_KEY` | `ba8bcdc16e2294be50b7db7fe4e48ec0` | API key de OpenWeatherMap |
| `OPENWEATHER_CITY` | `La Serena,CL` | Ciudad a consultar |
| `OPENWEATHER_CACHE_MINUTES` | `10` | Tiempo de caché (minutos) |

### **Cambiar ciudad:**

Edita `.env`:
```env
OPENWEATHER_CITY=Santiago,CL
# o
OPENWEATHER_CITY=Valparaiso,CL
```

### **Cambiar tiempo de caché:**

```env
OPENWEATHER_CACHE_MINUTES=5   # Caché de 5 minutos
OPENWEATHER_CACHE_MINUTES=15  # Caché de 15 minutos
```

---

## 🎯 Cómo Funciona

### **1. Caché Inteligente (10 minutos)**

- Primera petición → Consulta OpenWeatherMap API
- Siguientes peticiones (dentro de 10 min) → Usa caché
- Después de 10 min → Consulta API nuevamente

**Ventaja:** No excede límites de la API gratuita (60 llamadas/min)

### **2. Fallback Automático**

Si OpenWeatherMap falla:
- ❌ API key inválida
- ❌ Sin internet
- ❌ Servidor caído
- ❌ Límite de llamadas excedido

→ Backend devuelve **datos simulados** automáticamente

**Ventaja:** La app Android **NUNCA se cae**

### **3. Logs en Consola**

```bash
🔄 Obteniendo datos frescos...
✅ Usando datos del caché
❌ Error fetching weather data: API responded with status 401
⚠️  OpenWeatherMap API key no configurada, usando datos simulados
```

---

## 📱 Conectar desde Android App

### **Para Emulador:**
```
http://10.0.2.2:3000/iot/data
```

### **Para Celular Físico:**
1. Backend y celular en **misma red Wi-Fi**
2. Encuentra tu IP: `ipconfig` (Windows)
3. Usa: `http://TU_IP:3000/iot/data`
   - Ejemplo: `http://192.168.1.100:3000/iot/data`

### **Para Navegador Web:**
```
http://localhost:3000/iot/data
```

---

## 🔑 Obtener Nueva API Key (si es necesario)

Si ves errores `401` o "API key inválida":

### **PASO 1: Crear cuenta**
1. Ve a https://openweathermap.org/
2. Click en **Sign Up**
3. Completa el formulario
4. Confirma tu email

### **PASO 2: Obtener API Key**
1. Login en OpenWeatherMap
2. Ve a https://home.openweathermap.org/api_keys
3. Copia tu API key

### **PASO 3: Reemplazar en .env**

Edita `Backend/.env`:
```env
OPENWEATHER_API_KEY=TU_NUEVA_API_KEY_AQUI
```

### **PASO 4: Reiniciar backend**
```bash
Ctrl+C
npm run dev
```

**⚠️ IMPORTANTE:** Las API keys nuevas tardan **10-120 minutos** en activarse.

---

## 🐛 Solución de Problemas

### **Error: "API responded with status 401"**

**Causa:** API key inválida o expirada

**Solución:**
1. Obtén una nueva API key
2. Reemplaza en `.env`
3. Reinicia el backend

---

### **Error: "Cannot find module"**

**Solución:**
```bash
npm install
```

---

### **Puerto 3000 ocupado**

**Solución:** Cambia el puerto en `.env`:
```env
PORT=3001
```

Entonces la URL será: `http://localhost:3001/iot/data`

---

### **Backend no responde**

**Verificar:**
1. ¿Está corriendo? Busca: `Server running on http://localhost:3000`
2. Si no, ejecuta: `npm run dev`

---

## ✅ Ventajas de esta Arquitectura

### **🔒 Seguridad:**
- API key **oculta en el backend**
- Android App **no expone credenciales**
- Archivo `.env` en `.gitignore` (no se sube a GitHub)

### **⚡ Performance:**
- **Caché de 10 minutos** reduce llamadas
- API gratuita: 60 llamadas/min, 1000/día
- Con caché: Miles de peticiones desde la app

### **🛡️ Resiliencia:**
- Si API falla → Fallback a datos simulados
- App **nunca se cae**
- Backend siempre responde

### **🎛️ Control:**
- Un solo lugar para cambiar API key
- Un solo lugar para cambiar ciudad
- No recompilar app Android

---

## 🧪 Probar Manualmente la API

### **En el navegador:**
```
https://api.openweathermap.org/data/2.5/weather?q=La%20Serena,CL&appid=ba8bcdc16e2294be50b7db7fe4e48ec0&units=metric
```

**Respuesta 200 OK:**
```json
{
  "main": {
    "temp": 18.5,
    "humidity": 47
  },
  "name": "La Serena"
}
```

**Respuesta 401 (API key inválida):**
```json
{
  "cod": 401,
  "message": "Invalid API key"
}
```

---

## 📊 Resumen

| Componente | Estado | Descripción |
|------------|--------|-------------|
| `.env` | ✅ | API key configurada |
| `iot.js` | ✅ | Consume OpenWeatherMap |
| Caché | ✅ | 10 minutos |
| Fallback | ✅ | Datos simulados |
| Logs | ✅ | Consola del servidor |

---

## 🎯 Próximos Pasos

1. ✅ Inicia el backend: `npm run dev`
2. ✅ Prueba en navegador: `http://localhost:3000/iot/data`
3. ✅ Ejecuta Android App
4. ✅ Verifica campo `"source"`:
   - `"openweathermap"` = Datos reales ✅
   - `"simulated"` = Datos simulados ⚠️

---

**¡Backend configurado con OpenWeatherMap! 🎉**
