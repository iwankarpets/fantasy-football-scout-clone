import { AppLogger } from "./app-logger";

export function createLogger(service: string): AppLogger {
  const logger = new AppLogger(service);

  process.on('unhandledRejection', (reason) => {
    logger.error(reason instanceof Error ? reason : new Error(String(reason)), 'unhandledRejection');
  });

  process.on('uncaughtException', (err) => {
    logger.fatal(err, 'uncaughtException');
    process.exit(1);
  });

  return logger;
}