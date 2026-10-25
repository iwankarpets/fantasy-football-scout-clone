import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // TODO: подключить общий логгер и фильтр исключений из libs/common
  const port = app.get(ConfigService).getOrThrow<number>('port');
  await app.listen(port);
}
bootstrap();