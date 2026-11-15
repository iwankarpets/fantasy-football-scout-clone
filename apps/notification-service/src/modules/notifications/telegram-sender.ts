import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Api } from 'grammy';

/** Только отправка. Приём сообщений остаётся в BotService, конфликта long polling нет. */
@Injectable()
export class TelegramSender {
  private readonly api: Api;

  constructor(config: ConfigService) {
    this.api = new Api(config.getOrThrow<string>('bot.token'));
  }

  async send(chatId: number, text: string): Promise<void> {
    await this.api.sendMessage(chatId, text);
  }
}
