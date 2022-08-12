import * as path from 'path';
// import * as fs from 'fs-extra';
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

  // TODO add move flavor text
  // console.log('\tloading data...');
  // const data = await fs.readJson(`./data/moves.json`);

  const hasZMoves = gen.num === 7;
  const hasMaxMoves = gen.num === 8;

  let result = [];

  for (const move of gen.moves) {
    let basePower: number | undefined = move.basePower;
    if (hasZMoves && move.isZ && basePower === 1) {
      // z move power depends on the original move (unless it's a species exclusive z move)
      basePower = undefined;
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
      category: moveCategoryToSlug(move.category),
      basePower,
      accuracy: move.accuracy === true ? undefined : move.accuracy,
      pp,
      target: move.target,
      priority: move.priority,

      isZ: undefined as unknown,
      zMove: undefined as unknown,

      // appears to be unused at the moment
      // zMoveEffect: hasZMoves ? move.zMoveEffect || undefined : undefined,

      isMax: undefined as unknown,
      maxMove: undefined as unknown,

      // isNonstandard: move.isNonstandard || undefined,
      pokemon: moveMap.get(move.id),
      desc: move.desc,
      shortDesc: move.shortDesc,
      // flavorText: data[move.id]?.flavorText,
    };

    if (hasZMoves) {
      // TODO Z Moves
      entry.isZ = move.isZ || undefined;
      entry.zMove = move.zMove;
    }

    if (hasMaxMoves) {
      // TODO Max Moves
      entry.isMax = move.isMax || undefined;
      entry.maxMove = move.maxMove;

      // TODO G-Max Moves
    }

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
