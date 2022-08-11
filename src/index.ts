import * as fs from 'fs-extra';
import { PokemonMap } from './utils';
import { getData } from './showdown';
import { exportTypes } from './export/types';
import { exportNatures } from './export/natures';
import { exportItems } from './export/items';
import { exportPokemon } from './export/pokemon';
import { exportMoves } from './export/moves';
import { exportAbilities } from './export/abilities';

const target = './generated/';

async function main() {
  try {
    const data = getData();

    await fs.emptyDir(target);

    for (const genData of data) {
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
        moveMap,
        abilityMap
      );
      await exportMoves(genData.gen, target, moveMap);
      await exportAbilities(genData.gen, target, abilityMap);

      console.log('');
    }

    // TODO export games
    // TODO export pokedex
    // TODO export HM/TM/TR
    // TODO handle gen9 preview

    console.log('done');
  } catch (err) {
    console.error(err);
  }
}

main();
