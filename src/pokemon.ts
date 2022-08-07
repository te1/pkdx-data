import * as path from 'path';
import * as fs from 'fs-extra';
import _ from 'lodash';
import {
  AbilityName,
  Generation,
  ItemName,
  Specie,
  SpeciesName,
  TypeName,
} from '@pkmn/data';
import { SpeciesAbility } from '@pkmn/dex-types';
import { AbilityMap, exportData, typeNameToSlug } from './utils';

type Region = 'Alola' | 'Galar' | 'Hisui' | 'Paldea';

export async function exportPokemon(
  gen: Generation,
  target: string,
  abilityMap: AbilityMap
) {
  console.log('- pokemon');

  console.log('\t' + 'loading data...');
  const data = await fs.readJson(`./data/pokemon.json`);

  const hasEggs = gen.num >= 2;
  const hasDynamax = gen.num === 8;

  let result = [];

  for (const species of gen.species) {
    const baseSpecies =
      species.baseSpecies !== species.name
        ? gen.species.get(species.baseSpecies)
        : undefined;

    const isGmax = species.isNonstandard === 'Gigantamax';
    const region = getRegion(species, data);
    const prettyName = getPrettyName(species, baseSpecies, region, data);
    const subName = getPrettySubName(species, { isGmax, region }, data);

    let isLegendary = !!data[species.id]?.isLegendary;
    if (!isLegendary && baseSpecies) {
      isLegendary = !!data[baseSpecies.id]?.isLegendary;
    }

    let isMythical = !!data[species.id]?.isMythical;
    if (!isMythical && baseSpecies) {
      isMythical = !!data[baseSpecies.id]?.isMythical;
    }

    let gmaxMove;
    if (hasDynamax) {
      gmaxMove = getMoveSlug(species.canGigantamax ?? '', gen);

      if (!gmaxMove && baseSpecies) {
        gmaxMove = getMoveSlug(baseSpecies.canGigantamax ?? '', gen);
      }
    }

    result.push({
      // -- General
      slug: species.id,
      name: species.name,
      prettyName,
      subName,
      gen: species.gen,
      types: getTypeSlugs(species.types),
      num: species.num,
      baseStats: species.baseStats,
      abilities: getAbilitySlugs(species.abilities, gen),
      hiddenAbilityUnreleased: species.unreleasedHidden || undefined,

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
      // name of default / base forme
      // is just a string to display (e.g. is "Shield" for Aegislash)
      // will not be set on formes (e.g. is null for Aegislash-Blade)
      defaultFormeName: species.baseForme || undefined,

      // if set then this species is a forme
      // is just a string to display (e.g. is "Blade" for Aegislash-Blade)
      // will not be set on the base forme (e.g. is null for Aegislash)
      formeName: species.forme || undefined,

      // base species for formes that have their own species entry
      // e.g. is "Raichu" for Raichu-Alola
      baseSpecies: baseSpecies ? baseSpecies.id : undefined,

      // name of the base forme
      // will not be set on the base forme (e.g. is null for Aegislash)
      // e.g. is "Aegislash" for Aegislash-Blade
      // only included if different from `baseSpecies`
      baseForm:
        !baseSpecies || baseSpecies.name !== species.changesFrom
          ? getSpeciesSlug(species.changesFrom, gen)
          : undefined,

      // name of the base forme if this forme is battly only
      // should always be the same as `changesFrom` (unless it's an array of multiple forms)
      // battleOnly: getSpeciesSlug(species.battleOnly, gen),

      // there may be requirements (having an ability, holding an item, knowing a move) to change forme
      formTriggerAbility: getAbilitySlug(species.requiredAbility ?? '', gen),
      formTriggerItem: getItemSlug(species.requiredItem ?? '', gen),
      formTriggerItems:
        (species.requiredItems?.length ?? 0) > 1
          ? getItemSlugs(species.requiredItems, gen)
          : undefined,
      formTriggerMove: getMoveSlug(species.requiredMove ?? '', gen),

      region: region || undefined,

      isBattleOnly: !!species.battleOnly || undefined,

      isMega: species.isMega,
      isPrimal: species.isPrimal,
      isTotem: species.forme === 'Totem' || undefined,
      isGmax: isGmax || undefined,

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
      formes: getSpeciesSlugs(species.otherFormes, gen),

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
      isUnobtainable: species.isNonstandard === 'Unobtainable' || undefined,
      isLegendary: isLegendary || undefined,
      isMythical: isMythical || undefined,
      cannotDynamax: hasDynamax
        ? species.cannotDynamax || undefined
        : undefined,
      canGmax: hasDynamax ? !!species.canGigantamax || undefined : undefined,

      gmaxUnreleased: hasDynamax
        ? species.gmaxUnreleased || undefined
        : undefined,
      // isNonstandard: species.isNonstandard || undefined,

      // Shedinja: max HP is always 1
      // maxHP: species.maxHP,

      // TODO add pokemon flavor text
      // flavorText: data[species.id]?.flavorText,

      // TODO learnsets
      // name of the exclusive G-Max move
      gmaxMove,
    });

    // Optional logging if `baseSpecies` is different from `changesFrom`
    // if (
    //   species.changesFrom &&
    //   species.name !== species.baseSpecies &&
    //   species.baseSpecies !== species.changesFrom
    // ) {
    //   console.log(
    //     species.name,
    //     '\tbaseSpecies -->',
    //     species.baseSpecies,
    //     '\tchangesFrom -->',
    //     species.changesFrom,
    //     '\tisBattleOnly -->',
    //     !!species.battleOnly
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

  result = _.orderBy(result, ['num', 'slug']);

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

function getPrettyName(
  species: Specie,
  baseSpecies: Specie | undefined,
  region: Region | undefined,
  extraData: Record<string, { prettyName?: string }>
) {
  // direct override from extraData
  let result = extraData[species.id]?.prettyName;
  if (result) {
    return result;
  }

  if (baseSpecies) {
    if (region) {
      // use base species name (e.g. "Raichu")
      // add region prefix (e.g. "Alolan Raichu")
      const prettyRegion = getRegionPrettyName(region);

      if (prettyRegion) {
        result = `${prettyRegion} ${baseSpecies.name}`;
      }
    } else {
      // use base species name (e.g. "Aegislash")
      // handle the rest with subName (e.g. "Blade Forme")
      result = baseSpecies.name;

      if (species.isMega) {
        // use forme (e.g. "Mega Blastoise")
        result = `${species.forme} ${result}`;
      }

      if (species.isPrimal) {
        // use forme (e.g. "Primal Kyogre")
        result = `${species.forme} ${result}`;
      }
    }
  }

  return result;
}

function getPrettySubName(
  species: Specie,
  speciesData: { isGmax?: boolean; region?: Region },
  extraData: Record<string, { subName?: string; hideSubName?: boolean }>
) {
  // direct override from extraData
  const result = extraData[species.id]?.subName;
  if (result) {
    return result;
  }

  if (extraData[species.id]?.hideSubName) {
    return;
  }

  if (speciesData.isGmax) {
    return 'Gigantamax';
  }

  // fallback to forme (e.g. "Blade")
  if (
    species.forme &&
    !speciesData.region &&
    !species.isMega &&
    !species.isPrimal
  ) {
    return species.forme;
  }
}

const regionFormes: Map<Region, string[]> = new Map([
  ['Alola', ['Alola', 'Alola-Totem']],
  ['Galar', ['Galar', 'Galar-Zen']],
  ['Hisui', ['Hisui']],
  ['Paldea', ['Paldea']],
]);

function getRegion(
  species: Specie,
  extraData: Record<string, { region?: Region }>
) {
  // direct override from extraData
  const result = extraData[species.id]?.region;
  if (result !== undefined) {
    return result;
  }

  if (!species.forme) {
    return;
  }

  for (const [key, value] of regionFormes) {
    if (_.includes(value, species.forme)) {
      return key;
    }
  }

  return;
}

function getRegionPrettyName(region: Region) {
  switch (region) {
    case 'Alola':
      return 'Alolan';

    case 'Galar':
      return 'Galarian';

    case 'Hisui':
      return 'Hisuian';

    case 'Paldea':
      return 'Paldean';
  }
}
