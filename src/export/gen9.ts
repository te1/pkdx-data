import * as path from 'path';
import * as fs from 'fs-extra';
import { Generation } from '@pkmn/data';
import { exportData } from '../utils';
import { MergeData } from '../merge';
import { getSpeciesIndexData } from './pokemon';
import { exportGames } from './games';
import { exportPokedex } from './pokedex';

const fakeGen = {
  num: 9,
} as unknown as Generation;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let extraData: any;

export async function exportGen9Placeholder(
  target: string,
  mergeData: MergeData
) {
  console.log(`*** gen 9 (placeholder data) ***`);

  await exportPokemon(fakeGen, target);
  await exportGames(fakeGen, target, mergeData);
  await exportPokedex(fakeGen, target, mergeData);

  console.log('');
}

async function exportPokemon(gen: Generation, target: string) {
  console.log('- pokemon');

  if (!extraData) {
    console.log('\tloading data...');
    extraData = await fs.readJson('./data/pokemon-gen9.json');
  }

  const result = extraData;

  if (result.length) {
    console.log(`\twriting ${result.length} pokemon...`);
    await exportData(
      path.join(target, `gen${gen.num}`, 'pokemon.json'),
      getSpeciesIndexData(result)
    );

    console.log(`\twriting ${result.length} pokemon details...`);
    for (const entry of result) {
      await exportData(
        path.join(target, `gen${gen.num}`, 'pokemon', entry.slug + '.json'),
        entry
      );
    }
  }
}
