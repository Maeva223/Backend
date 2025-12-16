# 🚀 SETUP BACKEND - EVALUACIÓN SUMATIVA III

## Instrucciones para Configurar el Backend con Soporte RFID

---

## 📋 **PASO 1: Ejecutar Migraciones de Base de Datos**

### 1.1 Verificar que estás en la carpeta del Backend

```bash
cd C:\Users\saemm\OneDrive\Documentos\GitHub\Backend
```

### 1.2 Ejecutar migraciones

```bash
npm run migrate
```

**Output esperado:**
```
✅ Tabla "departamentos" creada exitosamente
✅ Tabla "users" modificada exitosamente
✅ Columna "rol" agregada
✅ Columna "estado" agregada
✅ Columna "id_departamento" agregada con FK
✅ Tabla "sensores" creada exitosamente con índices
✅ Tabla "eventos_acceso" creada exitosamente con índices
✅ Tabla "comandos_remotos" creada exitosamente
```

### 1.3 Cargar datos de prueba

```bash
npm run seed
```

**Output esperado:**
```
✅ Departamentos demo creados
✅ Usuario demo configurado como ADMIN del departamento 101
✅ Sensores RFID demo creados
⚠️  IMPORTANTE: Reemplazar las MACs de ejemplo con las MACs reales de tus tarjetas RFID
```

---

## 🔧 **PASO 2: Actualizar MACs de Sensores con Valores Reales**

### 2.1 Obtener MACs reales de tus tarjetas RFID

1. Sube el código `nodemcu/control_acceso_rfid.ino` al NodeMCU
2. Abre el Monitor Serie (115200 baud)
3. Acerca cada tarjeta/llavero al lector RFID
4. Copia las MACs que aparecen, ejemplo:
   ```
   Tarjeta detectada!
   MAC: A1:B2:C3:D4
   ```

### 2.2 Actualizar la base de datos con MACs reales

**Opción 1: Usar la app Android** (recomendado)
- Usa la pantalla "Gestión de Sensores" para registrar nuevos sensores

**Opción 2: Actualizar manualmente la BD**

```bash
# Conectarse a la base de datos
sqlite3 data.sqlite3

# O si usas MySQL:
mysql -u root -p authdb
```

```sql
-- Ver sensores actuales
SELECT * FROM sensores;

-- Actualizar MACs (reemplazar con tus MACs reales)
UPDATE sensores SET codigo_sensor = 'AA:BB:CC:DD:EE:FF' WHERE id_sensor = 1;
UPDATE sensores SET codigo_sensor = '11:22:33:44:55:66' WHERE id_sensor = 2;

-- Verificar
SELECT id_sensor, codigo_sensor, tipo, estado, alias FROM sensores;
```

---

## 🚀 **PASO 3: Iniciar el Backend**

```bash
npm run dev
```

**Output esperado:**
```
Server running on http://localhost:3000
```

**Si el backend ya está en AWS:**
```
El backend ya está desplegado en: http://54.85.65.240/
```

---

## 🧪 **PASO 4: Probar APIs con Postman/cURL**

### 4.1 Health Check

```bash
curl http://localhost:3000/
```

**Respuesta esperada:**
```json
{
  "ok": true,
  "status": "Node auth sample running"
}
```

### 4.2 Login (obtener token JWT)

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"demo@example.com\", \"password\": \"123456\"}"
```

**Respuesta esperada:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Demo User",
    "email": "demo@example.com"
  }
}
```

**Copiar el token para usarlo en las siguientes pruebas**

### 4.3 Validar Sensor RFID (simular NodeMCU)

```bash
curl -X POST http://localhost:3000/api/access/validate \
  -H "Content-Type: application/json" \
  -d "{\"mac_sensor\": \"A1:B2:C3:D4\"}"
```

**Respuesta esperada (sensor válido):**
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

**Respuesta (sensor no registrado):**
```json
{
  "acceso_permitido": false,
  "mensaje": "Sensor no registrado en el sistema",
  "sensor": null
}
```

### 4.4 Listar Sensores del Departamento

```bash
curl http://localhost:3000/api/sensors/department/1 \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### 4.5 Abrir Barrera Manualmente desde App

```bash
curl -X POST http://localhost:3000/api/access/manual-open \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "mensaje": "Comando de apertura enviado",
  "usuario": "Demo User"
}
```

### 4.6 NodeMCU obtiene comando pendiente

```bash
curl http://localhost:3000/api/access/get-command
```

**Respuesta esperada:**
```json
{
  "comando": "ABRIR"
}
```

### 4.7 Ver Historial de Accesos

```bash
curl http://localhost:3000/api/access/history/1?limit=10 \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

---

## 📊 **ESTRUCTURA DE BASE DE DATOS**

```
departamentos
├── id_departamento (PK)
├── numero
├── torre
└── condominio

users (modificada)
├── id (PK)
├── name
├── email
├── password_hash
├── rol (ADMIN | OPERADOR)
├── estado (ACTIVO | INACTIVO | BLOQUEADO)
└── id_departamento (FK)

sensores
├── id_sensor (PK)
├── codigo_sensor (MAC RFID) UNIQUE
├── estado (ACTIVO | INACTIVO | PERDIDO | BLOQUEADO)
├── tipo (Llavero | Tarjeta)
├── id_departamento (FK)
├── id_usuario_registro (FK)
└── alias

eventos_acceso
├── id_evento (PK)
├── id_sensor (FK)
├── id_usuario (FK)
├── id_departamento (FK)
├── tipo_evento (ACCESO_VALIDO | ACCESO_RECHAZADO | APERTURA_MANUAL | etc.)
├── resultado (PERMITIDO | DENEGADO)
├── mac_sensor
└── fecha_hora

comandos_remotos
├── id_comando (PK)
├── comando (ABRIR | CERRAR)
├── id_usuario (FK)
├── id_departamento (FK)
├── estado (PENDIENTE | EJECUTADO | EXPIRADO)
└── fecha_creacion
```

---

## 🔗 **ENDPOINTS DISPONIBLES**

### Autenticación
- `POST /auth/register` - Registro de usuarios
- `POST /auth/login` - Login
- `POST /auth/forgot-password` - Recuperar contraseña
- `POST /auth/reset-password` - Resetear contraseña

### Perfil
- `GET /profile` - Ver perfil (requiere auth)

### Acceso RFID (IoT)
- `POST /api/access/validate` - Validar sensor RFID (NodeMCU)
- `POST /api/access/manual-open` - Abrir barrera (requiere auth)
- `POST /api/access/manual-close` - Cerrar barrera (requiere auth)
- `GET /api/access/get-command` - Obtener comando pendiente (NodeMCU)
- `GET /api/access/history/:departmentId` - Historial de accesos (requiere auth)

### Sensores RFID (Gestión)
- `GET /api/sensors/department/:departmentId` - Listar sensores (requiere auth)
- `POST /api/sensors/register` - Registrar sensor (requiere ADMIN)
- `PUT /api/sensors/:sensorId/activate` - Activar sensor (requiere ADMIN)
- `PUT /api/sensors/:sensorId/deactivate` - Desactivar sensor (requiere ADMIN)
- `PUT /api/sensors/:sensorId/block` - Bloquear sensor (requiere ADMIN)
- `PUT /api/sensors/:sensorId/mark-lost` - Marcar como perdido (requiere ADMIN)
- `DELETE /api/sensors/:sensorId` - Eliminar sensor (requiere ADMIN)

---

## ✅ **CHECKLIST ANTES DE LA DEMOSTRACIÓN**

- [ ] Migraciones ejecutadas sin errores
- [ ] Seeds cargados
- [ ] MACs de sensores actualizadas con valores reales
- [ ] Backend corriendo (local o AWS)
- [ ] NodeMCU configurado y conectado a WiFi
- [ ] RFID lee tarjetas y muestra MACs en Monitor Serie
- [ ] Validación RFID funciona (LED verde/rojo)
- [ ] Servo motor abre/cierra barrera
- [ ] App Android conecta con backend
- [ ] Pruebas de apertura manual desde app funcionan

---

## 🐛 **TROUBLESHOOTING**

### Error: "Migration failed"
```bash
# Rollback y volver a migrar
npm run rollback
npm run migrate
```

### Error: "Foreign key constraint failed"
```bash
# Verificar orden de migraciones (deben estar en orden numérico)
ls -la migrations/
```

### Backend no inicia
```bash
# Verificar variables de entorno
cat .env

# Verificar base de datos
sqlite3 data.sqlite3 "SELECT name FROM sqlite_master WHERE type='table';"
```

### NodeMCU no puede validar sensores
1. Verificar que el backend esté accesible desde la red del NodeMCU
2. Verificar que la URL en `control_acceso_rfid.ino` sea correcta
3. Revisar Monitor Serie para ver errores HTTP

---

## 📚 **RECURSOS ADICIONALES**

- Documentación Knex.js: https://knexjs.org/
- Guía RFID RC522: https://github.com/miguelbalboa/rfid
- Documentación Express: https://expressjs.com/

---

**¡Backend listo para Evaluación Sumativa III!** 🎉
