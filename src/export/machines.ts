import * as path from 'path';
import * as fs from 'fs-extra';
import klaw from 'klaw-sync';
import { Generation } from '@pkmn/data';
import { exportData } from '../utils';

export async function exportMachines(gen: Generation) {
  const sourceDir = `./data/machines/gen${gen.num}`;

  if (!fs.existsSync(sourceDir)) {
    return;
  }

  console.log('- machines');

  for (const file of klaw(sourceDir, { nodir: true })) {
    const dirName = path.basename(path.dirname(file.path));
    const fileName = path.basename(file.path, path.extname(file.path));
    const data = await fs.readJson(file.path);

    console.log(`\twriting ${data.length} ${fileName}s...`);
    await exportData(
      path.join(`gen${gen.num}/machines`, dirName, `${fileName}.json`),
      data
    );
  }
}
