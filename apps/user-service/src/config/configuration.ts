export default () => ({
  port: parseInt(process.env.USER_PORT ?? '3002', 10),
  internalApiKey: process.env.INTERNAL_API_KEY ?? '',
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
  },
});
