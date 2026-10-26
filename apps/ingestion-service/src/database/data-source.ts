import { config } from 'dotenv';
import { join } from 'path';
import { DataSource } from 'typeorm';

// .env лежит в apps/ingestion-service/, независимо от того, откуда запущена команда
config({ path: join(__dirname, '..', '..', '.env'), quiet: true });

/**
 * DataSource используется только CLI TypeORM (миграции).
 * Само приложение подключается через TypeOrmModule в app.module.ts.
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  migrationsTableName: 'typeorm_migrations',
  // schema НЕ синхронизируем: только миграции
  synchronize: false,
});
