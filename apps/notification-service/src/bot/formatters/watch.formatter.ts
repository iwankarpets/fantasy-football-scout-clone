import { PlayerSearchItem } from '../../clients/analytics-api/analytics-api.types';

/** a: играет, d: сомнителен, i/s/u: не сыграет. */
function statusSuffix(status: string): string {
  if (status === 'd') {
    return ' ⚠';
  }
  if (status === 'i' || status === 's' || status === 'u') {
    return ' ✖';
  }
  return '';
}

/** «Salah · LIV MID 12.8 ⚠»: подходит и для текста, и для кнопки. */
export function playerLabel(p: PlayerSearchItem): string {
  return `${p.web_name} · ${p.team_short_name} ${p.position} ${(p.now_cost / 10).toFixed(1)}${statusSuffix(p.status)}`;
}
