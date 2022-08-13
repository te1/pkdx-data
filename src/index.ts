import * as fs from 'fs-extra';
import { PokemonMap } from './utils';
import { getData } from './showdown';
import { exportTypes } from './export/types';
import { exportNatures } from './export/natures';
import { exportItems } from './export/items';
import { exportPokemon, SpeciesMap } from './export/pokemon';
import { exportMoves } from './export/moves';
import { exportAbilities } from './export/abilities';
import { exportGames } from './export/games';
import { exportPokedex } from './export/pokedex';

const target = './generated/';

async function main() {
  try {
    const data = getData();

    await fs.emptyDir(target);

    for (const genData of data) {
      const speciesMap = new SpeciesMap();
      const moveMap: PokemonMap = new Map();
      const abilityMap: PokemonMap = new Map();

      console.log(`*** gen ${genData.genNum} ***`);

      await exportTypes(genData.gen, target);
      await exportNatures(genData.gen, target);
      await exportItems(genData.gen, target);
      await exportPokemon(
        genData.gen,
        genData.simGen,
        target,
        speciesMap,
        moveMap,
        abilityMap
      );
      await exportMoves(genData.gen, target, speciesMap, moveMap);
      await exportAbilities(genData.gen, target, abilityMap);
      await exportGames(target);
      await exportPokedex(target);

      console.log('');
    }

    // TODO export HM/TM/TR
    // TODO handle gen9 preview

    console.log('done');
  } catch (err) {
    console.error(err);
  }
}

main();
