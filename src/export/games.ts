import * as path from 'path';
import * as fs from 'fs-extra';
import { Generation } from '@pkmn/data';
import { exportData } from '../utils';
import { MergeData } from '../merge';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let extraData: any;

export async function exportGames(gen: Generation, mergeData: MergeData) {
  console.log('- games');

  if (!extraData) {
    console.log('\tloading data...');
    extraData = await fs.readJson('./data/games.json');

    mergeData.games = extraData;
  }

  const result = [];

  for (const gameSet of extraData) {
    if (gameSet.gen !== gen.num) {
      continue;
    }

    result.push(gameSet);
  }

  if (result.length) {
    console.log(`\twriting ${result.length} games...`);
    await exportData(path.join(`gen${gen.num}`, 'games.json'), result);
  }
}
