import * as path from 'path';
// import * as fs from 'fs-extra';
import * as _ from 'lodash';
import { AbilityName, Generation, SpeciesName, TypeName } from '@pkmn/data';
import { SpeciesAbility } from '@pkmn/dex-types';
import { exportData, typeNameToSlug } from './utils';

export async function exportPokemon(gen: Generation, target: string) {
  console.log('- pokemon');

  // TODO add pokemon flavor text
  // console.log('\t' + 'loading data...');
  // const data = await fs.readJson(`./data/pokemon.json`);

  const hasEggs = gen.num >= 2;

  let result = [];

  for (const species of gen.species) {
    result.push({
      slug: species.id,
      name: species.name,
      gen: species.gen,
      types: getTypeSlugs(species.types),
      num: species.num,
      baseStats: species.baseStats,
      abilities: getAbilitySlugs(species.abilities, gen),

      prevo: getSpeciesSlug(species.prevo, gen),
      // requiredAbility: species.requiredAbility,
      // requiredItem: species.requiredItem,
      // requiredItems: species.requiredItems,
      // requiredMove: species.requiredMove,

      evos: getSpeciesSlugs(species.evos, gen),
      evoType: species.evoType,
      evoCondition: species.evoCondition,
      evoLevel: species.evoLevel,
      evoItem: species.evoItem,
      evoMove: species.evoMove,

      gender: species.gender,

      weight: species.weightkg,
      // TODO height
      genderRatio: hasEggs && !species.gender ? species.genderRatio : undefined,
      eggGroups: hasEggs ? species.eggGroups : undefined,

      // TODO handle tags
      tags: species.tags.length ? species.tags : undefined,

      // flavorText: data[species.id]?.flavorText,
    });

    // TODO formes
    // TODO learnsets
  }

  result = _.sortBy(result, 'slug');

  if (result.length) {
    console.log('\t' + `writing ${result.length} pokemon...`);
    await exportData(
      path.join(target, `gen${gen.num}`, 'pokemon.json'),
      result
    );
  }
}

export function getTypeSlugs(types: [TypeName] | [TypeName, TypeName]) {
  return _.map(types, typeNameToSlug);
}

function getAbilitySlugs(
  abilities: SpeciesAbility<AbilityName | ''>,
  gen: Generation
) {
  let result: object = _.mapValues(
    abilities,
    (abilityName) => gen.abilities.get(abilityName ?? '')?.id
  );

  // drop falsey values
  result = _.pickBy(result, _.identity);

  if (_.isEmpty(result)) {
    return undefined;
  }

  return result;
}

function getSpeciesSlug(
  speciesName: SpeciesName | '' | undefined,
  gen: Generation
) {
  return gen.species.get(speciesName ?? '')?.id;
}

function getSpeciesSlugs(
  speciesNames: SpeciesName[] | undefined,
  gen: Generation
) {
  const result = _.map(speciesNames, (speciesName) =>
    getSpeciesSlug(speciesName, gen)
  );

  if (_.isEmpty(result)) {
    return undefined;
  }

  return result;
}
