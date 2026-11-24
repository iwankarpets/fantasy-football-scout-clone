import { FixtureLite, GameweekLite, TeamDifficultyRow } from './team-difficulty.interfaces';

/** Горизонты календаря сложности: ближайшие 3 и 5 туров. */
export const DIFFICULTY_HORIZONS = [3, 5] as const;

const round2 = (x: number): number => Math.round(x * 100) / 100;

/**
 * Окно: horizon туров, начиная с первого незавершённого. Считаются только
 * существующие туры (за 38-м туром «пустых» туров нет) и только несыгранные
 * матчи с известным туром. Сложность берётся из FPL для самой команды:
 * team_h_difficulty для хозяев, team_a_difficulty для гостей.
 */
export function computeTeamDifficulty(input: {
  teamIds: readonly number[];
  gameweeks: readonly GameweekLite[];
  fixtures: readonly FixtureLite[];
  horizons?: readonly number[];
}): TeamDifficultyRow[] {
  const { teamIds, gameweeks, fixtures } = input;
  const horizons = input.horizons ?? DIFFICULTY_HORIZONS;

  const unfinished = gameweeks
    .filter((gameweek) => gameweek.finished !== true)
    .map((gameweek) => gameweek.id);
  if (unfinished.length === 0) {
    return []; // сезон завершён
  }
  const start = Math.min(...unfinished);

  const upcoming = fixtures.filter(
    (fixtures) =>
      fixtures.event !== null &&
      fixtures.finished !== true &&
      fixtures.finished_provisional !== true,
  );

  const rows: TeamDifficultyRow[] = [];
  for (const horizon of horizons) {
    const window = gameweeks.map((g) => g.id).filter((id) => id >= start && id < start + horizon);
    const inWindow = new Set(window);

    for (const teamId of teamIds) {
      const perGw = new Map<number, number>(window.map((gw) => [gw, 0]));
      let sum = 0;
      let rated = 0;
      let matches = 0;

      for (const f of upcoming) {
        if (!inWindow.has(f.event as number)) {
          continue;
        }
        const isHome = f.team_h === teamId;
        if (!isHome && f.team_a !== teamId) {
          continue;
        }

        matches += 1;
        perGw.set(f.event as number, (perGw.get(f.event as number) ?? 0) + 1);
        const d = isHome ? f.team_h_difficulty : f.team_a_difficulty;
        if (d !== null) {
          sum += d;
          rated += 1;
        }
      }

      const counts = [...perGw.values()];
      rows.push({
        team_id: teamId,
        as_of_gameweek: start,
        horizon,
        difficulty: rated > 0 ? round2(sum / rated) : null,
        matches_count: matches,
        has_double: counts.some((n) => n > 1),
        has_blank: counts.some((n) => n === 0),
      });
    }
  }
  return rows;
}
