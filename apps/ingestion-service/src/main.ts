import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter, createLogger } from '@app/common'; // TODO: поправьте путь под ваш алиас libs
import { AppModule } from './app.module';

const logger = createLogger('ingestion-service');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(logger);
  app.useGlobalFilters(new AllExceptionsFilter());

  if (process.env.NODE_ENV !== 'production') {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Ingestion service')
        .setDescription('Служебные эндпоинты загрузки данных FPL')
        .setVersion('1.0')
        .addApiKey({ type: 'apiKey', name: 'x-internal-key', in: 'header' }, 'internal-key')
        .build(),
    );
    SwaggerModule.setup('docs', app, document);
  }

  const port = app.get(ConfigService).getOrThrow<number>('port');
  await app.listen(port);
  logger.log(`Сервис запущен на порту ${port}`, 'Bootstrap');
}


bootstrap().catch((err) => {
  logger.fatal(err, 'Bootstrap');
  process.exit(1);
});