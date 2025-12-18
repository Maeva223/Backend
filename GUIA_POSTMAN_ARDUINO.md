# 🔧 GUÍA POSTMAN - SIMULAR PETICIONES DEL ARDUINO

## 📋 Requisitos Previos

1. **Backend corriendo:**
   ```bash
   cd C:\Users\saemm\OneDrive\Documentos\GitHub\Backend
   npm run dev
   ```

   Deberías ver: `Server running on http://localhost:3000`

2. **Base de datos inicializada:**
   ```bash
   npm run migrate
   npm run seed
   ```

3. **Postman instalado** (o usar la versión web)

---

## 🚀 ENDPOINTS DEL ARDUINO (Para simular en Postman)

El Arduino hace **DOS tipos de peticiones** al backend:

### 1️⃣ **Validar Tarjeta RFID** (cuando detecta una tarjeta)
### 2️⃣ **Obtener Comandos Pendientes** (consulta cada 2 segundos)

---

## 📝 PETICIONES POSTMAN

### **PETICIÓN 1: Validar Tarjeta RFID (ACCESO PERMITIDO)**

**Esta petición simula cuando el Arduino lee una tarjeta RFID válida**

```
Método: POST
URL: http://localhost:3000/api/access/validate
Headers:
  Content-Type: application/json

Body (raw JSON):
{
  "mac_sensor": "A1:B2:C3:D4"
}
```

**Respuesta Esperada (ACCESO PERMITIDO):**
```json
{
  "acceso_permitido": true,
  "mensaje": "Acceso permitido - Depto 101 Torre A",
  "sensor": {
    "id": 1,
    "tipo": "Tarjeta",
    "alias": "Tarjeta Principal - Depto 101",
    "departamento": "101 - Torre A"
  }
}
```

**¿Qué haría el Arduino con esta respuesta?**
- ✅ Enciende LED VERDE
- ✅ Abre la barrera (servo a 90°)
- ✅ Espera 10 segundos
- ✅ Cierra la barrera automáticamente

---

### **PETICIÓN 2: Validar Tarjeta RFID (ACCESO DENEGADO)**

**Esta petición simula cuando el Arduino lee una tarjeta RFID NO registrada**

```
Método: POST
URL: http://localhost:3000/api/access/validate
Headers:
  Content-Type: application/json

Body (raw JSON):
{
  "mac_sensor": "FF:FF:FF:FF"
}
```

**Respuesta Esperada (ACCESO DENEGADO):**
```json
{
  "acceso_permitido": false,
  "mensaje": "Sensor no registrado en el sistema",
  "sensor": null
}
```

**¿Qué haría el Arduino con esta respuesta?**
- ❌ Enciende LED ROJO
- ❌ NO abre la barrera
- ❌ Mantiene LED rojo por 3 segundos
- ❌ Vuelve a esperar

---

### **PETICIÓN 3: Validar Tarjeta BLOQUEADA**

**Esta petición simula cuando el Arduino lee una tarjeta que fue bloqueada por el administrador**

Primero necesitas tener una tarjeta bloqueada en la BD. Puedes usar el endpoint de administración o modificar manualmente la BD:

```sql
UPDATE sensores SET estado = 'BLOQUEADO' WHERE id_sensor = 2;
```

Luego en Postman:

```
Método: POST
URL: http://localhost:3000/api/access/validate
Headers:
  Content-Type: application/json

Body (raw JSON):
{
  "mac_sensor": "E5:F6:G7:H8"
}
```

**Respuesta Esperada:**
```json
{
  "acceso_permitido": false,
  "mensaje": "Sensor BLOQUEADO - Llavero Depto 101",
  "sensor": null
}
```

---

### **PETICIÓN 4: Obtener Comando Pendiente (SIN COMANDOS)**

**Esta petición simula cuando el Arduino consulta si hay comandos de apertura/cierre manual**

```
Método: GET
URL: http://localhost:3000/api/access/get-command
```

**Respuesta Esperada (sin comandos pendientes):**
```json
{
  "comando": null
}
```

**¿Qué haría el Arduino?**
- ⏸️ Nada, sigue esperando tarjetas RFID

---

### **PETICIÓN 5: Obtener Comando Pendiente (CON COMANDO "ABRIR")**

**Primero necesitas crear un comando de apertura manual. Para esto, necesitas:**

#### PASO 1: Hacer login y obtener token JWT

```
Método: POST
URL: http://localhost:3000/auth/login
Headers:
  Content-Type: application/json

Body (raw JSON):
{
  "email": "demo@example.com",
  "password": "123456"
}
```

**Respuesta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTczNDQ4OTg0MCwiZXhwIjoxNzM1MDk0NjQwfQ.abc123...",
  "user": {
    "id": 1,
    "name": "Demo User",
    "email": "demo@example.com"
  }
}
```

**⚠️ IMPORTANTE: Copia el token, lo necesitarás en el siguiente paso**

---

#### PASO 2: Enviar comando de apertura manual (desde la app móvil)

```
Método: POST
URL: http://localhost:3000/api/access/manual-open
Headers:
  Content-Type: application/json
  Authorization: Bearer TU_TOKEN_AQUI
```

**Respuesta:**
```json
{
  "success": true,
  "mensaje": "Comando de apertura enviado",
  "usuario": "Demo User"
}
```

---

#### PASO 3: Arduino consulta comandos pendientes

```
Método: GET
URL: http://localhost:3000/api/access/get-command
```

**Respuesta Esperada:**
```json
{
  "comando": "ABRIR"
}
```

**¿Qué haría el Arduino?**
- ✅ Enciende LED VERDE
- ✅ Abre la barrera
- ✅ Espera 10 segundos
- ✅ Cierra automáticamente

**⚠️ IMPORTANTE:** El comando se marca como "EJECUTADO" y desaparece de la cola. Si vuelves a hacer GET, obtendrás `{"comando": null}`.

---

### **PETICIÓN 6: Enviar Comando de Cierre Manual**

```
Método: POST
URL: http://localhost:3000/api/access/manual-close
Headers:
  Content-Type: application/json
  Authorization: Bearer TU_TOKEN_AQUI
```

**Respuesta:**
```json
{
  "success": true,
  "mensaje": "Comando de cierre enviado",
  "usuario": "Demo User"
}
```

Luego el Arduino consulta:

```
Método: GET
URL: http://localhost:3000/api/access/get-command
```

**Respuesta:**
```json
{
  "comando": "CERRAR"
}
```

**¿Qué haría el Arduino?**
- ⏸️ Cierra la barrera inmediatamente
- 💡 Apaga LEDs
- ⏸️ Vuelve al estado ESPERANDO

---

## 🎯 COLECCIÓN POSTMAN COMPLETA

### Carpeta 1: "Arduino - Validación RFID"

1. **Validar Tarjeta Permitida**
   - `POST /api/access/validate`
   - Body: `{"mac_sensor": "A1:B2:C3:D4"}`

2. **Validar Tarjeta Denegada**
   - `POST /api/access/validate`
   - Body: `{"mac_sensor": "FF:FF:FF:FF"}`

3. **Validar Tarjeta Bloqueada**
   - `POST /api/access/validate`
   - Body: `{"mac_sensor": "E5:F6:G7:H8"}`

### Carpeta 2: "Arduino - Comandos Remotos"

4. **Obtener Comandos Pendientes**
   - `GET /api/access/get-command`

### Carpeta 3: "App Móvil - Control Manual"

5. **Login**
   - `POST /auth/login`
   - Body: `{"email": "demo@example.com", "password": "123456"}`
   - 💾 Guardar token en variable de entorno

6. **Abrir Barrera Manualmente**
   - `POST /api/access/manual-open`
   - Header: `Authorization: Bearer {{token}}`

7. **Cerrar Barrera Manualmente**
   - `POST /api/access/manual-close`
   - Header: `Authorization: Bearer {{token}}`

---

## 📊 FLUJO COMPLETO DE PRUEBA

### **Escenario 1: Usuario con Tarjeta Válida**

1. ✅ **Arduino consulta comandos** → `GET /api/access/get-command` → Sin comandos
2. 🔍 **Arduino lee tarjeta** → `POST /api/access/validate` con MAC válida
3. ✅ **Backend responde** → `acceso_permitido: true`
4. 🚧 **Arduino abre barrera** (LED verde, servo a 90°)
5. ⏰ **Espera 10 segundos**
6. 🚧 **Arduino cierra barrera** (servo a 0°, apaga LEDs)

---

### **Escenario 2: Usuario con Tarjeta NO Registrada**

1. 🔍 **Arduino lee tarjeta** → `POST /api/access/validate` con MAC desconocida
2. ❌ **Backend responde** → `acceso_permitido: false`
3. 🚫 **Arduino enciende LED rojo** (barrera cerrada)
4. ⏰ **Espera 3 segundos**
5. 💡 **Apaga LED y vuelve a esperar**

---

### **Escenario 3: Apertura Manual desde App**

1. 📱 **Usuario abre app** → Hace login → `POST /auth/login`
2. 📱 **Usuario presiona "Abrir Barrera"** → `POST /api/access/manual-open`
3. 💾 **Backend crea comando** → Estado: PENDIENTE
4. 🤖 **Arduino consulta** (cada 2 seg) → `GET /api/access/get-command`
5. ✅ **Backend responde** → `{"comando": "ABRIR"}`
6. 🚧 **Arduino abre barrera** (LED verde, servo a 90°)
7. ⏰ **Espera 10 segundos**
8. 🚧 **Arduino cierra barrera automáticamente**

---

## 🐛 TROUBLESHOOTING

### Error: "Cannot POST /api/access/validate"
- ✅ Verifica que el backend esté corriendo: `npm run dev`
- ✅ Verifica la URL: debe ser `http://localhost:3000/api/access/validate`

### Error: "mac_sensor es requerida"
- ✅ Verifica que el body tenga el campo `mac_sensor`
- ✅ Verifica que el header `Content-Type: application/json` esté presente

### Respuesta: "acceso_permitido: false" (pero debería ser true)
- ✅ Verifica que la MAC esté en la base de datos: `SELECT * FROM sensores;`
- ✅ Verifica que el sensor tenga estado "ACTIVO"
- ✅ Verifica que las MACs coincidan (mayúsculas, formato correcto)

### Error: "Comando expirado"
- ⏰ Los comandos expiran después de 30 segundos
- ✅ Vuelve a crear el comando con `POST /api/access/manual-open`

---

## 📚 VARIABLES DE ENTORNO EN POSTMAN (OPCIONAL)

Para facilitar las pruebas, puedes crear variables de entorno:

```
baseUrl = http://localhost:3000
token = (se guardará después del login)
mac_valida = A1:B2:C3:D4
mac_invalida = FF:FF:FF:FF
```

Luego usas: `{{baseUrl}}/api/access/validate`

---

## ✅ CHECKLIST

- [ ] Backend corriendo en puerto 3000
- [ ] Migraciones ejecutadas (`npm run migrate`)
- [ ] Seeds cargados (`npm run seed`)
- [ ] Postman instalado
- [ ] Probada petición de validación con MAC válida → Acceso permitido
- [ ] Probada petición de validación con MAC inválida → Acceso denegado
- [ ] Probado login → Token obtenido
- [ ] Probada apertura manual → Comando creado
- [ ] Probada consulta de comandos → Comando "ABRIR" recibido

---

**¡Ya estás listo para simular las peticiones del Arduino con Postman!** 🎉

Las dos peticiones principales que hace el Arduino son:
1. `POST /api/access/validate` - Validar tarjeta RFID
2. `GET /api/access/get-command` - Obtener comandos pendientes

Todo lo demás son peticiones de la app móvil para crear esos comandos.
