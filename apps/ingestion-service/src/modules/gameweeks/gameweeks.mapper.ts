import { Gameweek } from '../../database/entities/gameweek.entity';
import { ApiGameweek } from '../../clients/fpl-api/schemas/bootstrap-static.schema';
import { toDate } from '../../utils/parse';

export function mapGameweek(api: ApiGameweek, now: Date): Gameweek {
  return {
    id: api.id, // номер тура = id
    name: api.name,
    deadline_time: toDate(api.deadline_time) ?? new Date(api.deadline_time_epoch * 1000),
    deadline_time_epoch: api.deadline_time_epoch,
    finished: api.finished,
    data_checked: api.data_checked,
    is_previous: api.is_previous,
    is_current: api.is_current,
    is_next: api.is_next,
    release_time: toDate(api.release_time),
    average_entry_score: api.average_entry_score ?? null,
    highest_score: api.highest_score ?? null,
    top_element: api.top_element ?? null,
    most_selected: api.most_selected ?? null,
    most_transferred_in: api.most_transferred_in ?? null,
    most_captained: api.most_captained ?? null,
    most_vice_captained: api.most_vice_captained ?? null,
    raw: api,
    updated_at: now,
  };
}