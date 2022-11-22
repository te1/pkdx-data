import _ from 'lodash';
import { Dex, ID, ModData } from '@pkmn/dex';
import { Dex as SimDex, ID as SimID, ModData as SimModData } from '@pkmn/sim';
import { ModdedDex } from '@pkmn/mods';
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

const includeSpeciesIdGen8Future = [
  'growlithehisui',
  'arcaninehisui',
  'voltorbhisui',
  'electrodehisui',
  'typhlosionhisui',
  'qwilfishhisui',
  'sneaselhisui',
  'dialgaorigin',
  'palkiaorigin',
  'samurotthisui',
  'lilliganthisui',
  'basculinwhitestriped',
  'zoruahisui',
  'zoroarkhisui',
  'braviaryhisui',
  'sliggoohisui',
  'goodrahisui',
  'avalugghisui',
  'decidueyehisui',
  'wyrdeer',
  'kleavor',
  'ursaluna',
  'basculegion',
  'basculegionf',
  'sneasler',
  'overqwil',
  'enamorus',
  'enamorustherian"',
];

const includeSpeciesIdGen8Past = [
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

const existsFn = ((d: Data, g: GenerationNum) => {
  // from pkmn/ps/data/index.ts DEFAULT_EXISTS

  if (!d.exists) {
    return false;
  }

  // include Unobtainable formes (Illegal and Unreleased tier)
  // exclude Pokestar and missingno
  const allowUnobtainableSpecies =
    d.kind === 'Species' &&
    d.isNonstandard === 'Unobtainable' &&
    !_.includes(excludeSpeciesId, d.id);

  // include Let's Go species
  const allowLetsGoSpecies =
    g === 7 && d.kind === 'Species' && d.isNonstandard === 'LGPE';

  // include G-Max formes
  const allowGmaxSpecies =
    g === 8 && d.kind === 'Species' && d.isNonstandard === 'Gigantamax';

  const allowNonstandardSpecies =
    allowUnobtainableSpecies || allowLetsGoSpecies || allowGmaxSpecies;

  // include new Legends Arceus species
  const allowFutureSpecies =
    g === 8 &&
    d.kind === 'Species' &&
    d.isNonstandard &&
    'Future' === d.isNonstandard &&
    _.includes(includeSpeciesIdGen8Future, d.id);

  // include returning Legends Arceus / BDSP species
  const allowPastSpecies =
    g === 8 &&
    d.kind === 'Species' &&
    d.isNonstandard &&
    'Past' === d.isNonstandard &&
    _.includes(includeSpeciesIdGen8Past, d.id);

  // include G-Max moves
  const allowNonstandardMove =
    g === 8 &&
    d.kind === 'Move' &&
    d.isNonstandard &&
    'Gigantamax' === d.isNonstandard;

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
}) as (d: Data) => boolean;
// weird cast because the Generations constructor has the wrong typings

export async function getShowdownData() {
  // use @pkmn/data on top of @pkmn/dex for most things
  const gens = new Generations(Dex, existsFn);

  // use @pkmn/data on top of @pkmn/sim for height
  const simGens = new Generations(SimDex as unknown as typeof Dex, existsFn);

  // use @pkmn/data on top of @pkmn/dex with @pkmn/mods for bdsp
  const dexBdsp = Dex.mod(
    'gen8bdsp' as ID,
    (await import('@pkmn/mods/gen8bdsp')) as ModData
  );
  const gensBdsp = new Generations(new ModdedDex(dexBdsp), existsFn);

  // use @pkmn/data on top of @pkmn/sim with @pkmn/mods for bdsp heights
  const simDexBdsp = SimDex.mod(
    'gen8bdsp' as SimID,
    (await import('@pkmn/mods/gen8bdsp')) as SimModData
  );
  const simGensBdsp = new Generations(
    new ModdedDex(simDexBdsp as unknown as typeof Dex),
    existsFn
  );

  const genNums: GenerationNum[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const result = [];

  for (const genNum of genNums) {
    result.push({
      genNum,
      gen: gens.get(genNum),
      simGen: simGens.get(genNum),
      genBdsp: genNum === 8 ? gensBdsp.get(genNum) : undefined,
      simGenBdsp: genNum === 8 ? simGensBdsp.get(genNum) : undefined,
    });
  }

  return result;
}
