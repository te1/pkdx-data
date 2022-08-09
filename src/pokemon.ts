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
import { Species as SimSpecies } from '@pkmn/sim';
import { SpeciesAbility } from '@pkmn/dex-types';
import { AbilityMap, exportData, typeNameToSlug } from './utils';

type Region = 'Alola' | 'Galar' | 'Hisui' | 'Paldea';

export async function exportPokemon(
  gen: Generation,
  simGen: Generation,
  target: string,
  abilityMap: AbilityMap
) {
  console.log('- pokemon');

  console.log('\t' + 'loading data...');
  const extraData = await fs.readJson(`./data/pokemon.json`);

  const hasEggs = gen.num >= 2;
  const hasDynamax = gen.num === 8;

  let result = [];

  for (const species of gen.species) {
    // species is from @pkmn/data but for height we need simSpecies from @pkmn/sim
    const simSpecies = simGen.species.get(
      species.name
    ) as unknown as SimSpecies;

    // baseSpecies is set for formes that heave their own species entry
    // e.g. is "aegislash" for "aegislash-blade"
    const baseSpecies = getBaseSpecies(species, gen);

    // build better slugs, e.g. "aegislash-blade" instead of "aegislashblade"
    const baseSpeciesSlug = baseSpecies
      ? getPrettySpeciesSlug(baseSpecies, undefined)
      : undefined;
    const slug = getPrettySpeciesSlug(species, baseSpecies);

    const isGmax = hasDynamax ? species.isNonstandard === 'Gigantamax' : false;
    const canGmax = hasDynamax ? !!species.canGigantamax : false;
    const region = getRegion(species, { slug }, extraData);

    const name = getPrettySpeciesName(
      species,
      baseSpecies,
      { slug, isGmax, region },
      extraData
    );
    const subName = getPrettySpeciesSubName(
      species,
      { slug, isGmax, region },
      extraData
    );

    let formes = getSpeciesSlugs(species.otherFormes, gen);
    if (canGmax && !baseSpecies) {
      // gmax species are not in formes, so add them manually
      formes = [...(formes ?? []), slug + '-gmax'];
    }
    if (extraData[slug]?.formes?.length) {
      // direct override from extraData (to handle toxtricity and urshifu with 2 gmax formes)
      formes = extraData[slug]?.formes;
    }

    // legendary from extraData
    let isLegendary = !!extraData[slug]?.isLegendary;
    if (!isLegendary && baseSpeciesSlug) {
      // inherit legendary from baseSpecies
      isLegendary = !!extraData[baseSpeciesSlug]?.isLegendary;
    }

    // mythical from extraData
    let isMythical = !!extraData[slug]?.isMythical;
    if (!isMythical && baseSpeciesSlug) {
      // inherit mythical from baseSpecies
      isMythical = !!extraData[baseSpeciesSlug]?.isMythical;
    }

    let gmaxMove;
    if (hasDynamax) {
      gmaxMove = getMoveSlug(species.canGigantamax ?? '', gen);

      if (!gmaxMove && baseSpecies) {
        // also set gmaxMove on the actual gmax species (otherwise it would only be set on baseSpecies)
        gmaxMove = getMoveSlug(baseSpecies.canGigantamax ?? '', gen);
      }
    }

    const entry = {
      // -- General
      slug,
      name,
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
      baseSpecies: baseSpeciesSlug,

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
      // allFormes:
      //   (species.formes?.length ?? 0) > 1
      //     ? getSpeciesSlugs(species.formes, gen)
      //     : undefined,

      // list of all formes that have a species entry
      // the base forme is not included in the list
      // only set on the base forme (e.g. is null for Aegislash-Blade)
      formes,

      // list of all cosmetic formes that _don't_ have a species entry
      // the base forme is not included in the list
      // cosmetic formes don't have their own species entry (e.g. there is no Gastrodon-East species)
      cosmeticFormes: getSpeciesSlugs(species.cosmeticFormes, gen),

      // formeNum: species.formeNum || undefined,
      // formeOrder: (species.formeOrder?.length ?? 0) > 1 ? species.formeOrder : undefined,

      // -- Misc data and breeding
      weight: species.weightkg,

      // height is only available in @pkmn/sim not in @pkmn/dex or @pkmn/data
      height: simSpecies?.heightm,

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
      canGmax: canGmax || undefined,

      gmaxUnreleased: hasDynamax
        ? species.gmaxUnreleased || undefined
        : undefined,
      // isNonstandard: species.isNonstandard || undefined,

      // Shedinja: max HP is always 1
      // maxHP: species.maxHP,

      // TODO add pokemon flavor text
      // flavorText: extraData[slug]?.flavorText,

      // TODO learnsets
      // name of the exclusive G-Max move
      gmaxMove,
    };

    result.push(entry);

    // TODO handle cosmeticFormes

    // remember available abilities per pokemon for later use
    for (const abilityName of Object.values(species.abilities)) {
      const abilitySlug = getAbilitySlug(abilityName, gen);

      let ability = abilityMap.get(abilitySlug);

      if (!ability) {
        ability = {
          pokemon: new Set<string>(),
        };
      }

      ability.pokemon.add(entry.slug);

      abilityMap.set(abilitySlug, ability);
    }
  }

  // TODO sort by formeOrder
  result = _.orderBy(result, ['num', 'slug']);

  if (result.length) {
    console.log('\t' + `writing ${result.length} pokemon...`);
    await exportData(
      path.join(target, `gen${gen.num}`, 'pokemon.json'),
      result
    );
  }
}

function getTypeSlugs(types: [TypeName] | [TypeName, TypeName]) {
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

function getBaseSpecies(species: Specie, gen: Generation) {
  if (species.baseSpecies !== species.name) {
    return gen.species.get(species.baseSpecies);
  }
}

function getPrettySpeciesSlug(
  species: Specie,
  baseSpecies: Specie | undefined
) {
  let result: string;

  if (baseSpecies) {
    result = baseSpecies.name;
  } else {
    result = species.name;
  }

  result = result.replaceAll(/[^a-zA-Z0-9]/g, '');

  if (baseSpecies) {
    result = result + '-' + species.forme.replaceAll(/[^a-zA-Z0-9-]/g, '');
  }

  return result.toLowerCase();
}

function getSpeciesSlug(
  speciesName: SpeciesName | '' | undefined,
  gen: Generation
) {
  const species = gen.species.get(speciesName ?? '');

  if (!species) {
    return;
  }

  const baseSpecies = getBaseSpecies(species, gen);

  return getPrettySpeciesSlug(species, baseSpecies);
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

function getPrettySpeciesName(
  species: Specie,
  baseSpecies: Specie | undefined,
  speciesData: { slug: string; isGmax?: boolean; region?: Region },
  extraData: Record<string, { prettyName?: string }>
) {
  // direct override from extraData
  let result = extraData[speciesData.slug]?.prettyName;
  if (result) {
    return result;
  }

  if (!baseSpecies) {
    return species.name;
  }

  // use base species name (e.g. "Aegislash")
  // handle the rest with subName (e.g. "Blade Forme")
  result = baseSpecies.name;

  if (speciesData.region) {
    // use base species name (e.g. "Raichu")
    // add region prefix (e.g. "Alolan Raichu")
    const prettyRegion = getPrettyRegionName(speciesData.region);

    if (prettyRegion) {
      result = `${prettyRegion} ${result}`;
    }
  }

  if (species.isMega) {
    // use forme (e.g. "Mega Blastoise")
    result = `${species.forme} ${result}`;
  }

  if (species.isPrimal) {
    // use forme (e.g. "Primal Kyogre")
    result = `${species.forme} ${result}`;
  }

  if (speciesData.isGmax) {
    // use custom prefix (e.g. "Gigantamax Charizard")
    result = `Gigantamax ${result}`;
  }

  return result;
}

function getPrettySpeciesSubName(
  species: Specie,
  speciesData: { slug: string; isGmax?: boolean; region?: Region },
  extraData: Record<string, { subName?: string; hideSubName?: boolean }>
) {
  // direct override from extraData
  const result = extraData[speciesData.slug]?.subName;
  if (result) {
    return result;
  }

  if (extraData[speciesData.slug]?.hideSubName) {
    return;
  }

  // fallback to forme (e.g. "Blade")
  if (
    species.forme &&
    !speciesData.region &&
    !species.isMega &&
    !species.isPrimal &&
    !speciesData.isGmax
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
  speciesData: { slug: string },
  extraData: Record<string, { region?: Region }>
) {
  // direct override from extraData
  const result = extraData[speciesData.slug]?.region;
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

function getPrettyRegionName(region: Region) {
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
