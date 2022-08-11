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
import { PokemonMap, exportData, typeNameToSlug } from '../utils';

type Region = 'Alola' | 'Galar' | 'Hisui' | 'Paldea';

export async function exportPokemon(
  gen: Generation,
  simGen: Generation,
  target: string,
  moveMap: PokemonMap,
  abilityMap: PokemonMap
) {
  console.log('- pokemon');

  console.log('\tloading data...');
  const extraData = await fs.readJson(`./data/pokemon.json`);
  const extraDataCosmeticFormes = await fs.readJson(
    `./data/cosmeticFormes.json`
  );

  const hasEggs = gen.num >= 2;
  const hasAbilities = gen.num >= 3;
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
      ? getPrettySpeciesSlug(baseSpecies, undefined, extraData)
      : undefined;
    const slug = getPrettySpeciesSlug(species, baseSpecies, extraData);

    const isTotem = species.forme === 'Totem';
    const isGmax = hasDynamax ? species.isNonstandard === 'Gigantamax' : false;
    const canGmax = hasDynamax ? !!species.canGigantamax : false;

    // treat gmax as battle only even if showdown doesn't
    const isBattleOnly = !!species.battleOnly || (hasDynamax && isGmax);

    if (shouldSkipSpecies({ isTotem })) {
      continue;
    }

    const region = getRegion(species, { slug }, extraData);
    const name = getSpeciesName(
      species,
      baseSpecies,
      { slug, isGmax, region },
      extraData
    );
    const subName = getSpeciesSubName(
      species,
      { slug, isGmax, region },
      extraData
    );

    const formes = getFormes(
      species,
      baseSpecies,
      gen,
      { slug, canGmax },
      extraData
    );
    const formeIndex = getFormeIndex(species, baseSpecies, { isGmax });

    const cosmeticSubName = getCosmeticSubName(species, { slug }, extraData);
    const cosmeticFormes = getCosmeticFormes(
      species,
      gen,
      extraData,
      extraDataCosmeticFormes
    );

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

    const learnset = await getLearnset(species, gen);

    const entry = {
      // -- General
      slug,
      name,
      subName,
      num: species.num,
      types: getTypeSlugs(species.types),
      gen: species.gen,
      abilities: hasAbilities
        ? getAbilitySlugs(species.abilities, gen)
        : undefined,
      hiddenAbilityUnreleased: hasAbilities
        ? species.unreleasedHidden || undefined
        : undefined,

      // something weird about hidden abilities in gen 5
      // maleOnlyHidden: species.maleOnlyHidden || undefined,

      baseStats: species.baseStats,

      // -- Evolutions
      prevo: getSpeciesSlug(species.prevo, gen, extraData),
      evos: getSpeciesSlugs(species.evos, gen, extraData),
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
      // defaultFormeName: species.baseForme || undefined,
      // handled by subName instead

      // if set then this species is a forme
      // is just a string to display (e.g. is "Blade" for Aegislash-Blade)
      // will not be set on the base forme (e.g. is null for Aegislash)
      // formeName: species.forme || undefined,
      // handled by subName instead

      // indicates that species is a forme
      // normally is redudanten because isForme is true if there is a baseSpecies
      // but Hisuian formes with baseSpecies missing from gen8 (e.g. Voltorb) will have no baseSpecies
      isForme: baseSpeciesSlug ? undefined : !!species.forme || undefined,

      // base species for formes that have their own species entry
      // e.g. is "Raichu" for Raichu-Alola
      baseSpecies: baseSpeciesSlug,

      // name of the base forme
      // will not be set on the base forme (e.g. is null for Aegislash)
      // e.g. is "Aegislash" for Aegislash-Blade
      // only included if different from `baseSpecies`
      baseForm:
        !baseSpecies || baseSpecies.name !== species.changesFrom
          ? getSpeciesSlug(species.changesFrom, gen, extraData)
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
      isBattleOnly: isBattleOnly || undefined,
      isMega: species.isMega,
      isPrimal: species.isPrimal,
      isTotem: isTotem || undefined,
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

      cosmeticSubName: cosmeticSubName || undefined,

      // list of all cosmetic formes that _don't_ have a species entry
      // the base forme is not included in the list
      // cosmetic formes don't have their own species entry (e.g. there is no Gastrodon-East species)
      cosmeticFormes: cosmeticFormes?.length ? cosmeticFormes : undefined,

      // can't use this directly because it breaks for gmax
      // formeNum: species.formeNum || undefined,
      formeIndex,

      // we don't need the whole list, we already have the formeNum to allow sorting
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

      // name of the exclusive G-Max move
      gmaxMove,

      learnset,
    };

    result.push(entry);

    // remember available moves per pokemon for later use
    for (const moveSlug of Object.keys(entry.learnset)) {
      const pokemon = moveMap.get(moveSlug) ?? new Set<string>();

      pokemon.add(entry.slug);

      moveMap.set(moveSlug, pokemon);
    }

    // remember available abilities per pokemon for later use
    for (const abilityName of Object.values(species.abilities)) {
      const abilitySlug = getAbilitySlug(abilityName, gen);

      const pokemon = abilityMap.get(abilitySlug) ?? new Set<string>();

      pokemon.add(entry.slug);

      abilityMap.set(abilitySlug, pokemon);
    }
  }

  result = _.orderBy(result, ['num', 'formeIndex', 'slug']);
  // drop `formeIndex` after we are done sorting
  result = _.map(result, (entry) => _.omit(entry, 'formeIndex'));

  if (result.length) {
    console.log(`\twriting ${result.length} pokemon...`);
    await exportData(
      path.join(target, `gen${gen.num}`, 'pokemon.json'),
      getSpeciesIndexData(result)
    );

    console.log(`\twriting ${result.length} pokemon details...`);
    for (const entry of result) {
      await exportData(
        path.join(target, `gen${gen.num}`, 'pokemon', entry.slug + '.json'),
        entry
      );
    }
  }
}

function getSpeciesIndexData(result: object) {
  return _.map(result, (entry) =>
    _.pick(entry, [
      'slug',
      'name',
      'subName',
      'num',
      'types',
      'gen',
      'baseStats',
      'isBattleOnly',
    ])
  );
}

function shouldSkipSpecies(speciesData: { isTotem: boolean }) {
  if (speciesData.isTotem) {
    return true;
  }

  return false;
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
  baseSpecies: Specie | undefined,
  extraData: Record<string, { slug?: string }>
) {
  // direct override from extraData
  let result = extraData[species.id]?.slug;
  if (result) {
    return result;
  }

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
  gen: Generation,
  extraData: Record<string, { slug?: string }>
) {
  const species = gen.species.get(speciesName ?? '');

  if (!species) {
    return;
  }

  const baseSpecies = getBaseSpecies(species, gen);

  return getPrettySpeciesSlug(species, baseSpecies, extraData);
}

function getSpeciesSlugs(
  speciesNames: SpeciesName[] | undefined,
  gen: Generation,
  extraData: Record<string, { slug?: string }>
) {
  const result = _.map(speciesNames, (speciesName) =>
    getSpeciesSlug(speciesName, gen, extraData)
  );

  if (_.isEmpty(result)) {
    return undefined;
  }

  return result;
}

function getSpeciesName(
  species: Specie,
  baseSpecies: Specie | undefined,
  speciesData: { slug: string; isGmax?: boolean; region?: Region },
  extraData: Record<string, { name?: string }>
) {
  // direct override from extraData
  let result = extraData[speciesData.slug]?.name;
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

function getSpeciesSubName(
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

function getCosmeticSubName(
  species: Specie,
  speciesData: { slug: string },
  extraData: Record<string, { cosmeticSubName?: string }>
) {
  // direct override from extraData
  const result = extraData[speciesData.slug]?.cosmeticSubName;
  if (result) {
    return result;
  }

  if (species.cosmeticFormes?.length) {
    return species.baseForme;
  }
}

function getCosmeticFormes(
  species: Specie,
  gen: Generation,
  extraData: Record<string, { slug?: string }>,
  extraDataCosmeticFormes: Record<string, { subName?: string }>
) {
  let result = _.map(species.cosmeticFormes, (forme) => {
    const slug = getSpeciesSlug(forme, gen, extraData);

    return {
      originalSlug: forme,
      slug,
      subName: slug
        ? extraDataCosmeticFormes[slug]?.subName || undefined
        : undefined,
    };
  });

  // sort by formeOrder (which contains the orginal slugs)
  result = _.sortBy(result, (item) => {
    return _.indexOf(species.formeOrder, item.originalSlug);
  });

  // drop `formeIndex` after we are done sorting
  return _.map(result, (item) => _.omit(item, 'originalSlug'));
}

function getFormes(
  species: Specie,
  baseSpecies: Specie | undefined,
  gen: Generation,
  speciesData: { slug: string; canGmax: boolean },
  extraData: Record<string, { formes?: string[]; slug?: string }>
) {
  let result = getSpeciesSlugs(species.otherFormes, gen, extraData);

  if (speciesData.canGmax && !baseSpecies) {
    // gmax species are not in formes, so add them manually to the end
    result = [...(result ?? []), speciesData.slug + '-gmax'];
  }

  if (extraData[speciesData.slug]?.formes?.length) {
    // direct override from extraData (to handle toxtricity and urshifu with 2 gmax formes)
    result = extraData[speciesData.slug]?.formes;
  }

  return result;
}

function getFormeIndex(
  species: Specie,
  baseSpecies: Specie | undefined,
  speciesData: { isGmax: boolean }
) {
  let result = 0; // put baseSpecies first when sorting

  if (baseSpecies && baseSpecies.formeOrder?.length) {
    // there is a baseSpecies for the current species so we need to get the number

    if (speciesData.isGmax) {
      // gmax formes are not in `formeOrder` so manually put it last
      result = 1000; // hopefully nothing has 1000 formes...
    } else {
      result = _.findIndex(
        baseSpecies.formeOrder,
        (name) => name === species.name
      );
    }
  }

  return result;
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

async function getLearnset(species: Specie, gen: Generation) {
  let learnset = await gen.learnsets.learnable(species.name);

  // keep only moves that can be learned in the current gen
  learnset = _.mapValues(learnset, (how) => {
    return _.filter(how, (entry) => {
      return entry.startsWith(gen.num as unknown as string);
    });
  });

  // keep only moves that can still be learned
  learnset = _.pickBy(learnset, (how) => how.length);

  // TODO make the remaining learnset more readable

  return learnset;
}
