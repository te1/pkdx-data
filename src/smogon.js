const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const { getName, exportData } = require('./utils');

let all, pokemonDetails;

function getTypeName(id) {
  let type = all.types[id];

  return getName(type.name);
}

function getAbilityName(id) {
  let ability = all.abilities[id];

  return getName(ability.name);
}

function getMoveName(id) {
  let move = all.moves[id];

  return getName(move.name);
}

function getSpeciesName(id) {
  let species = all.species[id];

  return getName(species.name);
}

async function exportAbilities(target, data) {
  console.log(`processing ${data.length} abilities...`);

  let index = [];
  let details = [];
  let obj, pokemon;

  _.forEach(data, (ability, id) => {
    if (ability.isNonstandard) {
      return;
    }

    obj = {
      id,
      name: getName(ability.name),
      caption: ability.name,
    };

    index.push(obj);

    pokemon = _.filter(pokemonDetails, pkmn => {
      return _.includes(_.values(pkmn.abilities), obj.name);
    });
    pokemon = _.sortBy(pokemon, 'name');
    pokemon = _.map(pokemon, 'name');

    details.push({
      ...obj,
      desc: ability.desc,
      shortDesc: ability.shortDesc,
      pokemon,
    });
  });

  console.log(`writing ${index.length} abilities...`);
  await exportData(path.join(target, 'ability/index.json'), index);

  console.log(`writing ${details.length} ability details...\n`);
  for (const ability of details) {
    await exportData(
      path.join(target, 'ability', ability.name + '.json'),
      ability
    );
  }
}

async function exportMoves(target, data) {
  console.log(`processing ${data.length} moves...`);

  let index = [];
  let details = [];
  let obj, accuracy, pokemon;

  _.forEach(data, (move, id) => {
    if (!move || move.isNonstandard) {
      return;
    }

    accuracy = move.accuracy === 'Bypass' ? null : move.accuracy;

    obj = {
      id,
      name: getName(move.name),
      caption: move.name,
      type: getTypeName(move.type),
      category: getName(move.category),
      accuracy,
      basePower: move.basePower,
      pp: move.pp,
    };

    index.push(obj);

    pokemon = _.filter(pokemonDetails, pkmn => {
      return _.some(pkmn.learnset, { what: obj.name });
    });
    pokemon = _.sortBy(pokemon, 'name');
    pokemon = _.map(pokemon, 'name');

    details.push({
      ...obj,
      priority: move.priority,
      target: getName(move.target),
      desc: move.desc,
      shortDesc: move.shortDesc,
      pokemon,
    });
  });

  console.log(`writing ${index.length} moves...`);
  await exportData(path.join(target, 'move/index.json'), index);

  console.log(`writing ${details.length} move details...\n`);
  for (const move of details) {
    await exportData(path.join(target, 'move', move.name + '.json'), move);
  }
}

async function exportPokemon(target, data) {
  console.log(`processing ${data.length} pokemon...`);

  let index = [];
  let details = [];
  let obj, isBattleOnly, abilities, evos, prevo, altBattleFormes, learnset;

  _.forEach(data, (pkmn, id) => {
    if (!pkmn || pkmn.isNonstandard) {
      return;
    }

    isBattleOnly = pkmn.isBattleOnly || undefined;

    obj = {
      id,
      name: getName(pkmn.name),
      caption: pkmn.name,
      types: _.map(pkmn.types, getTypeName),
      num: pkmn.num,
      isBattleOnly,
    };

    index.push(obj);

    abilities = {};
    if (pkmn.abilities[0]) {
      abilities['1'] = getAbilityName(pkmn.abilities[0]);
    }
    if (pkmn.abilities[1]) {
      abilities['2'] = getAbilityName(pkmn.abilities[1]);
    }
    if (pkmn.abilities[2]) {
      abilities['H'] = getAbilityName(pkmn.abilities[2]);
    }

    evos = pkmn.evos.length ? _.map(pkmn.evos, getSpeciesName) : undefined;
    prevo = pkmn.prevo != null ? getSpeciesName(pkmn.prevo) : undefined;

    altBattleFormes = pkmn.altBattleFormes.length
      ? _.map(pkmn.altBattleFormes, getSpeciesName)
      : undefined;

    learnset = _.map(pkmn.learnset, entry => {
      return {
        how: entry.how,
        what: getMoveName(entry.what),
      };
    });

    details.push({
      ...obj,
      altBattleFormes,
      desc: pkmn.desc,
      shortDesc: pkmn.shortDesc,
      baseStats: pkmn.baseStats,
      abilities,
      evos,
      prevo,
      height: pkmn.heightm,
      weight: pkmn.weightkg,
      learnset,
    });
  });

  index = _.orderBy(index, 'num');
  details = _.orderBy(details, 'num');

  console.log(`writing ${index.length} pokemon...`);
  await exportData(path.join(target, 'pokemon/index.json'), index);

  console.log(`writing ${details.length} pokemon details...\n`);
  for (const pkmn of details) {
    await exportData(path.join(target, 'pokemon', pkmn.name + '.json'), pkmn);
  }

  pokemonDetails = details;
}

async function exportItems(target, data) {
  console.log(`processing ${data.length} items...`);

  let index = [];
  let details = [];
  let obj;

  _.forEach(data, (item, id) => {
    if (!item || item.isNonstandard) {
      return;
    }

    obj = {
      id,
      name: getName(item.name),
      caption: item.name,
    };

    index.push(obj);

    details.push({
      ...obj,
      desc: item.desc,
      shortDesc: item.shortDesc,
    });
  });

  console.log(`writing ${index.length} items...`);
  await exportData(path.join(target, 'item/index.json'), index);

  console.log(`writing ${details.length} item details...\n`);
  for (const item of details) {
    await exportData(path.join(target, 'item', item.name + '.json'), item);
  }
}

async function exportPokedex(target) {
  console.log('loading data...');
  let data = await fs.readJson('./in/static/8/pokedex/swsh.json');

  console.log(`processing ${data.length} entries...`);

  let pkmn;

  data = _.map(data, item => {
    pkmn = _.find(pokemonDetails, { name: item.name });

    if (pkmn) {
      item.national = pkmn.num;
      item.id = pkmn.id;
    }

    return item;
  });

  console.log(`writing ${data.length} entries...\n`);
  await exportData(path.join(target, 'pokedex/swsh.json'), data);
}

async function exportAll(target) {
  console.log('loading data...\n');
  all = await fs.readJson('./in/smogon-data/8.json');

  await exportPokemon(target, all.species);
  await exportAbilities(target, all.abilities);
  await exportMoves(target, all.moves);
  await exportItems(target, all.items);
  await exportPokedex(target);

  console.log('done\n');
}

module.exports = exportAll;
