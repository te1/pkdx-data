import * as fs from 'fs-extra';
import { PokemonMap } from './utils';
import { getShowdownData } from './showdown';
import { exportMergedData, MergeData } from './merge';
import { exportTypes } from './export/types';
import { exportNatures } from './export/natures';
import { exportItems } from './export/items';
import { exportPokemon, SpeciesMap } from './export/pokemon';
import { exportMoves } from './export/moves';
import { exportAbilities } from './export/abilities';
import { exportGames } from './export/games';
import { exportPokedex } from './export/pokedex';
import { exportGen9Placeholder } from './export/gen9';

const target = './generated/';

async function main() {
  try {
    const showdownData = await getShowdownData();
    const mergeData = new MergeData();

    await fs.emptyDir(target);

    for (const genData of showdownData) {
      const speciesMap = new SpeciesMap(); // conversion between showdown name/id and slug
      const moveMap: PokemonMap = new Map(); // remember pokemon that can learn a move
      const abilityMap: PokemonMap = new Map(); // remember pokemon that can have an ability

      console.log(`*** gen ${genData.genNum} ***`);

      await exportTypes(genData.gen, target, mergeData);
      await exportNatures(genData.gen, target, mergeData);
      await exportItems(genData.gen, target);
      await exportPokemon(
        genData.gen,
        genData.simGen,
        genData.genBdsp,
        genData.simGenBdsp,
        target,
        speciesMap,
        moveMap,
        abilityMap
      );
      await exportMoves(genData.gen, target, speciesMap, moveMap);
      await exportAbilities(genData.gen, target, mergeData, abilityMap);
      await exportGames(genData.gen, target, mergeData);
      await exportPokedex(genData.gen, target, mergeData, speciesMap);

      // TODO export HM/TM/TR
      // TODO maybe handle gen8 la (remaining learnsets, moves)

      console.log('');
    }

    await exportGen9Placeholder(target, mergeData);
    await exportMergedData(target, mergeData);

    console.log('done');
  } catch (err) {
    console.error(err);
  }
}

main();
