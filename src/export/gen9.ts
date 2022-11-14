import * as path from 'path';
import * as fs from 'fs-extra';
import { Generation } from '@pkmn/data';
import { exportData } from '../utils';
import { MergeData } from '../merge';
import { getSpeciesIndexData } from './pokemon';
import { getMovesIndexData } from './moves';
import { exportGames } from './games';
import { exportPokedex } from './pokedex';

const fakeGen = {
  num: 9,
} as unknown as Generation;

export async function exportGen9Placeholder(
  target: string,
  mergeData: MergeData
) {
  console.log(`*** gen 9 (placeholder data) ***`);

  await exportPokemon(fakeGen, target);
  await exportMoves(fakeGen, target /* , speciesMap, moveMap */);
  await exportGames(fakeGen, target, mergeData);
  await exportPokedex(fakeGen, target, mergeData);

  console.log('');
}

async function exportPokemon(gen: Generation, target: string) {
  console.log('- pokemon');

  console.log('\tloading data...');
  const extraData = await fs.readJson('./data/dumps/gen9/sv/pokemon.json');
  const flavorTextPokemon = await fs.readJson(
    './data/flavorText/gen9/sv/pokedex.json'
  );

  const result = extraData;

  if (result.length) {
    console.log(`\twriting ${result.length} pokemon...`);
    await exportData(
      path.join(target, `gen${gen.num}`, 'pokemon.json'),
      getSpeciesIndexData(result)
    );

    console.log(`\twriting ${result.length} pokemon details...`);
    for (const entry of result) {
      entry.flavorText = flavorTextPokemon[entry.slug];

      await exportData(
        path.join(target, `gen${gen.num}`, 'pokemon', entry.slug + '.json'),
        entry
      );
    }
  }
}

async function exportMoves(gen: Generation, target: string) {
  console.log('- moves');

  console.log('\tloading data...');
  const extraData = await fs.readJson('./data/dumps/gen9/sv/moves.json');

  const result = extraData;

  if (result.length) {
    console.log(`\twriting ${result.length} moves...`);
    await exportData(
      path.join(target, `gen${gen.num}`, 'moves.json'),
      getMovesIndexData(result)
    );

    console.log(`\twriting ${result.length} moves details...`);
    for (const entry of result) {
      await exportData(
        path.join(target, `gen${gen.num}`, 'moves', entry.slug + '.json'),
        entry
      );
    }
  }
}
