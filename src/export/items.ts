import * as path from 'path';
// import * as fs from 'fs-extra';
import _ from 'lodash';
import { Generation } from '@pkmn/data';
import { exportData } from '../utils';

export async function exportItems(gen: Generation) {
  console.log('- items');

  let result = [];

  for (const item of gen.items) {
    result.push({
      slug: item.id,
      name: item.name,
      gen: item.gen,
      desc: item.desc,
      shortDesc: item.shortDesc || undefined,

      // TODO add item flavor text
      // flavorText: data[item.id]?.flavorText,
    });
  }

  result = _.sortBy(result, 'slug');

  if (result.length) {
    console.log(`\twriting ${result.length} items...`);
    await exportData(path.join(`gen${gen.num}`, 'items.json'), result);
  }
}
