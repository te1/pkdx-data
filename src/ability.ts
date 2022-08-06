import * as path from 'path';
// import * as fs from 'fs-extra';
import * as _ from 'lodash';
import { Generation } from '@pkmn/data';
import { exportData } from './utils';

export async function exportAbilities(gen: Generation, target: string) {
  console.log('- abilities');

  // TODO add ability flavor text
  // console.log('\t' + 'loading data...');
  // const data = await fs.readJson(`./data/ability.json`);

  let result = [];

  for (const ability of gen.abilities) {
    result.push({
      slug: ability.id,
      name: ability.name,
      desc: ability.desc,
      shortDesc: ability.shortDesc,
      // flavorText: data[ability.id]?.flavorText,
    });
  }

  result = _.sortBy(result, 'slug');

  if (result.length) {
    console.log('\t' + `writing ${result.length} abilities...`);
    await exportData(
      path.join(target, `gen${gen.num}`, 'ability.json'),
      result
    );
  }
}
