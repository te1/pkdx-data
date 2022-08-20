import * as path from 'path';
import _ from 'lodash';
import { GenerationNum as OriginalGenerationNum } from '@pkmn/data';
import { exportData } from './utils';

type GenerationNum = OriginalGenerationNum | 9;

type DataByGens = {
  [gen in GenerationNum]?: object;
};

export class MergeData {
  pokemon: { slug: string }[] = [];
  moves = new Map<string, DataByGens>();
  abilities = new Map<string, DataByGens>();
  games?: object[];
  pokedex: { slug: string; games: Set<string> }[] = [];

  addPokemonData(gen: GenerationNum, data: { slug: string }) {
    const index = _.findIndex(this.pokemon, { slug: data.slug });

    if (index < 0) {
      this.pokemon.push(data);
    } else {
      this.pokemon[index] = data;
    }
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

  // console.log('- pokemon'); // TODO merge pokemon
  // if (mergeData.pokemon.length) {
  //   console.log(`\twriting ${mergeData.pokemon.length} pokemon details...`);
  //   for (const entry of mergeData.pokemon) {
  //     await exportData(
  //       path.join(target, 'merged', 'pokemon', entry.slug + '.json'),
  //       entry
  //     );
  //   }
  // }

  // console.log('- moves'); // TODO merge moves
  // console.log('- abilities'); // TODO merge abilities

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

    for (const entry of mergeData.pokedex) {
      await exportData(
        path.join(target, 'merged', 'pokedex', entry.slug + '.json'),
        entry
      );
    }
  }

  console.log('');
}
