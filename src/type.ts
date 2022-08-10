import * as path from 'path';
import * as fs from 'fs-extra';
import _ from 'lodash';
import { Generation, Type, Types } from '@pkmn/data';
import { exportData } from './utils';

export async function exportTypes(gen: Generation, target: string) {
  console.log('- types');

  console.log('\t' + 'loading data...');
  const data = await fs.readJson(`./data/types.json`);

  let result = [];

  for (const type of gen.types) {
    if (shouldSkipType(type)) {
      continue;
    }

    const [damageTaken, damageDone] = getDamage(type, gen.types);

    result.push({
      slug: type.id,
      name: type.name,
      color: data.types[type.id]?.color,
      damageTaken,
      damageDone,
    });
  }

  result = _.sortBy(result, 'slug');

  if (result.length) {
    console.log('\t' + `writing ${result.length} types...`);
    await exportData(path.join(target, `gen${gen.num}`, 'types.json'), result);
  }
}

function shouldSkipType(type: Type) {
  if (type.name === '???') {
    return true;
  }

  return false;
}

function getDamage(type: Type, allTypes: Types) {
  let takenList = [];
  let doneList = [];

  for (const otherType of allTypes) {
    if (shouldSkipType(otherType)) {
      continue;
    }

    takenList.push({
      type: otherType.id,
      value: otherType.totalEffectiveness(type.name),
    });

    doneList.push({
      type: otherType.id,
      value: type.totalEffectiveness(otherType.name),
    });
  }

  takenList = _.orderBy(takenList, ['value', 'type']);
  const takenMap = _.keyBy(takenList, 'type');
  const taken = _.mapValues(takenMap, 'value');

  doneList = _.orderBy(doneList, ['value', 'type']);
  const doneMap = _.keyBy(doneList, 'type');
  const done = _.mapValues(doneMap, 'value');

  return [taken, done];
}
