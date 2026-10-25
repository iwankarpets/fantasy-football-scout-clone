import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Единственное место вызова FPL API.
 * Здесь будут: паузы между запросами, повторы, проверка формата ответа.
 */
@Injectable()
export class FplApiClient {
  private readonly baseUrl: string;
  readonly requestDelayMs: number;

  constructor(config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>('fpl.baseUrl');
    this.requestDelayMs = config.getOrThrow<number>('fpl.requestDelayMs');
  }

  // TODO: getBootstrapStatic(), getFixtures(), getElementSummary(id)
}