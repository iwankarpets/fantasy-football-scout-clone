import { Bot } from 'grammy';

export const BOT_COMMANDS = Symbol('BOT_COMMANDS');

export interface BotCommand {
  readonly name: string;
  readonly description: string;
  readonly inMenu: boolean;
  register(bot: Bot): void;
}