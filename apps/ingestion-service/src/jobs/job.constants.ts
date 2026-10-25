export const INGESTION_QUEUE = 'ingestion';
 
/** Имена повторяющихся джобов (BullMQ). */
export enum JobName {
  SyncBootstrap = 'sync-bootstrap',
  SyncFixtures = 'sync-fixtures',
  SyncPlayerHistory = 'sync-player-history',
  DailySnapshot = 'daily-snapshot',
  DeadlineCheck = 'deadline-check',
}