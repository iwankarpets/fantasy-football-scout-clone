import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PlayerSearchItemDto } from './dto/player-search-item.dto';
import { PlayerTopItemDto, Position, TopMetric } from './top-metrics';

@Injectable()
export class PlayersRepository {
  constructor(private readonly ds: DataSource) {}

  /**
   * Подходит игрок, если запрос похож на имя (триграммы), похож на отдельное
   * слово имени или входит в него как подстрока. Лучшие совпадения первыми,
   * при равенстве выше тот, у кого больше очков.
   * Спецсимволы LIKE в запросе экранируются, чтобы «%» не искал всех.
   */
  search(term: string, limit: number): Promise<PlayerSearchItemDto[]> {
    return this.ds.query(
      String.raw`
        WITH q AS (
          SELECT s.t AS term,
                 replace(replace(replace(s.t, '\', '\\'), '%', '\%'), '_', '\_') AS like_term
          FROM (SELECT f_unaccent(lower($1)) AS t) s
        )
        SELECT p.id, p.web_name, p.first_name, p.second_name,
               p.team AS team_id, t.short_name AS team_short_name,
               et.singular_name_short AS position,
               p.now_cost, p.status
        FROM players_read p
        CROSS JOIN q
        JOIN teams_read t ON t.id = p.team
        JOIN element_types_read et ON et.id = p.element_type
        WHERE p.search_name % q.term
           OR q.term <% p.search_name
           OR p.search_name LIKE '%' || q.like_term || '%'
        ORDER BY GREATEST(similarity(p.search_name, q.term),
                          word_similarity(q.term, p.search_name)) DESC,
                 p.total_points DESC
        LIMIT $2
      `,
      [term, limit],
    );
  }

  async latestGameweek(): Promise<number | null> {
    const rows = await this.ds.query('SELECT MAX(as_of_gameweek) AS gw FROM player_metrics');
    return rows[0]?.gw ?? null;
  }

  /** metric подставляется в SQL, поэтому сюда попадает только значение из белого списка TOP_METRICS. */
  top(
    metric: TopMetric,
    position: Position | undefined,
    limit: number,
    gameweek: number,
  ): Promise<PlayerTopItemDto[]> {
    return this.ds.query(
      `SELECT p.id, p.web_name,
            p.team AS team_id, t.short_name AS team_short_name,
            et.singular_name_short AS position,
            p.now_cost, p.status,
            m.as_of_gameweek,
            m.${metric}::float8 AS value,
            m.score::float8 AS score,
            m.position_rank
       FROM player_metrics m
       JOIN players_read p ON p.id = m.player_id
       JOIN teams_read t ON t.id = p.team
       JOIN element_types_read et ON et.id = p.element_type
      WHERE m.as_of_gameweek = $1
        AND ($2::text IS NULL OR et.singular_name_short = $2)
        AND p.status <> 'u'
        AND m.${metric} IS NOT NULL
      ORDER BY m.${metric} DESC, p.id
      LIMIT $3`,
      [gameweek, position ?? null, limit],
    );
  }
}
