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
  console.log('loading data...');
  let gen = await fs.readJson('./in/static/8/ability/gen.json');

  console.log(`processing ${data.length} abilities...`);

  let index = [];
  let details = [];
  let obj, pokemon, temp;

  _.forEach(data, (ability) => {
    if (!ability) {
      return;
    }
    if (ability.isNonstandard) {
      // console.warn('\t', 'Non standard', ability.name, '-' , ability.isNonstandard);
      return;
    }

    obj = {
      name: getName(ability.name),
      caption: ability.name,
    };

    // Gen
    temp = _.find(gen, { name: obj.name });
    if (temp) {
      obj.gen = temp.gen;
    } else {
      console.warn('\t', 'no gen for', obj.caption);
    }

    index.push(obj);

    pokemon = _.filter(pokemonDetails, (pkmn) => {
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
  await exportData(path.join(target, 'ability/_index.json'), index);

  console.log(`writing ${details.length} ability details...\n`);
  for (const ability of details) {
    await exportData(
      path.join(target, 'ability', ability.name + '.json'),
      ability
    );
  }
}

async function exportMoves(target, data) {
  console.log('loading data...');
  let gen = await fs.readJson('./in/static/8/move/gen.json');
  let max = await fs.readJson('./in/static/8/move/max.json');
  let gmax = await fs.readJson('./in/static/8/move/gmax.json');
  let tm = await fs.readJson('./in/static/8/tm.json');
  let tr = await fs.readJson('./in/static/8/tr.json');

  console.log(`processing ${data.length} moves...`);

  let index = [];
  let details = [];
  let obj, accuracy, tags, exclusive, pokemon, temp;

  _.forEach(data, (move) => {
    if (!move) {
      return;
    }
    if (move.isNonstandard && move.isNonstandard !== 'Gigantamax') {
      // console.warn('\t', 'Non standard', move.name, '-', move.isNonstandard);
      return;
    }

    accuracy = move.accuracy === 'Bypass' ? null : move.accuracy;

    obj = {
      name: getName(move.name),
      caption: move.name,
      type: getTypeName(move.type),
      category: getName(move.category),
      accuracy,
      basePower: move.basePower,
      pp: move.pp,
    };

    // Gen
    temp = _.find(gen, { name: obj.name });
    if (temp) {
      obj.gen = temp.gen;
    } else {
      console.warn('\t', 'no gen for', obj.caption);
    }

    // Max / G-Max moves
    tags = [];
    exclusive = [];

    if (_.includes(max, obj.name)) {
      tags.push('max');

      // depends on base move that is replaced
      obj.category = null;
      obj.accuracy = null;
      obj.basePower = null;
    }

    temp = _.find(gmax, { move: obj.name });
    if (temp) {
      tags.push('gmax');
      exclusive.push(temp.pokemon);

      // depends on base move that is replaced
      obj.category = null;
      obj.accuracy = null;
      obj.basePower = null;
    }

    if (tags.length) {
      obj.tags = tags;
    }
    if (exclusive.length) {
      obj.exclusive = exclusive;
    }

    // TM
    temp = _.find(tm, { move: obj.name });
    if (temp) {
      obj.tm = temp.num;
    }

    // TR
    temp = _.find(tr, { move: obj.name });
    if (temp) {
      obj.tr = temp.num;
    }

    pokemon = _.filter(pokemonDetails, (pkmn) => {
      return _.some(pkmn.learnset, { what: obj.name });
    });
    pokemon = _.sortBy(pokemon, 'name');
    pokemon = _.map(pokemon, 'name');

    // dont export unlearnable moves, but keep max and g-max moves
    if (
      !pokemon.length &&
      !_.includes(tags, 'max') &&
      !_.includes(tags, 'gmax')
    ) {
      // console.warn('\t', 'Unlearnable move', obj.caption);
      return; // continue
    }

    index.push(obj);

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
  await exportData(path.join(target, 'move/_index.json'), index);

  console.log(`writing ${details.length} move details...\n`);
  for (const move of details) {
    await exportData(path.join(target, 'move', move.name + '.json'), move);
  }
}

async function exportPokemon(target, data) {
  console.log('loading data...');
  let gen = await fs.readJson('./in/static/8/pokemon/gen.json');
  let gmax = await fs.readJson('./in/static/8/pokemon/gmax.json');
  let regional = await fs.readJson('./in/static/8/pokemon/regional.json');
  let alt = await fs.readJson('./in/static/8/pokemon/alt.json');

  console.log(`processing ${data.length} pokemon...`);

  // sort by name so base species is handled first
  data = _.sortBy(data, 'name');

  let index = [];
  let details = [];
  let obj, isBattleOnly, abilities, evos, prevo, altBattleForms, learnset;
  let tags, temp;

  _.forEach(data, (pkmn) => {
    if (!pkmn) {
      return;
    }
    if (
      pkmn.isNonstandard &&
      !_.includes(['Gigantamax', 'Unobtainable'], pkmn.isNonstandard)
    ) {
      // console.warn('\t', 'Non standard', pkmn.name, '-', pkmn.isNonstandard);
      return;
    }

    isBattleOnly = pkmn.isBattleOnly ? true : undefined;

    obj = {
      name: getName(pkmn.name),
      caption: pkmn.name,
      types: _.map(pkmn.types, getTypeName),
      num: pkmn.num,
      baseStats: pkmn.baseStats,
      isBattleOnly,
    };

    // Gen
    temp = _.find(gen, { name: obj.name });
    if (temp) {
      obj.gen = temp.gen;
    } else {
      console.warn('\t', 'no gen for', obj.caption);
    }

    // G-Max forms
    tags = [];

    temp = _.find(gmax, { pokemon: obj.name });
    if (temp) {
      tags.push('gmax');

      temp = _.find(index, { name: temp.base });
      if (temp) {
        obj.baseSpecies = { name: temp.name, caption: temp.caption };
      }
    }

    if (tags.length) {
      obj.tags = tags;
    }

    // Regional forms
    temp = _.find(regional, { pokemon: obj.name });
    if (temp) {
      obj.regional = temp.region;

      temp = _.find(index, { name: temp.base });
      if (temp) {
        obj.baseSpecies = { name: temp.name, caption: temp.caption };
      }
    }

    // Alternate forms
    temp = _.find(alt, { pokemon: obj.name });
    if (temp) {
      obj.altCaption = temp.altCaption;

      if (temp.hideAltCaption) {
        obj.hideAltCaption = true;
      }

      if (temp.hide) {
        obj.hide = true;
      }

      if (temp.isAltFormOverride) {
        obj.isAltFormOverride = true;
      }

      temp = _.find(index, { name: temp.base });
      if (temp) {
        obj.baseSpecies = { name: temp.name, caption: temp.caption };
      }
    }

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

    altBattleForms = pkmn.altBattleFormes.length
      ? _.map(pkmn.altBattleFormes, getSpeciesName)
      : undefined;

    learnset = _.map(pkmn.learnset, (entry) => {
      return {
        how: entry.how,
        what: getMoveName(entry.what),
      };
    });

    details.push({
      ...obj,
      altBattleForms,
      desc: pkmn.desc,
      shortDesc: pkmn.shortDesc,
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
  await exportData(path.join(target, 'pokemon/_index.json'), index);

  console.log(`writing ${details.length} pokemon details...\n`);
  for (const pkmn of details) {
    await exportData(path.join(target, 'pokemon', pkmn.name + '.json'), pkmn);
  }

  pokemonDetails = details;
}

async function exportItems(target, data) {
  console.log('loading data...');
  let gen = await fs.readJson('./in/static/8/item/gen.json');

  console.log(`processing ${data.length} items...`);

  let index = [];
  let details = [];
  let obj, caption, temp;

  _.forEach(data, (item) => {
    if (!item) {
      return;
    }
    if (item.isNonstandard) {
      // console.warn('\t', 'Non standard', item.name, '-', item.isNonstandard);
      return;
    }

    caption = item.name;
    switch (caption) {
      case 'SilverPowder':
        caption = 'Silver Powder';
        break;
    }

    obj = {
      name: getName(caption),
      caption,
    };

    // Gen
    temp = _.find(gen, { name: obj.name });
    if (temp) {
      obj.gen = temp.gen;
    } else {
      console.warn('\t', 'no gen for', obj.caption);
    }

    index.push(obj);

    details.push({
      ...obj,
      desc: item.desc,
      shortDesc: item.shortDesc,
    });
  });

  console.log(`writing ${index.length} items...`);
  await exportData(path.join(target, 'item/_index.json'), index);

  console.log(`writing ${details.length} item details...\n`);
  for (const item of details) {
    await exportData(path.join(target, 'item', item.name + '.json'), item);
  }
}

async function exportPokedex(target, dexName) {
  console.log('loading data...');
  let data = await fs.readJson(`./in/static/8/pokedex/${dexName}.json`);

  console.log(`processing ${data.length} pokedex entries for ${dexName}...`);

  let altList = [];
  let pkmn, altPkmn, alts, baseSpeciesName;

  data = _.map(data, (item) => {
    pkmn = _.find(pokemonDetails, { name: item.name });

    if (pkmn) {
      item.national = pkmn.num;

      if (pkmn.altBattleForms) {
        alts = _.map(pkmn.altBattleForms, (altName) => {
          altPkmn = _.find(pokemonDetails, { name: altName });

          if (!altPkmn) {
            console.warn('\t', 'Info not found for', altName);
            return;
          }

          if (!altPkmn.baseSpecies) {
            console.warn('\t', 'No base species for', altName);
          }

          baseSpeciesName = altPkmn.baseSpecies
            ? altPkmn.baseSpecies.name
            : undefined;

          return {
            num: item.num,
            name: altName,
            national: item.national,
            baseSpeciesName,
            tags: altPkmn.tags,
          };
        });
        altList.push(...alts);
      }
    }

    return item;
  });

  altList = _.reject(altList, (item) => !item);

  data = _.concat(data, altList);
  data = _.sortBy(data, 'num');

  console.log(`writing ${data.length} pokedex entries...\n`);
  await exportData(path.join(target, `pokedex/${dexName}.json`), data);
}

async function exportAll(target) {
  console.log('loading data...\n');
  all = await fs.readJson('./in/smogon-data/8.json');

  await exportPokemon(target, all.species);
  await exportAbilities(target, all.abilities);
  await exportMoves(target, all.moves);
  await exportItems(target, all.items);
  await exportPokedex(target, 'swsh-galar');
  await exportPokedex(target, 'swsh-isle-of-armor');
}

module.exports = exportAll;
