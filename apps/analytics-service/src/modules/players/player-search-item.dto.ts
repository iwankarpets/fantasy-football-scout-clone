export interface PlayerSearchItemDto {
  id: number;
  web_name: string;
  first_name: string;
  second_name: string;
  team_id: number;
  team_short_name: string;
  /** GKP / DEF / MID / FWD */
  position: string;
  /** В десятых: 61 = 6.1 */
  now_cost: number;
  status: string;
}
