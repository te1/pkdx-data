import * as path from 'path';
// import * as fs from 'fs-extra';
import _ from 'lodash';
import { Generation } from '@pkmn/data';
import { exportData } from './utils';

export async function exportItems(gen: Generation, target: string) {
  console.log('- items');

  // TODO add item flavor text
  // console.log('\t' + 'loading data...');
  // const data = await fs.readJson(`./data/item.json`);

  let result = [];

  for (const item of gen.items) {
    result.push({
      slug: item.id,
      name: item.name,
      gen: item.gen,
      desc: item.desc,
      shortDesc: item.shortDesc || undefined,
      // flavorText: data[item.id]?.flavorText,
    });
  }

  result = _.sortBy(result, 'slug');

  if (result.length) {
    console.log('\t' + `writing ${result.length} items...`);
    await exportData(path.join(target, `gen${gen.num}`, 'item.json'), result);
  }
}
