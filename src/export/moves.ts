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
  // const data = await fs.readJson(`./data/move.json`);

  const hasZMoves = gen.num === 7;
  const hasMaxMoves = gen.num === 8;

  let result = [];

  for (const move of gen.moves) {
    const entry = {
      slug: move.id,
      name: move.name,
      gen: move.gen,
      type: typeNameToSlug(move.type),
      category: moveCategoryToSlug(move.category),
      basePower: move.basePower,
      accuracy: move.accuracy === true ? undefined : move.accuracy,
      pp: move.pp,
      target: move.target,
      priority: move.priority,
      isZ: undefined as unknown,
      zMove: undefined as unknown,
      zMoveEffect: undefined as unknown,
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
      entry.zMoveEffect = move.zMoveEffect;
    }

    if (hasMaxMoves) {
      // TODO Max Moves
      entry.isMax = move.isMax || undefined;
      entry.maxMove = move.maxMove;

      // TODO G-Max Moves
    }

    // TODO pokemon

    result.push(entry);
  }

  result = _.sortBy(result, 'slug');

  if (result.length) {
    console.log(`\twriting ${result.length} moves...`);
    await exportData(path.join(target, `gen${gen.num}`, 'moves.json'), result);
  }
}
