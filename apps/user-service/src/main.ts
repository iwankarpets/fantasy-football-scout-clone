import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter, createLogger } from '@app/common';
import { AppModule } from './app.module';

const logger = createLogger('user-service');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(logger);
  app.useGlobalFilters(new AllExceptionsFilter());

  if (process.env.NODE_ENV !== 'production') {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('User service')
        .setDescription('Internal endpoints: users, watchlist, notification settings')
        .setVersion('1.0')
        .addApiKey({ type: 'apiKey', name: 'x-internal-key', in: 'header' }, 'internal-key')
        .build(),
    );
    SwaggerModule.setup('docs', app, document);
  }

  const port = app.get(ConfigService).getOrThrow<number>('port');
  await app.listen(port);
  logger.log(`Service started on port ${port}`, 'Bootstrap');
}

bootstrap().catch((err) => {
  logger.fatal(err, 'Bootstrap');
  process.exit(1);
});
