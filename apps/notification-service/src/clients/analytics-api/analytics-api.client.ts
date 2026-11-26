import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PlayerSearchItem,
  PlayerTopResponse,
  TeamDifficultyItem,
  TopMetric,
  TopPosition,
} from './analytics-api.types';

// тот же заголовок, что у UserApiClient
export const INTERNAL_KEY_HEADER = 'x-internal-key';
const REQUEST_TIMEOUT_MS = 5000;

/** Сеть, таймаут или 5xx: сервис недоступен, можно ответить «попробуйте позже». */
export class AnalyticsUnavailableError extends Error {}
/** 4xx: запрос составлен неверно, это ошибка нашего кода. */
export class AnalyticsRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

@Injectable()
export class AnalyticsApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>('analyticsService.baseUrl');
    this.apiKey = config.getOrThrow<string>('internalApiKey');
  }

  search(q: string, limit?: number): Promise<PlayerSearchItem[]> {
    return this.get('/players/search', { q, limit });
  }

  top(params: {
    metric?: TopMetric;
    position?: TopPosition;
    limit?: number;
    gameweek?: number;
  }): Promise<PlayerTopResponse> {
    return this.get('/players/top', params);
  }

  fixtureDifficulty(horizon?: number): Promise<TeamDifficultyItem[]> {
    return this.get('/fixtures/difficulty', { horizon });
  }

  playersByIds(ids: number[]): Promise<PlayerSearchItem[]> {
    return this.get('/players/by-ids', { ids: ids.join(',') });
  }

  private async get<T>(
    path: string,
    query: Record<string, string | number | undefined> = {},
  ): Promise<T> {
    const url = new URL(path, this.baseUrl);
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) {
        url.searchParams.set(k, String(v));
      }
    }

    let res: Response;
    try {
      res = await fetch(url, {
        headers: { [INTERNAL_KEY_HEADER]: this.apiKey, accept: 'application/json' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (e) {
      throw new AnalyticsUnavailableError(`analytics unreachable: ${(e as Error).message}`);
    }

    if (res.status >= 500) {
      throw new AnalyticsUnavailableError(`analytics responded ${res.status}`);
    }
    if (!res.ok) {
      throw new AnalyticsRequestError(
        `analytics responded ${res.status}: ${await res.text()}`,
        res.status,
      );
    }
    return (await res.json()) as T;
  }
}
