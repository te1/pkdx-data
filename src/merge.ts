import * as path from 'path';
import _ from 'lodash';
import { GenerationNum as OriginalGenerationNum } from '@pkmn/data';
import { exportData } from './utils';

type GenerationNum = OriginalGenerationNum | 9;

type DataByGens = {
  [gen in GenerationNum]?: object;
};

export class MergeData {
  pokemon = new Map<string, DataByGens>();
  moves = new Map<string, DataByGens>();
  abilities = new Map<string, DataByGens>();
  games?: object[];
  pokedex: { slug: string; games: Set<string> }[] = [];

  addPokemonData(slug: string, gen: GenerationNum, data: object) {
    const gens = this.pokemon.get(slug) ?? {};
    gens[gen] = data;
    this.pokemon.set(slug, gens);
  }

  addMoveData(slug: string, gen: GenerationNum, data: object) {
    const gens = this.moves.get(slug) ?? {};
    gens[gen] = data;
    this.moves.set(slug, gens);
  }

  addAbilityData(slug: string, gen: GenerationNum, data: object) {
    const gens = this.abilities.get(slug) ?? {};
    gens[gen] = data;
    this.abilities.set(slug, gens);
  }

  addPokedexData(data: { slug: string; games: Set<string> }) {
    const index = _.findIndex(this.pokedex, { slug: data.slug });

    if (index < 0) {
      this.pokedex.push(data);
    } else {
      this.pokedex[index].games = new Set([
        ...this.pokedex[index].games,
        ...data.games,
      ]);
    }
  }
}

export async function exportMergedData(target: string, mergeData: MergeData) {
  console.log('*** merged ***');

  console.log('- pokemon');
  console.log('- moves');
  console.log('- abilities');

  console.log('- games');
  if (mergeData.games && mergeData.games.length) {
    console.log(`\twriting ${mergeData.games.length} games...`);
    await exportData(
      path.join(target, 'merged', 'games.json'),
      mergeData.games
    );
  }

  console.log('- pokedex');
  if (mergeData.pokedex.length) {
    console.log(`\twriting ${mergeData.pokedex.length} pokedexes...`);

    for (const dexData of mergeData.pokedex) {
      await exportData(
        path.join(target, 'merged', 'pokedex', dexData.slug + '.json'),
        dexData
      );
    }
  }

  // if (result.length) {
  //   console.log(`\twriting ${result.length} pokemon...`);
  //   await exportData(
  //     path.join(target, `gen${gen.num}`, 'pokemon.json'),
  //     getSpeciesIndexData(result)
  //   );

  //   console.log(`\twriting ${result.length} pokemon details...`);
  //   for (const entry of result) {
  //     await exportData(
  //       path.join(target, `gen${gen.num}`, 'pokemon', entry.slug + '.json'),
  //       entry
  //     );
  //   }
  // }

  console.log('');
}
