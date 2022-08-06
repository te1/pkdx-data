import * as fs from 'fs-extra';
import { MoveCategory, TypeName } from '@pkmn/dex';

export const config = {
  prettyPrintJson: true,
};

export async function exportData(file: string, data: object) {
  const spaces = config.prettyPrintJson ? 2 : 0;

  return await fs.outputJson(file, data, { spaces });
}

export function typeNameToSlug(type: TypeName) {
  return type.toLowerCase();
}

export function moveCategoryToSlug(category: MoveCategory) {
  return category.toLowerCase();
}
