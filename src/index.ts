import * as fs from 'fs-extra';
import { config, PokemonMap } from './utils';
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
import { exportMachines } from './export/machines';
import { exportGen9Placeholder } from './export/gen9';

async function main() {
  try {
    const showdownData = await getShowdownData();
    const mergeData = new MergeData();

    await fs.emptyDir(config.targetDirPretty);
    await fs.emptyDir(config.targetDirMin);

    for (const genData of showdownData) {
      const speciesMap = new SpeciesMap(); // conversion between showdown name/id and slug
      const moveMap: PokemonMap = new Map(); // remember pokemon that can learn a move
      const abilityMap: PokemonMap = new Map(); // remember pokemon that can have an ability

      console.log(`*** gen ${genData.genNum} ***`);

      await exportTypes(genData.gen, mergeData);
      await exportNatures(genData.gen, mergeData);
      await exportItems(genData.gen);
      await exportPokemon(
        genData.gen,
        genData.simGen,
        genData.genBdsp,
        genData.simGenBdsp,
        speciesMap,
        moveMap,
        abilityMap
      );
      await exportMoves(genData.gen, speciesMap, moveMap);
      await exportAbilities(genData.gen, mergeData, abilityMap);
      await exportGames(genData.gen, mergeData);
      await exportPokedex(genData.gen, mergeData, speciesMap);

      await exportMachines(genData.gen);

      // TODO pokedex usum, la
      // TODO maybe handle gen8 la (remaining learnsets, moves)

      console.log('');
    }

    await exportGen9Placeholder(mergeData);
    await exportMergedData(mergeData);

    console.log('done');
  } catch (err) {
    console.error(err);
  }
}

main();
