import * as fs from 'fs-extra';
import { Dex } from '@pkmn/dex';
import { Generations, GenerationNum, Data } from '@pkmn/data';
import { AbilityMap } from './utils';
import { exportTypes } from './type';
import { exportNatures } from './nature';
import { exportItems } from './item';
import { exportPokemon } from './pokemon';
import { exportMoves } from './move';
import { exportAbilities } from './ability';
import _ from 'lodash';

const target = './generated/';

const existsFn = (d: Data) => {
  // from pkmn/ps/data/index.ts DEFAULT_EXISTS
  // modified to include G-Max/Unobtainable formes and Illegal/Unreleased tier
  // as a result we need to filter out Pokestar manually

  const pokestarIds = [
    'pokestarblackbelt',
    'pokestarblackdoor',
    'pokestarbrycenman',
    'pokestarf00',
    'pokestarf002',
    'pokestargiant',
    'pokestarhumanoid',
    'pokestarmonster',
    'pokestarmt',
    'pokestarmt2',
    'pokestarsmeargle',
    'pokestarspirit',
    'pokestartransport',
    'pokestarufo',
    'pokestarufo2',
    'pokestarufopropu2',
    'pokestarwhitedoor',
  ];

  if (!d.exists) {
    return false;
  }

  const allowNonstandardSpecies =
    d.kind === 'Species' &&
    d.isNonstandard &&
    _.includes(['Gigantamax', 'Unobtainable'], d.isNonstandard) &&
    !_.includes(pokestarIds, d.id);

  const allowNonstandardMove =
    d.kind === 'Move' && d.isNonstandard && 'Gigantamax' === d.isNonstandard;

  const allowNonstandard = allowNonstandardSpecies || allowNonstandardMove;

  if ('isNonstandard' in d && d.isNonstandard && !allowNonstandard) {
    return false;
  }

  if (d.kind === 'Ability' && d.id === 'noability') {
    return false;
  }

  return true;
};

const gens = new Generations(Dex, existsFn);
const genNums: GenerationNum[] = [1, 2, 3, 4, 5, 6, 7, 8];

async function main() {
  try {
    await fs.emptyDir(target);

    for (const genNum of genNums) {
      const abilityMap: AbilityMap = new Map();

      const gen = gens.get(genNum);

      console.log(`*** gen ${genNum} ***`);

      await exportTypes(gen, target);
      await exportNatures(gen, target);
      await exportItems(gen, target);
      await exportPokemon(gen, target, abilityMap);
      await exportMoves(gen, target);
      await exportAbilities(gen, target, abilityMap);

      console.log('');
    }

    console.log('done');
  } catch (err) {
    console.error(err);
  }
}

main();
