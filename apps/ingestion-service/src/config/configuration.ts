/** Все переменные окружения сервиса читаются только здесь. */
export default () => ({
  port: parseInt(process.env.INGESTION_PORT ?? '3001', 10),
  internalApiKey: process.env.INTERNAL_API_KEY ?? '',
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
  },
  fpl: {
    baseUrl: process.env.FPL_API_BASE_URL ?? 'https://fantasy.premierleague.com/api',
    requestDelayMs: parseInt(process.env.FPL_REQUEST_DELAY_MS ?? '1000', 10),
  },
});
