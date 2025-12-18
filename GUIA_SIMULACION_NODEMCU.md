# 🤖 GUÍA: BACKEND SIMULANDO EL NODEMCU

## 🎯 Concepto

El **backend ahora simula al NodeMCU**. Ya no necesitas el Arduino físico para probar el sistema.

### **Flujo Completo:**

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   POSTMAN    │────────>│   BACKEND    │<────────│  APP MÓVIL   │
│              │         │  (Simula     │         │              │
│ Simula pasar │         │  NodeMCU)    │         │ Consulta el  │
│ tarjeta RFID │         │              │         │ estado       │
└──────────────┘         └──────────────┘         └──────────────┘
```

1. **Postman** = Simula pasar una tarjeta RFID (lo que haría el sensor)
2. **Backend** = Procesa y controla la barrera virtual (lo que haría el NodeMCU)
3. **App Móvil** = Consulta estado en tiempo real y puede abrir/cerrar manualmente

---

## 🆕 NUEVO ENDPOINT: Estado de la Barrera

### **GET /api/access/barrier-status**

Consulta el estado actual de la barrera simulada.

**Sin autenticación requerida**

```bash
GET http://localhost:3000/api/access/barrier-status
```

**Respuesta cuando está CERRADA:**
```json
{
  "estado": "CERRADA",
  "ultimaActualizacion": "2025-12-17T22:30:15.123Z",
  "ultimoEvento": "AUTO_CIERRE",
  "departamento": 1,
  "usuario": 1,
  "tiempoAbierta": null
}
```

**Respuesta cuando está ABIERTA:**
```json
{
  "estado": "ABIERTA",
  "ultimaActualizacion": "2025-12-17T22:30:05.123Z",
  "ultimoEvento": "ACCESO_VALIDO",
  "departamento": 1,
  "usuario": 1,
  "tiempoAbierta": 3
}
```

**Campo `tiempoAbierta`:**
- `null` = Barrera cerrada
- `3` = Lleva 3 segundos abierta (se auto-cierra a los 10)

---

## 🔄 FLUJOS DE INTERACCIÓN

### **Escenario 1: Usuario pasa tarjeta válida (simulado con Postman)**

**POSTMAN:**
```http
POST http://localhost:3000/api/access/validate
Content-Type: application/json

{
  "mac_sensor": "A1:B2:C3:D4"
}
```

**BACKEND (automático):**
- ✅ Valida la tarjeta en la BD
- ✅ Registra evento de acceso
- ✅ **ABRE LA BARRERA** (estado: ABIERTA)
- ⏰ Programa auto-cierre en 10 segundos
- 📤 Responde a Postman:
  ```json
  {
    "acceso_permitido": true,
    "mensaje": "Acceso permitido - Depto 101 Torre A",
    "sensor": {
      "id": 1,
      "tipo": "Tarjeta",
      "alias": "Tarjeta Principal",
      "departamento": "101 - Torre A"
    }
  }
  ```

**APP MÓVIL (consulta en tiempo real):**
```http
GET http://localhost:3000/api/access/barrier-status
```

**Respuesta:**
```json
{
  "estado": "ABIERTA",
  "ultimoEvento": "ACCESO_VALIDO",
  "tiempoAbierta": 2
}
```

**DESPUÉS DE 10 SEGUNDOS (automático):**
```json
{
  "estado": "CERRADA",
  "ultimoEvento": "AUTO_CIERRE",
  "tiempoAbierta": null
}
```

---

### **Escenario 2: Usuario pasa tarjeta INVÁLIDA (simulado con Postman)**

**POSTMAN:**
```http
POST http://localhost:3000/api/access/validate
Content-Type: application/json

{
  "mac_sensor": "FF:FF:FF:FF"
}
```

**BACKEND (automático):**
- ❌ Tarjeta no encontrada
- ❌ **NO ABRE LA BARRERA** (estado: CERRADA)
- 📤 Responde:
  ```json
  {
    "acceso_permitido": false,
    "mensaje": "Sensor no registrado en el sistema",
    "sensor": null
  }
  ```

**APP MÓVIL (consulta estado):**
```json
{
  "estado": "CERRADA",
  "ultimoEvento": "AUTO_CIERRE",
  "tiempoAbierta": null
}
```

---

### **Escenario 3: Usuario abre barrera desde la app**

**APP MÓVIL:**
1. Login:
   ```http
   POST http://localhost:3000/auth/login
   Body: {"email": "demo@example.com", "password": "123456"}
   ```

2. Abrir barrera:
   ```http
   POST http://localhost:3000/api/access/manual-open
   Authorization: Bearer <TOKEN>
   ```

**BACKEND (automático):**
- ✅ Valida usuario
- ✅ **ABRE LA BARRERA INMEDIATAMENTE**
- ⏰ Auto-cierre en 10 segundos
- 📤 Responde:
  ```json
  {
    "success": true,
    "mensaje": "Comando de apertura enviado",
    "usuario": "Demo User"
  }
  ```

**CONSULTAR ESTADO:**
```http
GET http://localhost:3000/api/access/barrier-status
```

**Respuesta:**
```json
{
  "estado": "ABIERTA",
  "ultimoEvento": "APERTURA_MANUAL",
  "tiempoAbierta": 1
}
```

---

### **Escenario 4: Usuario cierra barrera manualmente**

**APP MÓVIL:**
```http
POST http://localhost:3000/api/access/manual-close
Authorization: Bearer <TOKEN>
```

**BACKEND:**
- ✅ **CIERRA LA BARRERA INMEDIATAMENTE**
- 📤 Responde:
  ```json
  {
    "success": true,
    "mensaje": "Comando de cierre enviado",
    "usuario": "Demo User"
  }
  ```

**CONSULTAR ESTADO:**
```json
{
  "estado": "CERRADA",
  "ultimoEvento": "CIERRE_MANUAL",
  "tiempoAbierta": null
}
```

---

## 📱 MODIFICACIONES NECESARIAS EN LA APP ANDROID

Para que la app consulte el estado en tiempo real, necesitas:

### **1. Agregar endpoint en SensorApiService.kt**

```kotlin
@GET("api/access/barrier-status")
suspend fun getBarrierStatus(): Response<BarrierStatusResponse>
```

### **2. Crear modelo de respuesta**

```kotlin
data class BarrierStatusResponse(
    val estado: String,              // "ABIERTA" o "CERRADA"
    val ultimaActualizacion: String,
    val ultimoEvento: String?,
    val departamento: Int?,
    val usuario: Int?,
    val tiempoAbierta: Int?          // Segundos abierta (null si cerrada)
)
```

### **3. Modificar BarrierControlViewModel.kt**

En lugar de simular localmente, consulta el estado:

```kotlin
// ANTES (simulado localmente):
delay(10000)
_barrierState.value = BarrierState.CLOSED

// DESPUÉS (consulta al backend):
fun startPollingBarrierStatus() {
    viewModelScope.launch {
        while (true) {
            try {
                val response = repository.getBarrierStatus()
                if (response.isSuccessful) {
                    val status = response.body()
                    _barrierState.value = when(status?.estado) {
                        "ABIERTA" -> BarrierState.OPEN
                        "CERRADA" -> BarrierState.CLOSED
                        else -> BarrierState.UNKNOWN
                    }
                }
            } catch (e: Exception) {
                // Manejar error
            }
            delay(2000) // Consulta cada 2 segundos
        }
    }
}
```

---

## 🧪 PRUEBAS CON POSTMAN

### **Orden recomendado:**

1. ✅ **Verificar backend:**
   ```
   GET http://localhost:3000/
   ```

2. ✅ **Consultar estado inicial:**
   ```
   GET http://localhost:3000/api/access/barrier-status
   ```
   Debería responder `estado: "CERRADA"`

3. ✅ **Simular pasar tarjeta válida:**
   ```
   POST http://localhost:3000/api/access/validate
   Body: {"mac_sensor": "A1:B2:C3:D4"}
   ```

4. ✅ **Verificar que se abrió:**
   ```
   GET http://localhost:3000/api/access/barrier-status
   ```
   Debería responder `estado: "ABIERTA"`

5. ⏰ **Esperar 10 segundos**

6. ✅ **Verificar auto-cierre:**
   ```
   GET http://localhost:3000/api/access/barrier-status
   ```
   Debería responder `estado: "CERRADA"`

7. ✅ **Hacer login:**
   ```
   POST http://localhost:3000/auth/login
   Body: {"email": "demo@example.com", "password": "123456"}
   ```

8. ✅ **Abrir manualmente:**
   ```
   POST http://localhost:3000/api/access/manual-open
   Authorization: Bearer <TOKEN>
   ```

9. ✅ **Verificar apertura:**
   ```
   GET http://localhost:3000/api/access/barrier-status
   ```

10. ✅ **Cerrar manualmente:**
    ```
    POST http://localhost:3000/api/access/manual-close
    Authorization: Bearer <TOKEN>
    ```

---

## 🎬 DEMOSTRACIÓN COMPLETA

### **Demo 1: Flujo con Tarjeta**

**Profesor observa la app móvil:**
- Estado inicial: CERRADA

**Tú en Postman:**
- Pasas tarjeta válida: `POST /api/access/validate`

**Profesor ve en la app:**
- ✅ Estado cambia a ABIERTA
- ⏰ Contador: 10, 9, 8...
- ✅ A los 10 seg: CERRADA automáticamente

---

### **Demo 2: Apertura Manual**

**Profesor usa la app:**
- Presiona "ABRIR BARRERA"

**Profesor ve en la app:**
- ✅ Estado: ABIERTA inmediatamente
- ⏰ Contador de 10 segundos
- ✅ Auto-cierre

**Tú en Postman:**
- Consultas: `GET /api/access/barrier-status`
- Muestra que también se ve desde el backend

---

### **Demo 3: Tarjeta Bloqueada**

**Tú en Postman:**
- Primero bloqueas un sensor:
  ```
  POST http://localhost:3000/auth/login
  PUT http://localhost:3000/api/sensors/2/block
  ```

- Intentas pasar esa tarjeta:
  ```
  POST /api/access/validate
  Body: {"mac_sensor": "E5:F6:G7:H8"}
  ```

**Profesor ve en la app:**
- ❌ Estado: CERRADA
- Puedes mostrar el historial de eventos (acceso bloqueado)

---

## ✅ VENTAJAS DE ESTA SIMULACIÓN

1. ✅ **No necesitas Arduino físico**
2. ✅ **Postman simula el sensor RFID**
3. ✅ **Backend controla la barrera virtual**
4. ✅ **App consulta estado en tiempo real**
5. ✅ **Funciona exactamente igual que con hardware**
6. ✅ **Fácil de demostrar al profesor**
7. ✅ **Todos los eventos se registran en BD**

---

## 🐛 TROUBLESHOOTING

### "estado: ABIERTA no cambia a CERRADA"
- Verifica que no estés reabriendo constantemente
- El auto-cierre es de 10 segundos

### "App no muestra el estado correcto"
- Verifica que la app esté consultando `/api/access/barrier-status`
- La app debe hacer polling cada 1-2 segundos

### "Postman dice acceso_permitido: false"
- Verifica que la MAC esté registrada: `SELECT * FROM sensores;`
- Verifica que el estado sea 'ACTIVO'

---

**¡Ahora el backend simula completamente al NodeMCU!** 🎉

**Postman** = Sensor RFID físico
**Backend** = NodeMCU (procesa y controla barrera)
**App Móvil** = Interfaz de monitoreo y control
