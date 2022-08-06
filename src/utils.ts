import * as fs from 'fs-extra';

export const config = {
  prettyPrintJson: true,
};

export async function exportData(file: string, data: object) {
  const spaces = config.prettyPrintJson ? 2 : 0;

  return await fs.outputJson(file, data, { spaces });
}
