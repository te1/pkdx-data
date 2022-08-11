import * as path from 'path';
// import * as fs from 'fs-extra';
import _ from 'lodash';
import { Generation } from '@pkmn/data';
import { PokemonMap, exportData } from '../utils';

export async function exportAbilities(
  gen: Generation,
  target: string,
  abilityMap: PokemonMap
) {
  console.log('- abilities');

  // TODO add ability flavor text
  // console.log('\tloading data...');
  // const data = await fs.readJson(`./data/ability.json`);

  let result = [];

  for (const ability of gen.abilities) {
    result.push({
      slug: ability.id,
      name: ability.name,
      gen: ability.gen,
      pokemon: abilityMap.get(ability.id),
      desc: ability.desc,
      shortDesc: ability.shortDesc,
      // flavorText: data[ability.id]?.flavorText,
    });
  }

  result = _.sortBy(result, 'slug');

  if (result.length) {
    console.log(`\twriting ${result.length} abilities...`);
    await exportData(
      path.join(target, `gen${gen.num}`, 'abilities.json'),
      getAbilitiesIndexData(result)
    );

    console.log(`\twriting ${result.length} abilities details...`);
    for (const entry of result) {
      await exportData(
        path.join(target, `gen${gen.num}`, 'abilities', entry.slug + '.json'),
        entry
      );
    }
  }
}

function getAbilitiesIndexData(result: object) {
  return _.map(result, (entry) => _.pick(entry, ['slug', 'name', 'gen']));
}
