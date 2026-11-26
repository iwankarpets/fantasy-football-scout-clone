import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsView, StartUserInput, StartUserResult } from './user-api.interfaces';
import { WatchlistChange, WatchlistItem } from '../analytics-api/analytics-api.types';

export type UpdateSettingsInput = Partial<SettingsView>;

const TIMEOUT_MS = 3000;

@Injectable()
export class UserApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>('userService.baseUrl');
    this.apiKey = config.getOrThrow<string>('internalApiKey');
  }

  /** Находит или создаёт пользователя по telegram_id. Бросает ошибку, если сервис недоступен или вернул не 2xx. */
  async start(input: StartUserInput): Promise<StartUserResult> {
    return this.request<StartUserResult>('POST', '/internal/users/start', input);
  }

  async getSettings(userId: string): Promise<SettingsView> {
    return this.request<SettingsView>('GET', `/internal/users/${userId}/settings`);
  }

  /** Частичное обновление: передаются только изменяемые поля. Возвращает настройки целиком. */
  async updateSettings(userId: string, patch: UpdateSettingsInput): Promise<SettingsView> {
    return this.request<SettingsView>('PATCH', `/internal/users/${userId}/settings`, patch);
  }

  getWatchlist(userId: string): Promise<WatchlistItem[]> {
    return this.request('GET', `/internal/users/${userId}/watchlist`);
  }
  addToWatchlist(userId: string, playerId: number): Promise<WatchlistChange> {
    return this.request('PUT', `/internal/users/${userId}/watchlist/${playerId}`);
  }
  removeFromWatchlist(userId: string, playerId: number): Promise<WatchlistChange> {
    return this.request('DELETE', `/internal/users/${userId}/watchlist/${playerId}`);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        'x-internal-key': this.apiKey,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      throw new Error(`user-service responded ${res.status} on ${method} ${path}`);
    }
    return (await res.json()) as T;
  }
}

export { SettingsView };
