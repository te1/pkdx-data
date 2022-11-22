import * as path from 'path';
import * as fs from 'fs-extra';
import _ from 'lodash';
import { Generation } from '@pkmn/data';
import { PokemonMap, exportData } from '../utils';
import { MergeData } from '../merge';

export async function exportAbilities(
  gen: Generation,
  mergeData: MergeData,
  abilityMap: PokemonMap
) {
  console.log('- abilities');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flavorTexts: { [key: string]: any } = {};

  if (gen.num === 9) {
    console.log('\tloading data...');

    // TODO dynamically read sub dirs instead of hardcoding gen and game here
    // ability flavor texts are the same for all games in a game group
    flavorTexts.sv = await fs.readJson(
      `./data/flavorText/gen${gen.num}/sv/abilities.json`
    );
  }

  let result = [];

  for (const ability of gen.abilities) {
    const pokemon = [...(abilityMap.get(ability.id) ?? [])].sort();

    const flavorText = flavorTexts.sv?.[ability.id];

    const entry = {
      slug: ability.id,
      name: ability.name,
      gen: ability.gen,
      pokemon: pokemon?.length ? pokemon : undefined,
      desc: ability.desc,
      shortDesc: ability.shortDesc,
      flavorText: flavorText ? { sv: flavorText } : undefined,
    };

    if (shouldSkipAbility(entry)) {
      continue;
    }

    result.push(entry);

    mergeData.addAbilityData(entry);
  }

  result = _.sortBy(result, 'slug');

  if (result.length) {
    console.log(`\twriting ${result.length} abilities...`);
    await exportData(
      path.join(`gen${gen.num}`, 'abilities.json'),
      getAbilitiesIndexData(result)
    );

    console.log(`\twriting ${result.length} ability details...`);
    for (const entry of result) {
      await exportData(
        path.join(`gen${gen.num}`, 'abilities', entry.slug + '.json'),
        entry
      );
    }
  }
}

export function getAbilitiesIndexData(result: object) {
  return _.map(result, (entry) => _.pick(entry, ['slug', 'name', 'gen']));
}

function shouldSkipAbility(entry: { pokemon?: string[] }) {
  // skip abilities that no pokemon can learn (in this gen)
  if (!entry.pokemon || !entry.pokemon.length) {
    return true;
  }

  return false;
}
