import * as path from 'path';
import _ from 'lodash';
import { Generation } from '@pkmn/data';
import { exportData } from '../utils';
import { MergeData } from '../merge';

export async function exportNatures(
  gen: Generation,
  target: string,
  mergeData: MergeData
) {
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

  if (gen.num === 3) {
    mergeData.natures = result;
  }

  if (result.length) {
    console.log(`\twriting ${result.length} natures...`);
    await exportData(
      path.join(target, `gen${gen.num}`, 'natures.json'),
      result
    );
  }
}
