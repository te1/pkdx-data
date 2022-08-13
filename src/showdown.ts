import _ from 'lodash';
import { Dex /* , ID, ModData */ } from '@pkmn/dex';
import { Dex as SimDex } from '@pkmn/sim';
// import { ModdedDex } from '@pkmn/mods';
import { Generations, GenerationNum, Data } from '@pkmn/data';

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
  'burmysandy',
  'burmytrash',
  'wormadam',
  'wormadamsandy',
  'wormadamtrash',
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
  'unownb',
  'unownc',
  'unownd',
  'unowne',
  'unownf',
  'unowng',
  'unownh',
  'unowni',
  'unownj',
  'unownk',
  'unownl',
  'unownm',
  'unownn',
  'unowno',
  'unownp',
  'unownq',
  'unownr',
  'unowns',
  'unownt',
  'unownu',
  'unownv',
  'unownw',
  'unownx',
  'unowny',
  'unownz',
  'unownexclamation',
  'unownquestion',
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
  'meditite',
  'medicham',
  'girafarig',
];

const existsFn = (d: Data, g: GenerationNum) => {
  // from pkmn/ps/data/index.ts DEFAULT_EXISTS

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

export async function getData() {
  // weird cast for `existsFn` because the constructor has the wrong typings for exists

  const gens = new Generations(Dex, existsFn as (d: Data) => boolean);
  // const dex = Dex.mod(
  //   'gen8bdsp' as ID,
  //   (await import('@pkmn/mods/gen8bdsp')) as ModData
  // );
  // const gens = new Generations(
  //   new ModdedDex(dex),
  //   existsFn as (d: Data) => boolean
  // );

  const simGens = new Generations(
    SimDex as unknown as typeof Dex,
    existsFn as (d: Data) => boolean
  );
  const genNums: GenerationNum[] = [1, 2, 3, 4, 5, 6, 7, 8];

  const result = [];

  for (const genNum of genNums) {
    result.push({
      genNum,
      gen: gens.get(genNum),
      simGen: simGens.get(genNum),
    });
  }

  return result;
}
