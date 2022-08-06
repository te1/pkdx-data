import * as path from 'path';
// import * as fs from 'fs-extra';
import * as _ from 'lodash';
import { Generation } from '@pkmn/data';
import { exportData, moveCategoryToSlug, typeNameToSlug } from './utils';

interface MoveEntry {
  slug: string;
  name: string;
  gen: number;
  type: string;
  category: string;
  basePower: number;
  accuracy: number | true;
  pp: number;
  target: string;
  priority: number;

  isZ?: unknown;
  zMove?: unknown;
  zMoveEffect?: unknown;

  isMax?: unknown;
  maxMove?: unknown;

  desc?: string;
  shortDesc?: string;
  // flavorText?: string;
}

export async function exportMoves(gen: Generation, target: string) {
  console.log('- moves');

  // TODO add move flavor text
  // console.log('\t' + 'loading data...');
  // const data = await fs.readJson(`./data/move.json`);

  const hasZMoves = gen.num === 7;
  const hasMaxMoves = gen.num === 8;

  let result = [];

  for (const move of gen.moves) {
    const entry: MoveEntry = {
      slug: move.id,
      name: move.name,
      gen: move.gen,
      type: typeNameToSlug(move.type),
      category: moveCategoryToSlug(move.category),
      basePower: move.basePower,
      accuracy: move.accuracy,
      pp: move.pp,
      target: move.target,
      priority: move.priority,
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

    entry.desc = move.desc;
    entry.shortDesc = move.shortDesc;
    // entry.flavorText = data[move.id]?.flavorText;

    result.push(entry);
  }

  result = _.sortBy(result, 'slug');

  if (result.length) {
    console.log('\t' + `writing ${result.length} moves...`);
    await exportData(path.join(target, `gen${gen.num}`, 'move.json'), result);
  }
}
