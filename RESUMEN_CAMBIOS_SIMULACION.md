# 📋 RESUMEN: Backend Simulando NodeMCU

## ✅ CAMBIOS REALIZADOS

### **Archivo Modificado:** `src/routes/access.js`

#### **1. Estado Global de la Barrera (NUEVO)**

```javascript
let barrierState = {
  estado: 'CERRADA',           // 'ABIERTA' | 'CERRADA'
  ultimaActualizacion: new Date(),
  ultimoEvento: null,
  departamento: null,
  usuario: null,
  tiempoApertura: null
};
```

El backend ahora mantiene el estado de la barrera en memoria.

---

#### **2. Función de Actualización (NUEVA)**

```javascript
function actualizarBarrera(estado, evento, departamento, usuario)
```

**Responsabilidades:**
- Actualiza el estado de la barrera
- Registra el evento que provocó el cambio
- Si se abre: programa auto-cierre en 10 segundos
- Logs en consola para debugging

---

#### **3. Endpoint: GET /api/access/barrier-status (NUEVO)**

```http
GET http://localhost:3000/api/access/barrier-status
```

**Propósito:**
- Permite que la app móvil consulte el estado actual de la barrera
- NO requiere autenticación (para facilitar consultas rápidas)

**Respuesta:**
```json
{
  "estado": "ABIERTA" | "CERRADA",
  "ultimaActualizacion": "2025-12-17T22:30:15.123Z",
  "ultimoEvento": "ACCESO_VALIDO" | "APERTURA_MANUAL" | "AUTO_CIERRE" | etc.,
  "departamento": 1,
  "usuario": 1,
  "tiempoAbierta": 3  // segundos abierta (null si cerrada)
}
```

---

#### **4. Modificación: POST /api/access/validate**

**ANTES:**
- Solo validaba la tarjeta
- Registraba evento en BD
- Respondía al cliente

**AHORA:**
- Valida la tarjeta
- Registra evento en BD
- **✨ ACTUALIZA EL ESTADO DE LA BARRERA** (si acceso permitido)
- Responde al cliente

**Código agregado:**
```javascript
// SIMULACIÓN: Actualizar estado de la barrera (simula el NodeMCU)
if (accesoPermitido) {
  actualizarBarrera('ABIERTA', tipoEvento, sensor.id_departamento, sensor.id_usuario_registro);
}
```

---

#### **5. Modificación: POST /api/access/manual-open**

**ANTES:**
- Creaba comando en BD (para que NodeMCU lo ejecute)
- Registraba evento
- Respondía

**AHORA:**
- Crea comando en BD (mantiene compatibilidad)
- Registra evento
- **✨ ABRE LA BARRERA INMEDIATAMENTE** (sin esperar NodeMCU)
- Responde

**Código agregado:**
```javascript
// SIMULACIÓN: Actualizar estado de la barrera inmediatamente
actualizarBarrera('ABIERTA', 'APERTURA_MANUAL', user.id_departamento, userId);
```

---

#### **6. Modificación: POST /api/access/manual-close**

**AHORA:**
- **✨ CIERRA LA BARRERA INMEDIATAMENTE**

**Código agregado:**
```javascript
// SIMULACIÓN: Actualizar estado de la barrera inmediatamente
actualizarBarrera('CERRADA', 'CIERRE_MANUAL', user.id_departamento, userId);
```

---

## 🎯 CÓMO FUNCIONA AHORA

### **Comparación: ANTES vs AHORA**

| Componente | ANTES (con Arduino) | AHORA (sin Arduino) |
|------------|---------------------|---------------------|
| **Sensor RFID** | Hardware físico lee tarjeta | Postman envía POST /validate con MAC |
| **Procesamiento** | NodeMCU valida con backend | Backend valida directamente |
| **Control Barrera** | NodeMCU mueve servo motor | Backend actualiza estado virtual |
| **Estado Barrera** | En el Arduino (físico) | En el backend (variable global) |
| **App consulta** | No consultaba estado | Consulta GET /barrier-status |
| **Auto-cierre** | setTimeout en Arduino | setTimeout en backend |

---

### **Flujo Completo**

```
┌─────────────────────────────────────────────────────────────────┐
│                         POSTMAN                                 │
│  Simula: "Usuario pasa tarjeta RFID con MAC A1:B2:C3:D4"      │
│  Envía: POST /api/access/validate {"mac_sensor": "A1:B2..."}  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND                                  │
│  1. Busca sensor en BD                                         │
│  2. Valida estado (ACTIVO)                                     │
│  3. Registra evento en eventos_acceso                          │
│  4. ✨ ACTUALIZA barrierState.estado = 'ABIERTA'              │
│  5. ⏰ setTimeout(10seg) → auto-cierre                         │
│  6. Responde: {"acceso_permitido": true}                       │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APP MÓVIL                                  │
│  (Cada 2 segundos)                                             │
│  Consulta: GET /api/access/barrier-status                      │
│  Recibe: {"estado": "ABIERTA", "tiempoAbierta": 2}            │
│  UI: Muestra círculo VERDE + "ABIERTA"                         │
│                                                                 │
│  (Después de 10 seg)                                           │
│  Consulta: GET /api/access/barrier-status                      │
│  Recibe: {"estado": "CERRADA", "tiempoAbierta": null}         │
│  UI: Muestra círculo ROJO + "CERRADA"                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 MODIFICACIONES PENDIENTES EN LA APP ANDROID

Para que la app consulte el estado en tiempo real:

### **1. Agregar endpoint en `SensorApiService.kt`:**

```kotlin
@GET("api/access/barrier-status")
suspend fun getBarrierStatus(): Response<BarrierStatusResponse>
```

### **2. Crear modelo de respuesta:**

```kotlin
data class BarrierStatusResponse(
    val estado: String,              // "ABIERTA" o "CERRADA"
    val ultimaActualizacion: String,
    val ultimoEvento: String?,
    val departamento: Int?,
    val usuario: Int?,
    val tiempoAbierta: Int?
)
```

### **3. Modificar `BarrierControlViewModel.kt`:**

**Eliminar:**
```kotlin
// ANTES: Simulación local (eliminar)
delay(10000)
_barrierState.value = BarrierState.CLOSED
```

**Agregar:**
```kotlin
// AHORA: Consultar estado real del backend
private fun startPollingBarrierStatus() {
    viewModelScope.launch {
        while (true) {
            try {
                val response = repository.getBarrierStatus()
                if (response.isSuccessful) {
                    response.body()?.let { status ->
                        _barrierState.value = when(status.estado) {
                            "ABIERTA" -> BarrierState.OPEN
                            "CERRADA" -> BarrierState.CLOSED
                            else -> BarrierState.UNKNOWN
                        }

                        // Actualizar tiempo abierta
                        _message.value = if (status.tiempoAbierta != null) {
                            "Abierta hace ${status.tiempoAbierta}s (cierra en ${10 - status.tiempoAbierta}s)"
                        } else {
                            "Barrera cerrada"
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e("BarrierViewModel", "Error consultando estado: ${e.message}")
            }
            delay(2000) // Consulta cada 2 segundos
        }
    }
}

init {
    startPollingBarrierStatus()
}
```

---

## 🧪 PRUEBAS

### **Prueba 1: Pasar Tarjeta Válida**

**Postman:**
```http
POST http://localhost:3000/api/access/validate
Body: {"mac_sensor": "A1:B2:C3:D4"}
```

**Resultado esperado:**
```json
{
  "acceso_permitido": true,
  "mensaje": "Acceso permitido - Depto 101 Torre A"
}
```

**Verificar estado:**
```http
GET http://localhost:3000/api/access/barrier-status
```

**Resultado:**
```json
{
  "estado": "ABIERTA",
  "ultimoEvento": "ACCESO_VALIDO",
  "tiempoAbierta": 2
}
```

**Esperar 10 segundos y volver a consultar:**
```json
{
  "estado": "CERRADA",
  "ultimoEvento": "AUTO_CIERRE",
  "tiempoAbierta": null
}
```

---

### **Prueba 2: Apertura Manual desde App**

**Postman (Login):**
```http
POST http://localhost:3000/auth/login
Body: {"email": "demo@example.com", "password": "123456"}
```

**Postman (Abrir):**
```http
POST http://localhost:3000/api/access/manual-open
Authorization: Bearer <TOKEN>
```

**Verificar:**
```http
GET http://localhost:3000/api/access/barrier-status
```

**Resultado:**
```json
{
  "estado": "ABIERTA",
  "ultimoEvento": "APERTURA_MANUAL",
  "tiempoAbierta": 1
}
```

---

## 📊 LOGS EN CONSOLA DEL BACKEND

Cuando ejecutes las peticiones, verás logs como:

```
[BARRERA] Estado: ABIERTA - Evento: ACCESO_VALIDO
[RFID] ACCESO_VALIDO: A1:B2:C3:D4 - Acceso permitido - Depto 101 Torre A
[BARRERA] Cerrada automáticamente (10 segundos)
[BARRERA] Estado: CERRADA - Evento: AUTO_CIERRE
```

---

## ✅ VENTAJAS

1. ✅ **No necesitas Arduino físico** para demostrar el proyecto
2. ✅ **Postman simula el sensor RFID** (fácil de usar)
3. ✅ **Backend controla todo** (lógica centralizada)
4. ✅ **App puede consultar estado** en tiempo real
5. ✅ **Auto-cierre funciona** exactamente igual
6. ✅ **Todos los eventos se registran** en BD
7. ✅ **Fácil de demostrar** al profesor

---

## 🚀 ARCHIVOS GENERADOS

1. **`GUIA_SIMULACION_NODEMCU.md`** - Guía completa con flujos y ejemplos
2. **`Postman_Collection_Simulacion_NodeMCU.json`** - Colección actualizada
3. **`RESUMEN_CAMBIOS_SIMULACION.md`** - Este archivo

---

## 🎬 DEMOSTRACIÓN AL PROFESOR

### **Demo Recomendada:**

1. **Mostrar estado inicial:**
   - App móvil: Barrera CERRADA
   - Postman: GET /barrier-status → CERRADA

2. **Pasar tarjeta válida (Postman):**
   - POST /validate con MAC válida
   - App móvil: Barrera cambia a ABIERTA inmediatamente
   - Muestra contador: 10, 9, 8...

3. **Auto-cierre:**
   - Esperar 10 segundos
   - App móvil: Barrera cambia a CERRADA automáticamente

4. **Apertura manual (App):**
   - Usuario presiona "ABRIR BARRERA" en la app
   - Postman consulta: GET /barrier-status → ABIERTA

5. **Cierre manual (App):**
   - Usuario presiona "CERRAR BARRERA"
   - Postman consulta: GET /barrier-status → CERRADA

6. **Tarjeta bloqueada:**
   - Bloquear sensor desde app
   - Intentar acceso en Postman
   - App muestra: Barrera CERRADA (acceso denegado)

7. **Historial:**
   - Mostrar todos los eventos registrados
   - GET /api/access/history/1

---

**¡El backend ahora simula completamente al NodeMCU!** 🎉
