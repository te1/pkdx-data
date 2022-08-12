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

export async function exportMoves(
  gen: Generation,
  target: string,
  moveMap: PokemonMap
) {
  console.log('- moves');

  console.log('\tloading data...');
  const extraData = await fs.readJson(`./data/moves.json`);

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
      exclusivePokemon = [move.isMax];
    }

    let basePower: number | undefined = move.basePower;
    if (hasZMoves && move.isZ && basePower === 1) {
      // z move power depends on the original move (unless it's a species exclusive z move)
      basePower = undefined;
    }

    let category: string | undefined = moveCategoryToSlug(move.category);
    if (hasZMoves && move.isZ && !exclusivePokemon) {
      // non-exclusive z moves keep the original move's category
      category = undefined;
    }

    let pp: number | undefined = move.pp;
    if (hasZMoves && move.isZ && pp === 1) {
      // z move pp depends on the original move
      pp = undefined;
    }

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
      pokemon: moveMap.get(move.id),
      exclusive: exclusivePokemon || undefined,
      desc: move.desc,
      shortDesc: move.shortDesc,

      // TODO add move flavor text
      // flavorText: extraData[move.id]?.flavorText,
    };

    result.push(entry);

    // TODO handle moves that no pokemon can learn
    // if (!entry.pokemon || !entry.pokemon.size) {
    //   console.log(entry.name);
    // }
  }

  result = _.sortBy(result, 'slug');

  if (result.length) {
    console.log(`\twriting ${result.length} moves...`);
    await exportData(
      path.join(target, `gen${gen.num}`, 'moves.json'),
      getMovesIndexData(result)
    );

    // console.log(`\twriting ${result.length} move details...`);
    // for (const entry of result) {
    //   await exportData(
    //     path.join(target, `gen${gen.num}`, 'moves', entry.slug + '.json'),
    //     entry
    //   );
    // }
  }
}

function getMovesIndexData(result: object) {
  return result;

  // TODO split export in index and details
  // return _.map(result, (entry) =>
  //   _.pick(entry, [
  //     'slug',
  //     'name',
  //     'gen',
  //     'type',
  //     'category',
  //     'basePower',
  //     'accuracy',
  //   ])
  // );
}
