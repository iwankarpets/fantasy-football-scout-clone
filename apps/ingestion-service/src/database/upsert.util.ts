import { ObjectLiteral, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

/**
 * Upsert пачками: у Postgres лимит 65535 параметров на запрос,
 * а в players около 35 колонок.
 */
export async function upsertInChunks<T extends ObjectLiteral>(
  repo: Repository<T>,
  rows: T[],
  conflictPaths: string[],
  chunkSize = 200,
): Promise<number> {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize) as unknown as QueryDeepPartialEntity<T>[];
    await repo.upsert(chunk, conflictPaths);
  }
  return rows.length;
}
