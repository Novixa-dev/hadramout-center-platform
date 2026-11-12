import type { CollectionConfig, Field } from 'payload';

export const STATUS_CELL = '/admin/components/StatusCell#StatusCell';

/**
 * Every collection's top-level `status` select shows as the site's chips in its list (src/admin/components/StatusCell.tsx).
 * Applied once over the whole config, so a new collection gets it without remembering to; a field with its own Cell keeps it.
 */
export function withStatusCells(collections: CollectionConfig[]): CollectionConfig[] {
  const wire = (field: Field): Field => {
    if (!('name' in field) || field.name !== 'status' || field.type !== 'select') return field;
    if (field.admin?.components?.Cell) return field;
    return { ...field, admin: { ...field.admin, components: { ...field.admin?.components, Cell: STATUS_CELL } } };
  };
  return collections.map((c) => ({ ...c, fields: c.fields.map(wire) }));
}
