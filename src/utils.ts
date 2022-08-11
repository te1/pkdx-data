import * as fs from 'fs-extra';
import { MoveCategory, TypeName } from '@pkmn/dex';

export type PokemonMap = Map<string, Set<string>>;

export const config = {
  prettyPrintJson: true,
};

function jsonReplacer(_key: string, value: unknown) {
  if (value instanceof Map) {
    return Array.from(value);
  }

  if (value instanceof Set) {
    return Array.from(value);
  }

  return value;
}

export async function exportData(file: string, data: object) {
  return await fs.outputJson(file, data, {
    spaces: config.prettyPrintJson ? 2 : 0,
    replacer: jsonReplacer,
  });
}

export function typeNameToSlug(type: TypeName) {
  return type.toLowerCase();
}

export function moveCategoryToSlug(category: MoveCategory) {
  return category.toLowerCase();
}
