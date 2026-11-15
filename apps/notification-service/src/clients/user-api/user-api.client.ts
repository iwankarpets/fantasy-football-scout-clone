import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface StartUserInput {
  telegram_id: number;
  username: string | null;
  language: string | null;
}

export interface StartUserResult {
  user: {
    id: string;
    telegram_id: number;
    username: string | null;
    language: string;
    timezone: string;
  };
  created: boolean;
}

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
    const res = await fetch(`${this.baseUrl}/internal/users/start`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-internal-key': this.apiKey,
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      throw new Error(`user-service responded ${res.status}`);
    }
    return (await res.json()) as StartUserResult;
  }
}
