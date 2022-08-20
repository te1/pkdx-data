import * as path from 'path';
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
  pokedex = new Map<string, DataByGens>();

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

  addPokedexData(slug: string, gen: GenerationNum, data: object) {
    const gens = this.pokedex.get(slug) ?? {};
    gens[gen] = data;
    this.pokedex.set(slug, gens);
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
