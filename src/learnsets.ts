import _ from 'lodash';
import { Generation, MoveSource, Specie } from '@pkmn/data';
import { SpeciesMap } from './export/pokemon';

interface Learnset {
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

// TODO learnsets
// - opt out of learnset merging? use learnsets.get(species.id) then manually merge prevo and mark them?
// - remove battle only formes from move.pokemon?

export async function getMergedLearnset(
  species: Specie | undefined,
  gen: Generation,
  speciesMap: SpeciesMap,
  override: Record<string, { mergeLearnsetFrom?: string }>
): Promise<Learnset> {
  let merged: Learnset = {};

  if (!species) {
    return merged;
  }

  const learnsets = await getLearnsets(species, gen, speciesMap, override);

  for (const item of learnsets) {
    for (const [moveSlug, moveSources] of Object.entries(item.learnset)) {
      if (merged[moveSlug]) {
        const unique = [];

        // loop label to break out of the outer loop in the inner loop
        loop: for (const moveSource of moveSources) {
          const prefix = moveSource.slice(0, 1);

          for (const existingMoveSource of merged[moveSlug]) {
            if (existingMoveSource.startsWith(prefix)) {
              continue loop;
            }
          }

          unique.push(moveSource);
        }

        merged[moveSlug].push(...unique);
      } else {
        merged[moveSlug] = moveSources;
      }
    }
  }

  // drop S if there are other ways to learn the move
  merged = _.mapValues(merged, (moveSources) => {
    if (moveSources.length > 1) {
      moveSources = _.reject(moveSources, (moveSource) => moveSource === 'S');
    }

    return moveSources;
  });

  if (_.size(merged)) {
    // sort by move slug for consistency
    return _(merged).toPairs().sortBy(0).fromPairs().value();
  }

  // learnset is empty, try learnset of baseForm
  if (species.changesFrom && species.changesFrom !== species.name) {
    return await getMergedLearnset(
      gen.species.get(species.changesFrom),
      gen,
      speciesMap,
      override
    );
  }

  // learnset is empty, try learnset of baseSpecies
  if (species.baseSpecies && species.baseSpecies !== species.name) {
    return await getMergedLearnset(
      gen.species.get(species.baseSpecies),
      gen,
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
  speciesMap: SpeciesMap,
  override: Record<string, { mergeLearnsetFrom?: string }>
): Promise<Learnsets> {
  const learnsets: Learnsets = [];

  let currentSpecies: Specie | undefined = species;

  while (currentSpecies) {
    const learnset = await getLearnset(currentSpecies, gen);

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
    } else if (currentSpecies.prevo) {
      currentSpecies = gen.species.get(currentSpecies.prevo);
    } else {
      currentSpecies = undefined;
    }
  }

  return learnsets;
}

async function getLearnset(
  species: Specie,
  gen: Generation
): Promise<Learnset | undefined> {
  let learnset = (await gen.learnsets.get(species.id))?.learnset;

  if (!learnset) {
    return;
  }

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

      // drop event number
      if (result.startsWith('S')) {
        result = 'S';
      }

      // add : to make it easier to split identifier and value (only applies to L)
      if (result.length > 1) {
        result = result.charAt(0) + ':' + result.substring(1);
      }

      return result;
    });

    // drop duplicates (meaning S)
    result = _.uniq(result);

    // drop S if there are other ways to learn the move
    if (result.length > 1) {
      result = _.reject(result, (moveSource) => moveSource === 'S');
    }

    return result;
  });

  return learnset;
}
