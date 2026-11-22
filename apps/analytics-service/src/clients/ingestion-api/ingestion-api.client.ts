import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IngestionRecord } from './ingestion-api.types';
import { IngestionApiError } from './ingestion-api.error';

/** Максимум туров за один запрос /internal/player-stats (лимит стороны Ingestion). */
export const MAX_ROUND_SPAN = 10;
const INTERNAL_API_KEY = 'x-internal-key';

@Injectable()
export class IngestionApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>('ingestion.baseUrl').replace(/\/$/, '');
    this.apiKey = config.getOrThrow<string>('internalApiKey');
  }

  elementTypes(): Promise<IngestionRecord[]> {
    return this.get('/internal/element-types');
  }

  teams(): Promise<IngestionRecord[]> {
    return this.get('/internal/teams');
  }

  gameweeks(): Promise<IngestionRecord[]> {
    return this.get('/internal/gameweeks');
  }

  players(): Promise<IngestionRecord[]> {
    return this.get('/internal/players');
  }

  fixtures(): Promise<IngestionRecord[]> {
    return this.get('/internal/fixtures');
  }

  playerStats(roundFrom: number, roundTo: number): Promise<IngestionRecord[]> {
    return this.get('/internal/player-stats', { round_from: roundFrom, round_to: roundTo }, 30_000);
  }

  private async get(
    path: string,
    query?: Record<string, string | number>,
    timeoutMs = 15_000,
  ): Promise<IngestionRecord[]> {
    const url = new URL(this.baseUrl + path);
    for (const [k, v] of Object.entries(query ?? {})) {
      url.searchParams.set(k, String(v));
    }

    let res: Response;
    try {
      res = await fetch(url, {
        headers: { 'x-internal-key': this.apiKey },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (e) {
      throw new IngestionApiError(`Ingestion ${path} unavailable: ${(e as Error).message}`);
    }

    if (!res.ok) {
      throw new IngestionApiError(`Ingestion ${path} responded ${res.status}`, res.status);
    }
    const body: unknown = await res.json();
    if (!Array.isArray(body)) {
      throw new IngestionApiError(`Ingestion ${path} returned a non-array body`);
    }
    return body as IngestionRecord[];
  }
}
