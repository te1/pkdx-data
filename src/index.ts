import * as fs from 'fs-extra';
import { Dex } from '@pkmn/dex';
import { Generations, GenerationNum } from '@pkmn/data';
import { exportTypes } from './type';
import { exportNatures } from './nature';
import { exportAbilities } from './ability';

const target = './generated/';

const gens = new Generations(Dex);
const genNums: GenerationNum[] = [1, 2, 3, 4, 5, 6, 7, 8];

async function main() {
  try {
    await fs.emptyDir(target);

    for (const genNum of genNums) {
      const gen = gens.get(genNum);

      console.log(`*** gen ${genNum} ***`);

      await exportTypes(gen, target);
      await exportNatures(gen, target);
      await exportAbilities(gen, target);

      console.log('');
    }

    console.log('done');
  } catch (err) {
    console.error(err);
  }
}

main();
