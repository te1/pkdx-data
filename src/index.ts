import * as fs from 'fs-extra';
import { AbilityMap } from './utils';
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
      const abilityMap: AbilityMap = new Map();

      console.log(`*** gen ${genData.genNum} ***`);

      await exportTypes(genData.gen, target);
      await exportNatures(genData.gen, target);
      await exportItems(genData.gen, target);
      await exportPokemon(genData.gen, genData.simGen, target, abilityMap);
      await exportMoves(genData.gen, target);
      await exportAbilities(genData.gen, target, abilityMap);

      console.log('');
    }

    // TODO export games
    // TODO export pokedex
    // TODO export HM/TM/TR
    // TODO create index and detail files
    // TODO handle gen9 preview

    console.log('done');
  } catch (err) {
    console.error(err);
  }
}

main();
