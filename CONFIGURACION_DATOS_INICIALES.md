# 🔧 CONFIGURACIÓN DE DATOS INICIALES

## Guía completa para configurar usuarios, departamentos y sensores

---

## 📋 **PASO 1: Ejecutar Migraciones y Seeds**

```bash
cd C:\Users\saemm\OneDrive\Documentos\GitHub\Backend

# 1. Ejecutar migraciones
npm run migrate

# 2. Cargar datos demo
npm run seed
```

**Esto crea:**
- ✅ Usuario demo: `demo@example.com` / `123456`
- ✅ 3 departamentos de prueba
- ✅ 4 sensores RFID de ejemplo (con MACs ficticias)

---

## 📝 **PASO 2: Actualizar Usuario Demo como ADMIN**

El usuario demo ya está configurado como ADMIN del departamento 101. Verificar:

```sql
-- Conectar a la base de datos
sqlite3 data.sqlite3

-- O si usas MySQL:
-- mysql -u root -p authdb

-- Verificar usuario demo
SELECT id, name, email, rol, estado, id_departamento FROM users WHERE email = 'demo@example.com';

-- Debería mostrar:
-- id=1, name='Demo User', email='demo@example.com', rol='ADMIN', estado='ACTIVO', id_departamento=1
```

Si no está configurado correctamente:

```sql
UPDATE users
SET rol = 'ADMIN', estado = 'ACTIVO', id_departamento = 1
WHERE email = 'demo@example.com';
```

---

## 🏢 **PASO 3: Crear Departamentos Adicionales (Opcional)**

```sql
-- Insertar más departamentos
INSERT INTO departamentos (numero, torre, condominio, piso) VALUES
('104', 'Torre A', 'Condominio Los Pinos', 1),
('205', 'Torre B', 'Condominio Los Pinos', 2),
('306', 'Torre C', 'Condominio Los Pinos', 3);

-- Ver todos los departamentos
SELECT * FROM departamentos;
```

---

## 👥 **PASO 4: Crear Usuario OPERADOR de Prueba**

```sql
-- Nota: La contraseña debe estar hasheada con bcrypt
-- Para fines de prueba, usaremos el mismo hash de 'demo@example.com' (password: 123456)

-- Primero, obtener el hash existente
SELECT password_hash FROM users WHERE email = 'demo@example.com';

-- Copiar ese hash y usarlo para crear el nuevo usuario
INSERT INTO users (name, last_name, email, password_hash, rol, estado, id_departamento, created_at)
VALUES (
    'Juan Operador',
    'Pérez',
    'operador@example.com',
    '$2a$10$...', -- PEGAR EL HASH COPIADO ARRIBA
    'OPERADOR',
    'ACTIVO',
    1, -- Mismo departamento que el admin
    datetime('now')
);
```

**Forma más fácil (usando la app Android):**
1. Ir a "CRUD USUARIO" > "Registrar Usuario"
2. Crear usuario con email `operador@example.com`
3. Luego actualizar en BD:
   ```sql
   UPDATE users
   SET rol = 'OPERADOR', id_departamento = 1
   WHERE email = 'operador@example.com';
   ```

---

## 🏷️ **PASO 5: Registrar MACs Reales de Tarjetas RFID**

### **5.1 Obtener MACs del NodeMCU**

1. Subir código `control_acceso_rfid.ino` al NodeMCU
2. Abrir Monitor Serie (115200 baud)
3. Acercar cada tarjeta/llavero al lector RFID
4. Copiar las MACs que aparecen, ejemplo:
   ```
   Tarjeta detectada!
   MAC: A1:B2:C3:D4
   ```

### **5.2 Actualizar Base de Datos con MACs Reales**

**Opción A: Actualizar MACs existentes**
```sql
-- Ver sensores actuales
SELECT * FROM sensores;

-- Actualizar con MACs reales
UPDATE sensores SET codigo_sensor = 'A1:B2:C3:D4' WHERE id_sensor = 1;
UPDATE sensores SET codigo_sensor = 'E5:F6:A7:B8' WHERE id_sensor = 2;
UPDATE sensores SET codigo_sensor = '11:22:33:44' WHERE id_sensor = 3;
UPDATE sensores SET codigo_sensor = 'AA:BB:CC:DD' WHERE id_sensor = 4;
```

**Opción B: Usar la App Android (RECOMENDADO)**
1. Login como ADMIN (`demo@example.com` / `123456`)
2. Ir a "GESTIÓN DE SENSORES RFID"
3. Click en "+" (Agregar Sensor)
4. Ingresar:
   - MAC: `A1:B2:C3:D4` (la que obtuviste del NodeMCU)
   - Tipo: Tarjeta o Llavero
   - Alias: "Tarjeta Principal Juan"
5. Click "Registrar"

---

## 🔍 **PASO 6: Verificar Configuración Completa**

### **Verificar Departamentos**
```sql
SELECT * FROM departamentos;
```
**Esperado:** Al menos 3 departamentos

### **Verificar Usuarios**
```sql
SELECT id, name, email, rol, estado, id_departamento FROM users;
```
**Esperado:**
- 1 usuario ADMIN (demo@example.com)
- 1 usuario OPERADOR (operador@example.com) - opcional

### **Verificar Sensores**
```sql
SELECT s.id_sensor, s.codigo_sensor, s.tipo, s.estado, s.alias, d.numero as depto
FROM sensores s
JOIN departamentos d ON s.id_departamento = d.id_departamento;
```
**Esperado:** Al menos 2 sensores ACTIVOS con MACs reales

### **Verificar Relaciones**
```sql
-- Usuarios con sus departamentos
SELECT u.name, u.rol, d.numero as depto, d.torre
FROM users u
LEFT JOIN departamentos d ON u.id_departamento = d.id_departamento;
```

---

## 🧪 **PASO 7: Probar APIs con Postman**

### **7.1 Login**
```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "demo@example.com",
  "password": "123456"
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Demo User",
    "email": "demo@example.com"
  }
}
```

**⚠️ COPIAR EL TOKEN para usarlo en las siguientes pruebas**

### **7.2 Validar Sensor RFID (Simular NodeMCU)**
```http
POST http://localhost:3000/api/access/validate
Content-Type: application/json

{
  "mac_sensor": "A1:B2:C3:D4"
}
```

**Respuesta esperada (sensor ACTIVO):**
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

### **7.3 Listar Sensores del Departamento**
```http
GET http://localhost:3000/api/sensors/department/1
Authorization: Bearer {TOKEN_COPIADO_DEL_LOGIN}
```

### **7.4 Abrir Barrera Manualmente**
```http
POST http://localhost:3000/api/access/manual-open
Authorization: Bearer {TOKEN_COPIADO_DEL_LOGIN}
Content-Type: application/json
```

**Respuesta esperada:**
```json
{
  "success": true,
  "mensaje": "Comando de apertura enviado",
  "usuario": "Demo User"
}
```

### **7.5 Obtener Comando Pendiente (NodeMCU)**
```http
GET http://localhost:3000/api/access/get-command
```

**Respuesta esperada:**
```json
{
  "comando": "ABRIR"
}
```

---

## 📱 **PASO 8: Configurar App Android**

### **8.1 Primer Login**
1. Abrir app en smartphone
2. Login con: `demo@example.com` / `123456`
3. Ir a "GESTIÓN DE SENSORES RFID"
4. Verificar que aparezcan los sensores

### **8.2 Probar Llavero Digital**
1. Click en "LLAVERO DIGITAL"
2. Click "ABRIR BARRERA"
3. Verificar:
   - ✅ Indicador cambia a "ABRIENDO..."
   - ✅ NodeMCU recibe comando (LED verde, servo abre)
   - ✅ Después de 10s, barrera cierra automáticamente

---

## 🔧 **PASO 9: Asignar Departamento a Usuario Existente**

Si ya tienes usuarios creados y necesitas asignarles departamento:

```sql
-- Ver usuarios sin departamento
SELECT id, name, email, id_departamento FROM users WHERE id_departamento IS NULL;

-- Asignar departamento
UPDATE users SET id_departamento = 1 WHERE email = 'usuario@example.com';

-- Asignar rol ADMIN
UPDATE users SET rol = 'ADMIN' WHERE email = 'usuario@example.com';
```

---

## 🎯 **ESCENARIOS DE PRUEBA COMPLETOS**

### **Escenario 1: Acceso con Tarjeta Válida**
1. Acercar tarjeta RFID registrada al lector
2. **Esperado:**
   - LED aro → Azul (validando)
   - Monitor Serie: "Validando RFID: A1:B2:C3:D4"
   - Backend: POST /api/access/validate
   - Base de datos: Registro en tabla `eventos_acceso`
   - LED aro → Verde
   - Servo abre barrera (90°)
   - Espera 10 segundos
   - Servo cierra barrera (0°)
   - LED apaga

### **Escenario 2: Acceso con Tarjeta No Registrada**
1. Acercar tarjeta RFID NO registrada
2. **Esperado:**
   - LED aro → Azul (validando)
   - Monitor Serie: "Validando RFID: FF:FF:FF:FF"
   - Backend: POST /api/access/validate → `acceso_permitido: false`
   - LED aro → Rojo
   - Servo NO se mueve
   - Base de datos: Registro en `eventos_acceso` con tipo "ACCESO_RECHAZADO"
   - LED apaga después de 3 segundos

### **Escenario 3: Apertura Manual desde App**
1. Abrir app móvil
2. Login como ADMIN o OPERADOR
3. Click "LLAVERO DIGITAL"
4. Click "ABRIR BARRERA"
5. **Esperado:**
   - App: Indicador cambia a "ABRIENDO..."
   - Backend: POST /api/access/manual-open
   - Base de datos: Inserta comando en `comandos_remotos` con estado PENDIENTE
   - NodeMCU: GET /api/access/get-command → recibe "ABRIR"
   - Base de datos: Actualiza comando a EJECUTADO
   - Base de datos: Registro en `eventos_acceso` con tipo "APERTURA_MANUAL"
   - LED aro → Verde
   - Servo abre barrera
   - App: Indicador cambia a "BARRERA ABIERTA"
   - Espera 10 segundos
   - Servo cierra automáticamente
   - App: Indicador cambia a "BARRERA CERRADA"

### **Escenario 4: Gestión de Sensor (Solo ADMIN)**
1. Login como ADMIN
2. Ir a "GESTIÓN DE SENSORES RFID"
3. Click "+" para agregar sensor
4. Ingresar MAC, tipo y alias
5. Click "Registrar"
6. **Esperado:**
   - Backend: POST /api/sensors/register
   - Base de datos: Nuevo registro en tabla `sensores`
   - Lista de sensores se actualiza
   - Nuevo sensor aparece con estado "ACTIVO" (chip verde)

---

## 📊 **DATOS DE PRUEBA COMPLETOS**

### **Usuarios de Prueba**
| Email | Password | Rol | Departamento | Uso |
|-------|----------|-----|--------------|-----|
| demo@example.com | 123456 | ADMIN | 101 - Torre A | Gestión completa de sensores |
| operador@example.com | 123456 | OPERADOR | 101 - Torre A | Solo usar llavero digital |

### **Sensores de Prueba (actualizar MACs con reales)**
| MAC | Tipo | Estado | Departamento | Alias |
|-----|------|--------|--------------|-------|
| A1:B2:C3:D4 | Tarjeta | ACTIVO | 101 | Tarjeta Principal |
| E5:F6:A7:B8 | Llavero | ACTIVO | 101 | Llavero Secundario |
| 11:22:33:44 | Tarjeta | INACTIVO | 202 | Tarjeta Temporal |
| AA:BB:CC:DD | Llavero | BLOQUEADO | 202 | Llavero Bloqueado |

---

## ✅ **CHECKLIST DE CONFIGURACIÓN FINAL**

- [ ] Backend corriendo en http://localhost:3000 o http://54.85.65.240
- [ ] Migraciones ejecutadas exitosamente
- [ ] Seeds cargados
- [ ] Usuario ADMIN creado y configurado
- [ ] Al menos 1 departamento existe
- [ ] MACs de sensores actualizadas con valores reales del RFID
- [ ] APIs probadas con Postman (login, validate, sensors)
- [ ] App Android instalada en smartphone
- [ ] Login en app funciona
- [ ] Pantallas "Gestión de Sensores" y "Llavero Digital" accesibles
- [ ] NodeMCU conectado a WiFi
- [ ] NodeMCU lee tarjetas RFID correctamente
- [ ] Sistema completo funciona end-to-end

---

## 🆘 **PROBLEMAS COMUNES**

### **Error: "Usuario no tiene departamento asignado"**
**Solución:**
```sql
UPDATE users SET id_departamento = 1 WHERE email = 'tu@email.com';
```

### **Error: "Solo administradores pueden registrar sensores"**
**Solución:**
```sql
UPDATE users SET rol = 'ADMIN' WHERE email = 'tu@email.com';
```

### **Sensor siempre rechazado aunque MAC es correcta**
**Solución:**
1. Verificar que estado sea "ACTIVO":
   ```sql
   SELECT codigo_sensor, estado FROM sensores WHERE codigo_sensor = 'TU_MAC';
   ```
2. Activar sensor:
   ```sql
   UPDATE sensores SET estado = 'ACTIVO' WHERE codigo_sensor = 'TU_MAC';
   ```

### **App no se conecta al backend**
**Solución:**
1. Verificar URL en `ApiConfig.kt` (debe ser accesible desde smartphone)
2. Si usas localhost, cambiar a IP local: `http://192.168.1.X:3000`
3. Verificar que smartphone y backend estén en misma red WiFi

---

**¡CONFIGURACIÓN COMPLETA!** 🎉

Tu sistema ahora tiene:
- ✅ Usuarios configurados (ADMIN y OPERADOR)
- ✅ Departamentos creados
- ✅ Sensores RFID registrados
- ✅ Listo para demostración completa
