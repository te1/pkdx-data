import * as path from 'path';
import * as fs from 'fs-extra';
import klaw from 'klaw-sync';
import { Generation } from '@pkmn/data';
import { SpeciesMap } from './pokemon';
import { extraData as games } from './games';
import { consoleLogMagenta, exportData } from '../utils';
import { MergeData } from '../merge';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let dexes: any;

export async function exportPokedex(
  gen: Generation,
  target: string,
  mergeData: MergeData,
  speciesMap?: SpeciesMap
) {
  console.log('- pokedex');

  if (!dexes) {
    console.log('\tloading data...');

    dexes = new Map<string, object>();

    for (const file of klaw(`./data/pokedex/`, { nodir: true })) {
      const dexSlug = path.basename(file.path, path.extname(file.path));
      const dexData = await fs.readJson(file.path);

      dexes.set(dexSlug, dexData);
    }
  }

  const result = new Map<string, object>();

  for (const gameSet of games) {
    if (gameSet.gen !== gen.num) {
      continue;
    }

    for (const dexSlug of gameSet.pokedex) {
      const dexData = dexes.get(dexSlug);

      if (!dexData) {
        consoleLogMagenta(`${dexSlug} has no data`);
        continue;
      }

      const games = new Set();

      for (const game of gameSet.games) {
        games.add(game.slug);
      }

      // check that pokemon in the dex are actually available in the data
      if (speciesMap) {
        for (const entry of dexData.data) {
          if (!speciesMap.has(entry.slug)) {
            consoleLogMagenta(
              `${dexSlug} contains ${entry.slug} but there is no data`
            );
          }
        }
      }

      result.set(dexSlug, {
        slug: dexSlug,
        name: dexData.name || undefined,
        games,
        ...dexData,
      });
    }
  }

  if (result.size) {
    console.log(`\twriting ${result.size} pokedexes...`);

    for (const [dexSlug, dexData] of result) {
      await exportData(
        path.join(target, `gen${gen.num}`, 'pokedex', dexSlug + '.json'),
        dexData
      );
    }
  }
}
