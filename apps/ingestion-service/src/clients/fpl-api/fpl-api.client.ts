import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AppException,
  UpstreamBadResponseException,
  UpstreamUnavailableException,
} from '@app/common'; // TODO: поправьте путь под ваш алиас libs
import { bootstrapStaticSchema, BootstrapStatic } from './schemas/bootstrap-static.schema';

export interface FplResponse<T> {
  data: T;
  /** sha256 сырого ответа: по нему можно пропустить неизменившийся ответ */
  hash: string;
}

const SERVICE = 'FPL API';
const MAX_ATTEMPTS = 4;
const TIMEOUT_MS = 15_000;
const BACKOFF_BASE_MS = 1_000;

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Единственное место вызова FPL API: таймаут, повторы с нарастающей паузой,
 * проверка формата ответа.
 *
 * Ошибки:
 *  - UpstreamUnavailableException: FPL недоступен (сеть, таймаут, 429/5xx после всех повторов)
 *  - UpstreamBadResponseException: FPL ответил, но не JSON, не тот формат или 4xx
 */
@Injectable()
export class FplApiClient {
  private readonly logger = new Logger(FplApiClient.name);
  private readonly baseUrl: string;
  readonly requestDelayMs: number;

  constructor(config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>('fpl.baseUrl');
    this.requestDelayMs = config.getOrThrow<number>('fpl.requestDelayMs');
  }

  async getBootstrapStatic(): Promise<FplResponse<BootstrapStatic>> {
    const { text, hash } = await this.getText('/bootstrap-static/');

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch (cause) {
      throw new UpstreamBadResponseException(SERVICE, 'bootstrap-static: ответ не является JSON', cause);
    }

    const parsed = bootstrapStaticSchema.safeParse(json);
    if (!parsed.success) {
      const details = parsed.error.issues
        .slice(0, 5)
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      throw new UpstreamBadResponseException(SERVICE, `bootstrap-static: неожиданный формат (${details})`);
    }
    return { data: parsed.data, hash };
  }

  // TODO: getFixtures(), getElementSummary(id)

  /** GET с повторами на 429, 5xx, таймаут и сетевые ошибки. */
  private async getText(path: string): Promise<{ text: string; hash: string }> {
    const url = `${this.baseUrl}${path}`;
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'fantasy-scout/1.0', Accept: 'application/json' },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });

        if (res.ok) {
          const text = await res.text();
          return { text, hash: createHash('sha256').update(text).digest('hex') };
        }

        const retryable = res.status === 429 || res.status >= 500;
        if (!retryable) {
          // 4xx кроме 429: повтор не поможет
          throw new UpstreamBadResponseException(SERVICE, `GET ${path}: HTTP ${res.status}`);
        }
        lastError = new Error(`HTTP ${res.status}`);
      } catch (e) {
        if (e instanceof AppException) throw e;
        lastError = e; // таймаут или сетевая ошибка
      }

      if (attempt < MAX_ATTEMPTS) {
        const delay = BACKOFF_BASE_MS * 2 ** (attempt - 1);
        this.logger.warn(`GET ${path}: попытка ${attempt}/${MAX_ATTEMPTS} не удалась, повтор через ${delay} мс`);
        await sleep(delay);
      }
    }
    throw new UpstreamUnavailableException(SERVICE, lastError);
  }
}
