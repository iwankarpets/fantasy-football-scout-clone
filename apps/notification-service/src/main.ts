import { NestFactory } from '@nestjs/core';
import { createLogger } from '@app/common';
import { AppModule } from './app.module';

const logger = createLogger('notification-service');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger });
  app.enableShutdownHooks();
}

bootstrap().catch((e) => {
  logger.fatal(e, 'bootstrap');
  process.exit(1);
});