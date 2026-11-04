import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';
import { MESSAGING_OPTIONS, MessagingOptions } from './messaging.options';
import { RabbitService } from './rabbit.service';

export interface MessagingAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  useFactory: (...args: any[]) => MessagingOptions | Promise<MessagingOptions>;
}

@Module({})
export class MessagingModule {
  static forRootAsync(opts: MessagingAsyncOptions): DynamicModule {
    return {
      module: MessagingModule,
      global: true,
      imports: opts.imports ?? [],
      providers: [
        { provide: MESSAGING_OPTIONS, inject: opts.inject ?? [], useFactory: opts.useFactory },
        RabbitService,
      ],
      exports: [RabbitService],
    };
  }
}