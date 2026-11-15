import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

@Injectable()
export class WatchRefsRepository {
  async add(userId: string, playerId: number, m: EntityManager): Promise<void> {
    await m.query(
      `INSERT INTO watch_refs (user_id, player_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, playerId],
    );
  }

  async remove(userId: string, playerId: number, m: EntityManager): Promise<void> {
    await m.query(`DELETE FROM watch_refs WHERE user_id = $1 AND player_id = $2`, [
      userId,
      playerId,
    ]);
  }
}
