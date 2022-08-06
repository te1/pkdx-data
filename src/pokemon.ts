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
  const hasDynamax = gen.num === 8;

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
      unreleasedHidden: species.unreleasedHidden || undefined,

      // something weird about hidden abilities in gen 5
      // maleOnlyHidden: species.maleOnlyHidden || undefined,

      // -- Evolutions
      prevo: getSpeciesSlug(species.prevo, gen),
      evos: getSpeciesSlugs(species.evos, gen),
      evoType: species.evoType,
      evoCondition: species.evoCondition,
      evoLevel: species.evoLevel,
      evoItem: species.evoItem,
      evoMove: species.evoMove,

      // not final evolution (if true it could still evolve)
      // nfe: species.nfe,

      // -- Formes
      // if set then this species is a forme
      // is just a string to display (e.g. is "Blade" for Aegislash-Blade)
      // will not be set on the base forme (e.g. is null for Aegislash)
      forme: species.forme || undefined,

      // base species for formes that have their own species entry
      // can be different from `changesFrom` (e.g. is "Raichu" for Raichu-Alola)
      baseSpecies:
        species.baseSpecies !== species.name
          ? getSpeciesSlug(species.baseSpecies, gen)
          : undefined,

      // name of the base forme
      // will not be set on the base forme (e.g. is null for Aegislash)
      // e.g. is "Aegislash" for Aegislash-Blade
      changesFrom: getSpeciesSlug(species.changesFrom, gen),

      // name of the base forme if this forme is battly only
      // should always be the same as changesFrom (unless it's an array of multiple forms)
      // battleOnly: getSpeciesSlug(species.battleOnly, gen),

      // there may be requirements (having an ability, holding an item, knowing a move) to change forme
      requiredAbility: getAbilitySlug(species.requiredAbility ?? '', gen),
      requiredItem: getItemSlug(species.requiredItem ?? '', gen),
      requiredItems:
        (species.requiredItems?.length ?? 0) > 1
          ? getItemSlugs(species.requiredItems, gen)
          : undefined,
      requiredMove: getMoveSlug(species.requiredMove ?? '', gen),

      isBattleOnlyForme: !!species.battleOnly || undefined,

      isMega: species.isMega,
      isPrimal: species.isPrimal,

      // name of base forme
      // is just a string to display (e.g. is "Shield" for Aegislash)
      // will not be set on formes (e.g. is null for Aegislash-Blade)
      baseForme: species.baseForme || undefined,

      // list of all available formes (base forme + otherFormes + cosmeticFormes)
      // only included if there is more than 1
      // only set on the base forme (e.g. is null for Aegislash-Blade)
      // formes:
      //   (species.formes?.length ?? 0) > 1
      //     ? getSpeciesSlugs(species.formes, gen)
      //     : undefined,

      // list of all formes that have a species entry
      // the base forme is not included in the list
      // only set on the base forme (e.g. is null for Aegislash-Blade)
      otherFormes: getSpeciesSlugs(species.otherFormes, gen),

      // list of all cosmetic formes that _don't_ have a species entry
      // the base forme is not included in the list
      // cosmetic formes don't have their own species entry (e.g. there is no Gastrodon-East species)
      cosmeticFormes: getSpeciesSlugs(species.cosmeticFormes, gen),

      // formeNum: species.formeNum || undefined,
      // formeOrder: (species.formeOrder?.length ?? 0) > 1 ? species.formeOrder : undefined,

      // -- Misc data and breeding
      weight: species.weightkg,
      // TODO height (requires sim dex?)
      gender: species.gender,
      genderRatio: hasEggs && !species.gender ? species.genderRatio : undefined,
      eggGroups: hasEggs ? species.eggGroups : undefined,
      canHatch: hasEggs ? species.canHatch || undefined : undefined,

      // -- Classifications
      // Shedinja: max HP is always 1
      // maxHP: species.maxHP,

      cannotDynamax: hasDynamax
        ? species.cannotDynamax || undefined
        : undefined,
      // canGmax: hasDynamax ? !!species.canGigantamax || undefined : undefined,
      gmaxUnreleased: hasDynamax
        ? species.gmaxUnreleased || undefined
        : undefined,
      // isNonstandard: species.isNonstandard || undefined,
      // TODO handle tags
      tags: species.tags.length ? species.tags : undefined,

      // flavorText: data[species.id]?.flavorText,

      // TODO learnsets
      // name of the exclusive G-Max move
      gmaxMove: hasDynamax
        ? getMoveSlug(species.canGigantamax ?? '', gen)
        : undefined,
    });

    // Optional logging if `baseSpecies` is different from `changesFrom`
    // if (
    //   species.name !== species.baseSpecies &&
    //   species.baseSpecies !== species.changesFrom
    // ) {
    //   console.log(
    //     species.name,
    //     '\tbaseSpecies -->',
    //     species.baseSpecies,
    //     '\tchangesFrom -->',
    //     species.changesFrom
    //   );
    // }

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

function getMoveSlug(moveName: string, gen: Generation) {
  return gen.moves.get(moveName)?.id as string;
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
