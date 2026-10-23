import { StartCommand } from './start.command';
import { TopCommand } from './top.command';
import { ReportCommand } from './report.command';
import { CompareCommand } from './compare.command';
import { WatchCommand } from './watch.command';
import { SettingsCommand } from './settings.command';

/** Новая команда: создайте класс и добавьте его сюда, больше нигде регистрировать не нужно */
export const COMMANDS = [
  StartCommand,
  TopCommand,
  ReportCommand,
  CompareCommand,
  WatchCommand,
  SettingsCommand,
];

export * from './bot-command.interface';