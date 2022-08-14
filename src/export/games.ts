import * as path from 'path';
import * as fs from 'fs-extra';
// import _ from 'lodash';
import { Generation } from '@pkmn/data';
import { consoleLogMagenta, exportData } from '../utils';
import { SpeciesMap } from './pokemon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let extraData: any;

export async function exportGames(
  gen: Generation,
  speciesMap: SpeciesMap,
  target: string
) {
  console.log('- games');

  if (!extraData) {
    console.log('\tloading data...');
    extraData = await fs.readJson('./data/games.json');
  }

  const result = [];

  for (const gameSet of extraData) {
    if (gameSet.gen > gen.num) {
      continue;
    }

    for (const game of gameSet.games) {
      if (game.exclusive) {
        for (const slug of game.exclusive) {
          if (!speciesMap.has(slug)) {
            consoleLogMagenta(game.name, '-->', slug);
          }
        }
      }
    }

    result.push(gameSet);
  }

  if (result.length) {
    console.log(`\twriting ${result.length} games...`);
    await exportData(path.join(target, `gen${gen.num}`, 'games.json'), result);
  }
}
