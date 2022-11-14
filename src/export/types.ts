import * as path from 'path';
import * as fs from 'fs-extra';
import _ from 'lodash';
import { Generation, Type, Types } from '@pkmn/data';
import { exportData } from '../utils';
import { MergeData } from '../merge';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let extraData: any;

export async function exportTypes(gen: Generation, mergeData: MergeData) {
  console.log('- types');

  if (!extraData) {
    console.log('\tloading data...');
    extraData = await fs.readJson('./data/types.json');
  }

  const result = {
    types: getTypesData(gen, extraData.types),
    categories: getCategoriesData(extraData.categories),
  };

  mergeData.addTypeData(gen.num, result);

  if (result.types.length || result.categories.length) {
    console.log(
      `\twriting ${result.types.length} types and ${result.categories.length} categories...`
    );
    await exportData(path.join(`gen${gen.num}`, 'types.json'), result);
  }
}

function getTypesData(
  gen: Generation,
  extraData: Record<string, { color?: string }>
) {
  let result = [];

  for (const type of gen.types) {
    if (shouldSkipType(type)) {
      continue;
    }

    const [damageTaken, damageDone] = getDamage(type, gen.types);

    result.push({
      slug: type.id,
      name: type.name,
      color: extraData[type.id]?.color,
      damageTaken,
      damageDone,
    });
  }

  result = _.sortBy(result, 'slug');

  return result;
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

function getCategoriesData(
  extraData: Record<string, { name?: string; color?: string }>
) {
  const result = [];

  for (const [slug, category] of Object.entries(extraData)) {
    result.push({
      slug,
      name: category.name,
      color: category.color,
    });
  }

  return result;
}
