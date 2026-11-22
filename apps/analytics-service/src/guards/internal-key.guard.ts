import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { AccessDeniedException } from '@app/common'; // TODO: поправьте путь под ваш алиас libs

/** Проверяет служебный ключ в заголовке x-internal-key. Пустой ключ в конфиге = всё закрыто. */
@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  private readonly expectedKey: Buffer;

  constructor(config: ConfigService) {
    this.expectedKey = Buffer.from(config.get<string>('internalApiKey') ?? '');
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    const header = req.headers['x-internal-key'];
    const provided = Buffer.from(typeof header === 'string' ? header : '');

    const ok =
      this.expectedKey.length > 0 &&
      provided.length === this.expectedKey.length &&
      timingSafeEqual(provided, this.expectedKey);

    if (!ok) {
      throw new AccessDeniedException('Invalid internal API key');
    }
    return true;
  }
}
