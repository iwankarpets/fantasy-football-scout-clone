import { LoggerService } from '@nestjs/common';
import { getCorrelationId } from './correlation';

type Level = 'fatal' | 'error' | 'warn' | 'log' | 'debug' | 'verbose';

const ORDER: Level[] = ['fatal', 'error', 'warn', 'log', 'debug', 'verbose'];

/**
 * Общий логгер для всех сервисов.
 * dev: читаемый текст; production (NODE_ENV=production): одна JSON-строка на запись.
 * Уровень задаётся переменной LOG_LEVEL (по умолчанию debug в dev, log в production).
 */
export class AppLogger implements LoggerService {
  private readonly json = process.env.NODE_ENV === 'production';
  private readonly maxLevel: number;

  constructor(private readonly service: string) {
    const fallback: Level = this.json ? 'log' : 'debug';
    const wanted = (process.env.LOG_LEVEL as Level) ?? fallback;
    const idx = ORDER.indexOf(wanted);
    this.maxLevel = idx === -1 ? ORDER.indexOf(fallback) : idx;
  }

  log(message: unknown, ...params: unknown[]) { this.write('log', message, params); }
  warn(message: unknown, ...params: unknown[]) { this.write('warn', message, params); }
  debug(message: unknown, ...params: unknown[]) { this.write('debug', message, params); }
  verbose(message: unknown, ...params: unknown[]) { this.write('verbose', message, params); }
  error(message: unknown, ...params: unknown[]) { this.write('error', message, params); }
  fatal(message: unknown, ...params: unknown[]) { this.write('fatal', message, params); }

  private write(level: Level, message: unknown, params: unknown[]) {
    if (ORDER.indexOf(level) > this.maxLevel) return;

    // Nest передаёт контекст последним строковым аргументом,
    // а для error() ещё и stack перед ним: error(msg, stack, context)
    let context: string | undefined;
    let stack: string | undefined;
    const rest = [...params];
    if (typeof rest[rest.length - 1] === 'string') context = rest.pop() as string;
    if (typeof rest[0] === 'string' && (level === 'error' || level === 'fatal')) {
      stack = rest.shift() as string;
    }

    let text: string;
    if (message instanceof Error) {
      text = message.message;
      stack = stack ?? message.stack;
    } else if (typeof message === 'object' && message !== null) {
      text = safeStringify(message);
    } else {
      text = String(message);
    }

    const entry = {
      time: new Date().toISOString(),
      level,
      service: this.service,
      context,
      correlationId: getCorrelationId(),
      message: text,
      stack,
    };

    const out = level === 'error' || level === 'fatal' ? process.stderr : process.stdout;
    if (this.json) {
      out.write(safeStringify(entry) + '\n');
    } else {
      const cid = entry.correlationId ? ` {${entry.correlationId.slice(0, 8)}}` : '';
      const ctx = context ? `/${context}` : '';
      out.write(
        `${entry.time} ${level.toUpperCase().padEnd(7)} [${this.service}${ctx}]${cid} ${text}\n` +
          (stack ? `${stack}\n` : ''),
      );
    }
  }
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}