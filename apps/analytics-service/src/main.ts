import { NestFactory } from '@nestjs/core';
import { AllExceptionsFilter, createLogger } from '@app/common';
import { AppModule } from './app.module';

const logger = createLogger('analytics-service');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger });
  app.enableShutdownHooks();
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = Number(process.env.PORT ?? 3002);
  await app.listen(port);
  logger.log(`Listen port: ${port}`, 'bootstrap');
}

bootstrap().catch((e) => {
  logger.fatal(e, 'bootstrap');
  process.exit(1);
});