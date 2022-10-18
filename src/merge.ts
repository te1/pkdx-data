import * as path from 'path';
import _ from 'lodash';
import { exportData } from './utils';
import { getAbilitiesIndexData } from './export/abilities';

interface MergeTypeData {
  typeSets: { gens: number[]; types: object[] }[];
  categories?: object[];
}

export class MergeData {
  types: MergeTypeData = {
    typeSets: [],
    categories: undefined,
  };
  natures?: object[];
  abilities: { slug: string }[] = [];
  games?: object[];
  pokedex: { slug: string; games: Set<string> }[] = [];

  addTypeData(genNum: number, data: { types: object[]; categories: object[] }) {
    if (genNum === 1) {
      this.types.typeSets.push({
        gens: [1],
        types: data.types,
      });
    }

    // gen2 added dark and steel
    if (genNum === 2) {
      this.types.typeSets.push({
        gens: [2, 3, 4, 5],
        types: data.types,
      });
    }

    // gen6 added fairy
    if (genNum === 6) {
      this.types.typeSets.push({
        gens: [6, 7, 8, 9],
        types: data.types,
      });
    }

    if (genNum === 1) {
      this.types.categories = data.categories;
    }
  }

  addAbilityData(data: { slug: string }) {
    const index = _.findIndex(this.abilities, { slug: data.slug });

    if (index < 0) {
      this.abilities.push(data);
    }
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

  console.log('- types');
  if (mergeData.types.typeSets.length || mergeData.types.categories?.length) {
    console.log(
      `\twriting ${mergeData.types.typeSets.length} type sets and ${mergeData.types.categories?.length} categories...`
    );
    await exportData(
      path.join(target, 'merged', 'types.json'),
      mergeData.types
    );
  }

  console.log('- natures');
  if (mergeData.natures?.length) {
    console.log(`\twriting ${mergeData.natures.length} natures...`);
    await exportData(
      path.join(target, 'merged', 'natures.json'),
      mergeData.natures
    );
  }

  console.log('- abilities');
  if (mergeData.abilities.length) {
    mergeData.abilities = _.sortBy(mergeData.abilities, 'slug');

    console.log(`\twriting ${mergeData.abilities.length} abilities...`);
    await exportData(
      path.join(target, 'merged', 'abilities.json'),
      getAbilitiesIndexData(mergeData.abilities)
    );
  }

  console.log('- games');
  if (mergeData.games?.length) {
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
