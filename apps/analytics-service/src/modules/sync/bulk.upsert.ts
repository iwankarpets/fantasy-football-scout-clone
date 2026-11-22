import { EntityManager } from 'typeorm';
import { TableSpec } from './sync.tables';

/**
 * Массовый upsert одним запросом. Строки передаются одним jsonb-параметром
 * и раскладываются через jsonb_to_recordset, поэтому лимит в 65535 параметров
 * Postgres не мешает, а числа и даты в строковом виде приводятся к типам колонок.
 *
 * Если в строке нет поля, которое колонка требует (NOT NULL), запрос упадёт:
 * это сигнал, что контракт ответа Ingestion разошёлся с таблицей.
 */
export async function bulkUpsert(
  manager: EntityManager,
  spec: TableSpec,
  rows: readonly object[],
): Promise<number> {
  if (rows.length === 0) {
    return 0;
  }

  const names = spec.columns.map((column) => column.split(' ')[0]);
  const updatable = names.filter((name) => !spec.pk.includes(name));

  const sql = `
    INSERT INTO ${spec.table} (${names.join(', ')}, synced_at)
    SELECT ${names.map((name) => `t.${name}`).join(', ')}, now()
    FROM jsonb_to_recordset($1::jsonb) AS t(${spec.columns.join(', ')})
    ON CONFLICT (${spec.pk.join(', ')}) DO UPDATE SET
      ${updatable.map((name) => `${name} = EXCLUDED.${name}`).join(',\n      ')},
      synced_at = now()
  `;

  await manager.query(sql, [JSON.stringify(rows)]);
  return rows.length;
}
