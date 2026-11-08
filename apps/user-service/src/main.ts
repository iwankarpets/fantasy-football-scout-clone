import { NestFactory } from '@nestjs/core';
import { UserServiceModule } from './user-service.module';

async function bootstrap() {
  const app = await NestFactory.create(UserServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
