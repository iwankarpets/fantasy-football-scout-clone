import { ElementType } from '../../database/entities/element-type.entity';
import { ApiElementType } from '../../clients/fpl-api/schemas/bootstrap-static.schema';

export function mapElementType(api: ApiElementType, now: Date): ElementType {
  return {
    id: api.id,
    singular_name: api.singular_name,
    singular_name_short: api.singular_name_short,
    plural_name: api.plural_name,
    plural_name_short: api.plural_name_short,
    squad_select: api.squad_select,
    squad_min_play: api.squad_min_play,
    squad_max_play: api.squad_max_play,
    element_count: api.element_count,
    updated_at: now,
  };
}
