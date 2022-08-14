import * as fs from 'fs-extra';
import _ from 'lodash';
import { Generation, MoveSource, Specie } from '@pkmn/data';
import { SpeciesMap } from './export/pokemon';

export interface Learnset {
  [moveid: string]: MoveSource[];
}

interface LearnsetData {
  species: Specie;
  learnset: Learnset;
}

type Learnsets = LearnsetData[];

/* Showdown learnset patterns (aka `MoveSource`)
- `M` learned from Machine (TM/HM/TR)
- `T` taught by Tutor
- `E` Egg move
- `R` Restricted, meaning additional conditions may apply
- `Lx` learned by leveling up to Level x
- `Sx` only available as part of a Special event / promotion (x is the event number for this species)
- `V` Virtual console / past generation only
- `D` Dream world / gen5 browser game
*/

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let extraData: any;

export async function getMergedLearnset(
  species: Specie | undefined,
  gen: Generation,
  modGen: Generation | undefined,
  speciesMap: SpeciesMap,
  override: Record<string, { mergeLearnsetFrom?: string }>
): Promise<Learnset> {
  if (!extraData) {
    console.log('\tloading data...');
    extraData = await fs.readJson('./data/learnsets.json');
  }

  let merged: Learnset = {};

  if (!species) {
    return merged;
  }

  const learnsets = await getLearnsets(
    species,
    gen,
    modGen,
    speciesMap,
    override
  );
  const originalSlug = speciesMap.getSlugByShowdownId(species.id);

  for (const item of learnsets) {
    const mergedSlug = speciesMap.getSlugByShowdownId(item.species.id);

    for (const [moveSlug, moveSources] of Object.entries(item.learnset)) {
      if (!merged[moveSlug]) {
        merged[moveSlug] = [];
      }

      const unique = [];

      // loop label to break out of the outer loop in the inner loop
      loop: for (const moveSource of moveSources) {
        const prefix = moveSource.slice(0, 1);

        for (const existingMoveSource of merged[moveSlug]) {
          if (existingMoveSource.startsWith(prefix)) {
            continue loop;
          }
        }

        let formatted = moveSource;

        if (
          species.id !== item.species.id &&
          mergedSlug &&
          mergedSlug !== override[originalSlug ?? '']?.mergeLearnsetFrom
        ) {
          formatted = `${formatted}@${mergedSlug}`;
        }

        unique.push(formatted);
      }

      merged[moveSlug].push(...unique);
    }
  }

  // drop S if there are other ways to learn the move
  merged = _.mapValues(merged, (moveSources) => {
    if (moveSources.length > 1) {
      moveSources = _.reject(moveSources, (moveSource) =>
        moveSource.startsWith('S')
      );
    }

    return moveSources;
  });

  if (_.size(merged)) {
    // sort by move slug for consistency
    return _(merged).toPairs().sortBy(0).fromPairs().value();
  }

  // learnset is empty, try learnset of baseForm (used by darmanitan-galar-zen, toxtricity-low-key-gmax, ...)
  if (species.changesFrom && species.changesFrom !== species.name) {
    return await getMergedLearnset(
      gen.species.get(species.changesFrom),
      gen,
      modGen,
      speciesMap,
      override
    );
  }

  // learnset is empty, try learnset of baseSpecies (used for pumpkabo-large, kyogre-primal, ...)
  if (species.baseSpecies && species.baseSpecies !== species.name) {
    return await getMergedLearnset(
      gen.species.get(species.baseSpecies),
      gen,
      modGen,
      speciesMap,
      override
    );
  }

  // empty learnset
  return merged;
}

async function getLearnsets(
  species: Specie,
  gen: Generation,
  modGen: Generation | undefined,
  speciesMap: SpeciesMap,
  override: Record<string, { mergeLearnsetFrom?: string }>
): Promise<Learnsets> {
  const learnsets: Learnsets = [];

  let currentSpecies: Specie | undefined = species;

  while (currentSpecies) {
    const learnset = await getLearnset(currentSpecies, gen, modGen, speciesMap);

    if (learnset) {
      learnsets.push({
        species: currentSpecies,
        learnset,
      });
    }

    const mergeLearnsetFrom =
      override[speciesMap.getSlugByShowdownName(currentSpecies.name) || '']
        ?.mergeLearnsetFrom;

    if (mergeLearnsetFrom) {
      currentSpecies = gen.species.get(mergeLearnsetFrom);
    } else if (currentSpecies.prevo && currentSpecies.forme !== 'Hisui') {
      currentSpecies = gen.species.get(currentSpecies.prevo);
    } else {
      currentSpecies = undefined;
    }
  }

  return learnsets;
}

async function getLearnset(
  species: Specie,
  gen: Generation,
  modGen: Generation | undefined,
  speciesMap: SpeciesMap
): Promise<Learnset | undefined> {
  let learnset: Learnset | undefined;

  const slug = speciesMap.getSlugByShowdownName(species.name);

  if (slug) {
    // use manually defined learnset (for la)
    learnset = extraData[slug];
  }

  if (!learnset) {
    learnset = (await gen.learnsets.get(species.id))?.learnset;
  }

  if (!learnset) {
    return;
  }

  learnset = prepareLearnset(learnset, gen);

  if (!learnset && gen.num === 8 && modGen) {
    // learnset is empty, try bdps mod learnset instead
    learnset = (await modGen.learnsets.get(species.id))?.learnset;

    if (learnset) {
      learnset = prepareLearnset(learnset, gen);
    }
  }

  return learnset;
}

function prepareLearnset(learnset: Learnset, gen: Generation) {
  // keep only moves that can be learned in the current gen
  learnset = _.mapValues(learnset, (moveSources) => {
    return _.filter(moveSources, (moveSource) => {
      return (
        moveSource.startsWith(gen.num as unknown as string) && // skip past generations
        moveSource !== `${gen.num}V` && // skip Virtual Console
        moveSource !== `${gen.num}D` // skip Dream World
      );
    });
  });

  // keep only moves that can still be learned
  learnset = _.pickBy(learnset, (moveSources) => moveSources.length);

  if (!_.size(learnset)) {
    return;
  }

  // make the remaining learnset more readable
  learnset = _.mapValues(learnset, (moveSources) => {
    let result = _.map(moveSources, (moveSource) => {
      let result = moveSource;

      // drop gen number
      result = result.substring(1);

      // drop event number from Sx
      if (result.startsWith('S')) {
        result = 'S';
      }

      // add : to make it easier to split identifier and value (applies to Lx)
      if (result.length > 1) {
        result = result.charAt(0) + ':' + result.substring(1);
      }

      return result;
    });

    // drop duplicates (can only happen for S)
    result = _.uniq(result);

    return result;
  });

  return learnset;
}
