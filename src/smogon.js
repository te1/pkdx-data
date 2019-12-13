const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const { getName, exportData } = require('./utils');

let all;

function getTypeName(id) {
  let type = all.types[id];

  return getName(type.name);
}

async function exportAbilities(target, data) {
  console.log(`processing ${data.length} abilities...`);

  let index = [];
  let details = [];
  let obj;

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

    details.push({
      ...obj,
      desc: ability.desc,
      shortDesc: ability.shortDesc,
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
  let obj, accuracy;

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

    details.push({
      ...obj,
      priority: move.priority,
      target: getName(move.target),
      desc: move.desc,
      shortDesc: move.shortDesc,
    });
  });

  console.log(`writing ${index.length} moves...`);
  await exportData(path.join(target, 'move/index.json'), index);

  console.log(`writing ${details.length} move details...\n`);
  for (const move of details) {
    await exportData(path.join(target, 'move', move.name + '.json'), move);
  }
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

async function exportAll(target) {
  console.log('loading data...\n');
  all = await fs.readJson('./in/smogon-data/8.json');

  await exportAbilities(target, all.abilities);
  await exportMoves(target, all.moves);
  await exportItems(target, all.items);

  console.log('done\n');
}

module.exports = exportAll;
