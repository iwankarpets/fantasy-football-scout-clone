/** Все переменные окружения сервиса читаются только здесь. */
export default () => ({
  port: parseInt(process.env.NOTIFICATION_PORT ?? '3003', 10),
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
  bot: {
    token: process.env.BOT_TOKEN ?? '',
  },
  userService: {
    baseUrl: process.env.USER_SERVICE_URL ?? 'http://localhost:3002',
  },
  analyticsService: {
    baseUrl: process.env.ANALYTICS_SERVICE_URL ?? 'http://localhost:3004',
  },
  rateLimit: {
    windowSeconds: parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS ?? '10', 10),
    maxCommands: parseInt(process.env.RATE_LIMIT_MAX_COMMANDS ?? '10', 10),
  },
});
