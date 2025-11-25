import 'dotenv/config';

const common = {
  migrations: { directory: './migrations' },
  seeds: { directory: './seeds' }
};

const client = process.env.DB_CLIENT || 'sqlite3';

const config = {
  sqlite3: {
    client: 'sqlite3',
    connection: {
      filename: process.env.DB_FILENAME || './data.sqlite3'
    },
    useNullAsDefault: true,
    ...common
  },
  mysql2: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'authdb',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306
    },
    pool: { min: 0, max: 10 },
    ...common
  }
};

export default config[client];
