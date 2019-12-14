const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const { getName, exportData } = require('./utils');

async function exportTypes(target) {
  console.log('loading data...');
  let data = await fs.readJson('./in/static/8/type.json');

  console.log(`processing ${data.length} types...`);

  data = _.map(data, item => {
    return item;
  });

  console.log(`writing ${data.length} types...\n`);
  await exportData(path.join(target, 'type.json'), data);
}

async function exportCategories(target) {
  console.log('loading data...');
  let data = await fs.readJson('./in/static/8/category.json');

  console.log(`processing ${data.length} categories...`);

  data = _.map(data, item => {
    item.name = getName(item.caption);

    return item;
  });

  console.log(`writing ${data.length} categories...\n`);
  await exportData(path.join(target, 'category.json'), data);
}

async function exportNatures(target) {
  console.log('loading data...');
  let data = await fs.readJson('./in/static/8/nature.json');

  console.log(`processing ${data.length} natures...`);

  data = _.map(data, item => {
    item.name = getName(item.caption);

    return item;
  });

  console.log(`writing ${data.length} natures...\n`);
  await exportData(path.join(target, 'nature.json'), data);
}

async function exportTms(target) {
  console.log('loading data...');
  let data = await fs.readJson('./in/static/8/tm.json');

  console.log(`writing ${data.length} TMs...\n`);
  await exportData(path.join(target, 'tm.json'), data);
}

async function exportTrs(target) {
  console.log('loading data...');
  let data = await fs.readJson('./in/static/8/tr.json');

  console.log(`writing ${data.length} TRs...\n`);
  await exportData(path.join(target, 'tr.json'), data);
}

async function exportAll(target) {
  await exportTypes(target);
  await exportCategories(target);
  await exportNatures(target);
  await exportTms(target);
  await exportTrs(target);
}

module.exports = exportAll;
