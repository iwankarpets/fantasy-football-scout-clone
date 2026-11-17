import { Global, Inject, Logger, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS = Symbol('REDIS');

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const logger = new Logger('Redis');
        const client = new Redis({
          host: config.getOrThrow<string>('redis.host'),
          port: config.getOrThrow<number>('redis.port'),
          // Команды сразу падают, если Redis недоступен, а не копятся в очереди:
          // лимитер тогда пропускает запросы, а бот продолжает отвечать.
          enableOfflineQueue: false,
          maxRetriesPerRequest: 1,
        });
        client.on('error', (e) => logger.error(`redis error: ${e.message}`));
        return client;
      },
    },
  ],
  exports: [REDIS],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  async onApplicationShutdown() {
    await this.redis.quit();
  }
}
