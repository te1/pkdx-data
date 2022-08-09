import * as fs from 'fs-extra';
import _ from 'lodash';
import { Dex } from '@pkmn/dex';
import { Dex as SimDex } from '@pkmn/sim';
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

  const includeSpeciesId = [
    'cyndaquil',
    'oshawott',
    'dewott',
    'bidoof',
    'bibarel',
    'starly',
    'staravia',
    'staraptor',
    'wurmple',
    'silcoon',
    'beautifly',
    'cascoon',
    'dustox',
    'kricketot',
    'kricketune',
    'buizel',
    'floatzel',
    'burmy',
    'wormadam',
    'mothim',
    'geodude',
    'graveler',
    'golem',
    'stantler',
    'paras',
    'parasect',
    'aipom',
    'ambipom',
    'carnivine',
    'yanma',
    'yanmega',
    'pachirisu',
    'teddiursa',
    'ursaring',
    'turtwig',
    'grotle',
    'torterra',
    'murkrow',
    'honchkrow',
    'unown',
    'glameow',
    'purugly',
    'chatot',
    'piplup',
    'prinplup',
    'empoleon',
    'finneon',
    'lumineon',
    'gligar',
    'gliscor',
    'nosepass',
    'probopass',
    'chingling',
    'chimecho',
    'misdreavus',
    'mismagius',
    'cranidos',
    'rampardos',
    'shieldon',
    'bastiodon',
    'arceus',
    'phione',
    'manaphy',
    'shaymin',
    'darkrai',
    'girafarig',
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

  // include new Legends Arceus species
  const allowFutureSpecies =
    g === 8 &&
    d.kind === 'Species' &&
    d.isNonstandard &&
    'Future' === d.isNonstandard;

  // include returning Legends Arceus / BDSP species
  const allowPastSpecies =
    g === 8 &&
    d.kind === 'Species' &&
    d.isNonstandard &&
    'Past' === d.isNonstandard &&
    _.includes(includeSpeciesId, d.id);

  // include G-Max moves
  const allowNonstandardMove =
    d.kind === 'Move' && d.isNonstandard && 'Gigantamax' === d.isNonstandard;

  const allowNonstandard =
    allowNonstandardSpecies ||
    allowFutureSpecies ||
    allowPastSpecies ||
    allowNonstandardMove;

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
const simGens = new Generations(
  SimDex as unknown as typeof Dex,
  existsFn as (d: Data) => boolean
);
const genNums: GenerationNum[] = [1, 2, 3, 4, 5, 6, 7, 8];

async function main() {
  try {
    await fs.emptyDir(target);

    for (const genNum of genNums) {
      const abilityMap: AbilityMap = new Map();

      const gen = gens.get(genNum);
      const simGen = simGens.get(genNum);

      console.log(`*** gen ${genNum} ***`);

      await exportTypes(gen, target);
      await exportNatures(gen, target);
      await exportItems(gen, target);
      await exportPokemon(gen, simGen, target, abilityMap);
      await exportMoves(gen, target);
      await exportAbilities(gen, target, abilityMap);

      console.log('');
    }

    // TODO export games
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
