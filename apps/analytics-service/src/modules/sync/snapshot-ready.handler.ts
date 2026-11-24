import { Injectable } from '@nestjs/common';
import { MetricsService } from '../metrics/metrics.service';
import { scopeFromUpdated, SyncService } from './sync.service';
import { TeamDifficultyService } from '../fixtures/team-difficulty.service';

/** Минимальный вид data события snapshot.ready (см. SnapshotReadyV1 в libs/contracts). */
export interface SnapshotReadyData {
  gameweek_number: number | null;
  updated: readonly string[];
  sync_run_id: number;
}

@Injectable()
export class SnapshotReadyHandler {
  constructor(
    private readonly sync: SyncService,
    private readonly metrics: MetricsService,
    private readonly difficulty: TeamDifficultyService,
  ) {}

  async apply(data: SnapshotReadyData): Promise<void> {
    const scope = scopeFromUpdated(data.updated);
    if (!scope.reference && !scope.history) {
      return;
    }
    await this.sync.run(scope);
    if (scope.reference) {
      await this.difficulty.recalculate(); // TeamDifficultyService
    }
    await this.metrics.recalculate();
  }
}
