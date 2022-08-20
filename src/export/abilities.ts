import * as path from 'path';
import _ from 'lodash';
import { Generation } from '@pkmn/data';
import { PokemonMap, exportData } from '../utils';
import { MergeData } from '../merge';

export async function exportAbilities(
  gen: Generation,
  target: string,
  mergeData: MergeData,
  abilityMap: PokemonMap
) {
  console.log('- abilities');

  let result = [];

  for (const ability of gen.abilities) {
    const entry = {
      slug: ability.id,
      name: ability.name,
      gen: ability.gen,
      pokemon: abilityMap.get(ability.id),
      desc: ability.desc,
      shortDesc: ability.shortDesc,

      // TODO add ability flavor text
      // flavorText: data[ability.id]?.flavorText,
    };

    if (shouldSkipAbility(entry)) {
      continue;
    }

    result.push(entry);

    mergeData.addAbilityData(entry.slug, gen.num, entry);
  }

  result = _.sortBy(result, 'slug');

  if (result.length) {
    console.log(`\twriting ${result.length} abilities...`);
    await exportData(
      path.join(target, `gen${gen.num}`, 'abilities.json'),
      getAbilitiesIndexData(result)
    );

    console.log(`\twriting ${result.length} ability details...`);
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

function shouldSkipAbility(entry: { pokemon?: Set<string> }) {
  // skip abilities that no pokemon can learn (in this gen)
  if (!entry.pokemon || !entry.pokemon.size) {
    return true;
  }

  return false;
}
