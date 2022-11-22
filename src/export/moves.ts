import * as path from 'path';
import * as fs from 'fs-extra';
import _ from 'lodash';
import { Generation } from '@pkmn/data';
import {
  exportData,
  moveCategoryToSlug,
  PokemonMap,
  typeNameToSlug,
} from '../utils';
import { SpeciesMap } from './pokemon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let extraData: any;

export async function exportMoves(
  gen: Generation,
  speciesMap: SpeciesMap,
  moveMap: PokemonMap
) {
  console.log('- moves');

  if (!extraData) {
    console.log('\tloading data...');
    extraData = await fs.readJson('./data/moves.json');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flavorTexts: { [key: string]: any } = {};

  if (gen.num === 9) {
    console.log('\tloading data...');

    // TODO dynamically read sub dirs instead of hardcoding gen and game here
    // move flavor texts are the same for all games in a game group
    flavorTexts.sv = await fs.readJson(
      `./data/flavorText/gen${gen.num}/sv/moves.json`
    );
  }

  const hasZMoves = gen.num === 7;
  const hasMaxMoves = gen.num === 8;

  let result = [];

  for (const move of gen.moves) {
    const isMax = hasMaxMoves && move.isMax === true;
    const isGmax = hasMaxMoves && move.isMax && typeof move.isMax === 'string';

    let baseMove;
    let exclusivePokemon;
    if (hasZMoves && move.isZ) {
      baseMove = extraData[move.id]?.baseMove;
      exclusivePokemon = extraData[move.id]?.exclusive;
    }
    if (hasMaxMoves && isGmax) {
      const slug = speciesMap.getSlugByShowdownName(move.isMax);

      if (slug) {
        exclusivePokemon = [slug];
      }
    }

    let basePower: number | undefined = move.basePower;
    if (hasZMoves && move.isZ && basePower === 1) {
      // z move power depends on the original move (unless it's a species exclusive z move)
      basePower = undefined;
    }
    if (hasMaxMoves && (isMax || isGmax)) {
      // max move power depends on the original move
      basePower = undefined;
    }

    let category: string | undefined = moveCategoryToSlug(move.category);
    if (hasZMoves && move.isZ && !exclusivePokemon) {
      // non-exclusive z moves keep the original move's category
      category = undefined;
    }
    if (hasMaxMoves && (isMax || isGmax)) {
      // max moves keep the original move's category
      category = undefined;
    }

    if (category === 'status' && basePower === 0) {
      // drop basePower for status moves
      basePower = undefined;
    }

    let pp: number | undefined = move.pp;
    if (hasZMoves && move.isZ && pp === 1) {
      // z move pp depends on the original move
      pp = undefined;
    }

    const pokemon = [...(moveMap.get(move.id) ?? [])].sort();

    const flavorText = flavorTexts.sv?.[move.id];

    const entry = {
      slug: move.id,
      name: move.name,
      gen: move.gen,
      type: typeNameToSlug(move.type),
      category,
      basePower,

      // true means doesn't use accuracy / never misses, we drop it for brevity
      accuracy: move.accuracy === true ? undefined : move.accuracy,

      pp,
      target: move.target,
      priority: move.priority,

      isZ: hasZMoves ? !!move.isZ || undefined : undefined,
      zCrystal:
        hasZMoves && move.isZ && typeof move.isZ === 'string'
          ? move.isZ
          : undefined,
      baseMove,

      // zMove.basePower is the base power the z move will have if replacing this physical/special move
      // zMove.effect is the z power effect the z move will have if replacing this status move
      // zMove.boost contains the stats that the z power effect will boost if replacing this status move
      // zMove: hasZMoves ? move.zMove || undefined : undefined,

      // appears to be unused at the moment
      // zMoveEffect: hasZMoves ? move.zMoveEffect || undefined : undefined,

      isMax: isMax || undefined,
      isGmax: isGmax || undefined,
      // maxMove.basePower is the base power the max move will have if replacing this physical/special move
      // maxMove: hasMaxMoves ? move.maxMove || undefined : undefined,

      // isNonstandard: move.isNonstandard || undefined,
      pokemon: pokemon?.length ? pokemon : undefined,
      exclusive: exclusivePokemon || undefined,
      desc: move.desc,
      shortDesc: move.shortDesc,
      flavorText: flavorText ? { sv: flavorText } : undefined,
    };

    if (shouldSkipMove(entry, { hasZMoves, hasMaxMoves })) {
      continue;
    }

    result.push(entry);
  }

  result = _.sortBy(result, 'slug');

  if (result.length) {
    console.log(`\twriting ${result.length} moves...`);
    await exportData(
      path.join(`gen${gen.num}`, 'moves.json'),
      getMovesIndexData(result)
    );

    console.log(`\twriting ${result.length} move details...`);
    for (const entry of result) {
      await exportData(
        path.join(`gen${gen.num}`, 'moves', entry.slug + '.json'),
        entry
      );
    }
  }
}

export function getMovesIndexData(result: object) {
  return _.map(result, (entry) =>
    _.pick(entry, [
      'slug',
      'name',
      'gen',
      'type',
      'category',
      'basePower',
      'accuracy',
      'isZ',
      'isMax',
      'isGmax',
      'exclusive',
    ])
  );
}

const keepUnlearnableMoves = ['struggle'];

function shouldSkipMove(
  moveData: {
    slug: string;
    pokemon: string[] | undefined;
    isZ: boolean | undefined;
    isMax: boolean | undefined;
    isGmax: boolean | undefined;
  },
  options: { hasZMoves: boolean; hasMaxMoves: boolean }
) {
  // handle moves that no pokemon can learn
  // keep z moves, max moves and g max moves even though they are not included in any learnset
  // also keep struggle

  if (
    (!moveData.pokemon || !moveData.pokemon.length) &&
    (!options.hasZMoves || !moveData.isZ) &&
    (!options.hasMaxMoves || !moveData.isMax) &&
    (!options.hasMaxMoves || !moveData.isGmax) &&
    !_.includes(keepUnlearnableMoves, moveData.slug)
  ) {
    // currently known to be filtered out this way
    // gen8: happyhour, holdback, holdhands, matblock (only available via events in past gens)

    return true;
  }

  return false;
}
