# Node Auth Sample (Express + Knex + SQLite/MySQL)

Backend mínimo con registro, login (JWT) y perfil.

## Endpoints
- **POST** `/auth/register` → { name, email, password }
- **POST** `/auth/login` → { email, password } → { token, user }
- **GET** `/profile` (Bearer token)

## Requisitos
- Node 18+
- Para MySQL: motor corriendo y credenciales.
- Para SQLite: no requiere instalación extra.

## Configuración
1. Copia `.env.example` a `.env` y ajusta valores.
2. Instala dependencias:
   ```bash
   npm i
   ```
3. Migraciones y seed:
   ```bash
   npx knex migrate:latest
   npx knex seed:run
   ```
4. Inicia el servidor:
   ```bash
   npm run dev
   # o
   npm start
   ```

## Cambiar de SQLite a MySQL
- En `.env` cambia:
  ```
  DB_CLIENT=mysql2
  DB_HOST=127.0.0.1
  DB_PORT=3306
  DB_USER=root
  DB_PASSWORD=
  DB_DATABASE=authdb
  ```
- Crea la base si no existe y ejecuta migraciones/seeds de nuevo.

## Importar tabla vía SQL
- También puedes ejecutar `schema.sql` manualmente en tu motor (ajusta `AUTO_INCREMENT` si tu motor lo requiere).
- Luego inserta un usuario demo si quieres.

## Notas
- La contraseña se guarda con `bcryptjs` (hash).
- `JWT` dura `7d` (ajustable con `JWT_EXPIRES_IN`).
- `knexfile.js` detecta `DB_CLIENT` de `.env`.
