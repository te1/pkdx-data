import * as path from 'path';
// import * as fs from 'fs-extra';
import * as _ from 'lodash';
import {
  AbilityName,
  Generation,
  ItemName,
  SpeciesName,
  TypeName,
} from '@pkmn/data';
import { SpeciesAbility } from '@pkmn/dex-types';
import { AbilityMap, exportData, typeNameToSlug } from './utils';

export async function exportPokemon(
  gen: Generation,
  target: string,
  abilityMap: AbilityMap
) {
  console.log('- pokemon');

  // TODO add pokemon flavor text
  // console.log('\t' + 'loading data...');
  // const data = await fs.readJson(`./data/pokemon.json`);

  const hasEggs = gen.num >= 2;

  let result = [];

  for (const species of gen.species) {
    result.push({
      // -- General
      slug: species.id,
      name: species.name,
      gen: species.gen,
      types: getTypeSlugs(species.types),
      num: species.num,
      baseStats: species.baseStats,
      abilities: getAbilitySlugs(species.abilities, gen),

      // -- Evolutions
      prevo: getSpeciesSlug(species.prevo, gen),
      evos: getSpeciesSlugs(species.evos, gen),
      evoType: species.evoType,
      evoCondition: species.evoCondition,
      evoLevel: species.evoLevel,
      evoItem: species.evoItem,
      evoMove: species.evoMove,

      // -- Formes
      // TODO formes

      // if set then this species is a forme
      // will not be set on the base forme (e.g. is null for Aegislash)
      forme: species.forme || undefined,

      // name of base forme
      // only set if forme == null (e.g. is "Shield" for Aegislash)
      baseForme: species.baseForme || undefined,

      // list of all available formes
      // only included if there is more than 1
      // only set on the base forme (e.g. is null for Aegislash-Blade)
      formes: (species.formes?.length ?? 0) > 1 ? species.formes : undefined,

      // same as formes but with the entry for base forme removed
      // only set on the base forme (e.g. is null for Aegislash-Blade)
      otherFormes: species.otherFormes,

      // formeNum: species.formeNum || undefined,
      // formeOrder: (species.formeOrder?.length ?? 0) > 1 ? species.formeOrder : undefined,

      cosmeticFormes: species.cosmeticFormes,
      changesFrom: species.changesFrom,
      // there may be requirements (having an ability, holding an item, knowing a move) to change forme
      requiredAbility: getAbilitySlug(species.requiredAbility ?? '', gen),
      requiredItem: getItemSlug(species.requiredItem ?? '', gen),
      requiredItems:
        (species.requiredItems?.length ?? 0) > 1
          ? getItemSlugs(species.requiredItems, gen)
          : undefined,
      requiredMove: species.requiredMove,

      // -- Misc data and breeding
      weight: species.weightkg,
      // TODO height (requires sim dex?)
      gender: species.gender,
      genderRatio: hasEggs && !species.gender ? species.genderRatio : undefined,
      eggGroups: hasEggs ? species.eggGroups : undefined,

      // -- Classifications
      // TODO handle tags
      isNonstandard: species.isNonstandard || undefined,
      tags: species.tags.length ? species.tags : undefined,

      // flavorText: data[species.id]?.flavorText,
    });

    // TODO learnsets

    for (const abilityName of Object.values(species.abilities)) {
      const abilitySlug = getAbilitySlug(abilityName, gen);

      let ability = abilityMap.get(abilitySlug);

      if (!ability) {
        ability = {
          pokemon: new Set<string>(),
        };
      }

      ability.pokemon.add(species.id);

      abilityMap.set(abilitySlug, ability);
    }
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

function getAbilitySlug(abilityName: string, gen: Generation) {
  return gen.abilities.get(abilityName)?.id as string;
}

function getAbilitySlugs(
  abilities: SpeciesAbility<AbilityName | ''>,
  gen: Generation
) {
  let result: object = _.mapValues(abilities, (abilityName) =>
    getAbilitySlug(abilityName ?? '', gen)
  );

  // drop falsey values
  result = _.pickBy(result, _.identity);

  if (_.isEmpty(result)) {
    return undefined;
  }

  return result;
}

function getItemSlug(itemName: string, gen: Generation) {
  return gen.items.get(itemName)?.id as string;
}

function getItemSlugs(itemNames: ItemName[] | undefined, gen: Generation) {
  const result = _.map(itemNames, (itemName) => getItemSlug(itemName, gen));

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
