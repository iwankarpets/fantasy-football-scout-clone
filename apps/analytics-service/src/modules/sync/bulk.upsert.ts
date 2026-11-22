import { EntityManager } from 'typeorm';

/**
 * Описание таблицы для массовой записи: имя, колонки с типами и первичный ключ.
 * Значения подставляются в SQL строкой, поэтому приходят только из констант
 * в коде, но никогда из внешнего ввода.
 */
export interface TableSpec {
  table: string;
  /** Колонки в формате «имя тип». */
  columns: string[];
  /** Колонки первичного ключа (для ON CONFLICT). */
  pk: string[];
  /** Колонка, в которую пишется время записи. По умолчанию synced_at. */
  stampColumn?: string;
}

/**
 * Массовый upsert одним запросом. Строки передаются одним jsonb-параметром
 * и раскладываются через jsonb_to_recordset, поэтому лимит в 65535 параметров
 * Postgres не мешает, а числа и даты в строковом виде приводятся к типам колонок.
 *
 * Если в строке нет поля, которое колонка требует (NOT NULL), запрос упадёт:
 * это сигнал, что данные разошлись с таблицей.
 */
export async function bulkUpsert(
  manager: EntityManager,
  spec: TableSpec,
  rows: readonly object[],
): Promise<number> {
  if (rows.length === 0) {
    return 0;
  }

  const stamp = spec.stampColumn ?? 'synced_at';
  const names = spec.columns.map((c) => c.split(' ')[0]);
  const updatable = names.filter((n) => !spec.pk.includes(n));

  const sql = `
    INSERT INTO ${spec.table} (${names.join(', ')}, ${stamp})
    SELECT ${names.map((n) => `t.${n}`).join(', ')}, now()
    FROM jsonb_to_recordset($1::jsonb) AS t(${spec.columns.join(', ')})
    ON CONFLICT (${spec.pk.join(', ')}) DO UPDATE SET
      ${updatable.map((n) => `${n} = EXCLUDED.${n}`).join(',\n      ')},
      ${stamp} = now()
  `;

  await manager.query(sql, [JSON.stringify(rows)]);
  return rows.length;
}
