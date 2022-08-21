import * as path from 'path';
import _ from 'lodash';
import { exportData } from './utils';
import { getAbilitiesIndexData } from './export/abilities';

export class MergeData {
  natures?: object[];
  abilities: { slug: string }[] = [];
  games?: object[];
  pokedex: { slug: string; games: Set<string> }[] = [];

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

  // console.log('- types'); // TODO merge types
  // 1, 2-5, 6+

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
