import * as fs from 'fs-extra';
import _ from 'lodash';
import { Dex } from '@pkmn/dex';
import { Generations, GenerationNum, Data } from '@pkmn/data';
import { AbilityMap } from './utils';
import { exportTypes } from './type';
import { exportNatures } from './nature';
import { exportItems } from './item';
import { exportPokemon } from './pokemon';
import { exportMoves } from './move';
import { exportAbilities } from './ability';

const target = './generated/';

const existsFn = (d: Data, g: GenerationNum) => {
  // from pkmn/ps/data/index.ts DEFAULT_EXISTS

  const excludeSpeciesId = [
    'missingno',
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

  // include G-Max and Unobtainable formes
  // include Illegal and Unreleased tier
  // exclude Pokestar and missingno
  const allowNonstandardSpecies =
    d.kind === 'Species' &&
    d.isNonstandard &&
    _.includes(['Gigantamax', 'Unobtainable'], d.isNonstandard) &&
    !_.includes(excludeSpeciesId, d.id);

  // include Legends Arceus species
  const allowFutureSpecies =
    g === 8 &&
    d.kind === 'Species' &&
    d.isNonstandard &&
    'Future' === d.isNonstandard;

  // include G-Max moves
  const allowNonstandardMove =
    d.kind === 'Move' && d.isNonstandard && 'Gigantamax' === d.isNonstandard;

  const allowNonstandard =
    allowNonstandardSpecies || allowFutureSpecies || allowNonstandardMove;

  if ('isNonstandard' in d && d.isNonstandard && !allowNonstandard) {
    return false;
  }

  if (d.kind === 'Ability' && d.id === 'noability') {
    return false;
  }

  return true;
};

// weird cast because the constructor has the wrong typings for exists
const gens = new Generations(Dex, existsFn as (d: Data) => boolean);
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

    // TODO export pokedex
    // TODO export HM/TM/TR
    // TODO create index and detail files
    // TODO handle gen9 preview

    console.log('done');
  } catch (err) {
    console.error(err);
  }
}

main();
