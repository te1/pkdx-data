import * as fs from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import { Dex } from '@pkmn/dex';
import { Generation, Generations, GenerationNum, TypeName } from '@pkmn/data';
import { exportData } from './utils';

const target = './generated/';

const gens = new Generations(Dex);
const genNums: GenerationNum[] = [1, 2, 3, 4, 5, 6, 7, 8];

main();

async function main() {
  try {
    await fs.emptyDir(target);

    for (const genNum of genNums) {
      const gen = gens.get(genNum);

      console.log(`*** gen ${genNum} ***`);

      await exportTypes(gen, target);
      console.log('');

      console.log('');
    }

    console.log('done');
  } catch (err) {
    console.error(err);
  }
}

async function exportTypes(gen: Generation, target: string) {
  console.log('- types');

  process.stdout.write('\t' + 'loading data...');
  const data = await fs.readJson(`./data/type.json`);

  let result = [];

  for (const type of gen.types) {
    if (type.name === '???') {
      continue;
    }

    let damageTakenList = [];
    let damageDoneList = [];

    for (const otherType of gen.types) {
      if (otherType.name === '???') {
        continue;
      }

      damageTakenList.push({
        type: otherType.id,
        value: otherType.totalEffectiveness(type.name),
      });

      damageDoneList.push({
        type: otherType.id,
        value: type.totalEffectiveness(otherType.name),
      });
    }

    damageTakenList = _.orderBy(damageTakenList, ['value', 'type']);
    const damageTakenMap = _.keyBy(damageTakenList, 'type');
    const damageTakenFlat = _.mapValues(damageTakenMap, 'value');

    damageDoneList = _.orderBy(damageDoneList, ['value', 'type']);
    const damageDoneMap = _.keyBy(damageDoneList, 'type');
    const damageDoneFlat = _.mapValues(damageDoneMap, 'value');

    result.push({
      slug: type.id,
      name: type.name,
      color: data[type.id]?.color,
      damageTaken: damageTakenFlat,
      damageDone: damageDoneFlat,
    });
  }

  result = _.sortBy(result, 'slug');

  process.stdout.write('\t' + `writing ${result.length} types...`);
  await exportData(path.join(target, String(gen.num), 'type.json'), result);
}
