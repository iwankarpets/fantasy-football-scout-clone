import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { AccessDeniedException } from '@app/common'; // TODO: поправьте путь под ваш алиас libs

/** Проверяет служебный ключ в заголовке x-internal-key. Пустой ключ в конфиге = всё закрыто. */
@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  private readonly expected: Buffer;

  constructor(config: ConfigService) {
    this.expected = Buffer.from(config.get<string>('internalApiKey') ?? '');
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    const header = req.headers['x-internal-key'];
    const provided = Buffer.from(typeof header === 'string' ? header : '');

    const ok =
      this.expected.length > 0 &&
      provided.length === this.expected.length &&
      timingSafeEqual(provided, this.expected);

    if (!ok) throw new AccessDeniedException('Invalid internal API key');
    return true;
  }
}
