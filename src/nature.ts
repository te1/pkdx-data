import * as path from 'path';
import _ from 'lodash';
import { Generation } from '@pkmn/data';
import { exportData } from './utils';

export async function exportNatures(gen: Generation, target: string) {
  console.log('- natures');

  let result = [];

  for (const nature of gen.natures) {
    result.push({
      slug: nature.id,
      name: nature.name,
      plus: nature.plus,
      minus: nature.minus,
    });
  }

  result = _.sortBy(result, 'slug');

  if (result.length) {
    console.log('\t' + `writing ${result.length} natures...`);
    await exportData(path.join(target, `gen${gen.num}`, 'nature.json'), result);
  }
}
