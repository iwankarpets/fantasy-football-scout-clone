import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter, createLogger } from '@app/common'; // TODO: поправьте путь под ваш алиас libs
import { AppModule } from './app.module';

const logger = createLogger('ingestion-service');

async function bootstrap() {
  // bufferLogs: сообщения Nest при старте копятся, пока не подключён наш логгер
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(logger);

  app.useGlobalFilters(new AllExceptionsFilter());

  const port = app.get(ConfigService).getOrThrow<number>('port');
  await app.listen(port);
  logger.log(`Сервис запущен на порту ${port}`, 'Bootstrap');
}

// Обработчик unhandledRejection из createLogger только пишет в лог и не завершает процесс,
// поэтому ошибку старта (например, база недоступна) ловим явно.
bootstrap().catch((err) => {
  logger.fatal(err, 'Bootstrap');
  process.exit(1);
});
