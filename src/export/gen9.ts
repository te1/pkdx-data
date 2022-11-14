import * as path from 'path';
import * as fs from 'fs-extra';
import { Generation } from '@pkmn/data';
import { exportData, PokemonMap } from '../utils';
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

  const moveMap: PokemonMap = new Map(); // remember pokemon that can learn a move

  await exportPokemon(fakeGen, target, moveMap);
  await exportMoves(fakeGen, target, moveMap);
  await exportGames(fakeGen, target, mergeData);
  await exportPokedex(fakeGen, target, mergeData);

  console.log('');
}

async function exportPokemon(
  gen: Generation,
  target: string,
  moveMap: PokemonMap
) {
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
      // remember available moves per pokemon for later use
      if (entry.learnset) {
        for (const moveSlug of Object.keys(entry.learnset)) {
          const pokemon = moveMap.get(moveSlug) ?? new Set<string>();

          pokemon.add(entry.slug);

          moveMap.set(moveSlug, pokemon);
        }
      }

      entry.flavorText = flavorTextPokemon[entry.slug];

      await exportData(
        path.join(target, `gen${gen.num}`, 'pokemon', entry.slug + '.json'),
        entry
      );
    }
  }
}

async function exportMoves(
  gen: Generation,
  target: string,
  moveMap: PokemonMap
) {
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
      entry.pokemon = moveMap.get(entry.slug);

      await exportData(
        path.join(target, `gen${gen.num}`, 'moves', entry.slug + '.json'),
        entry
      );
    }
  }
}
