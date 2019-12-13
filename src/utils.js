const fs = require('fs-extra');
const _ = require('lodash');

const config = {
  prettyPrintJson: true,
};

async function exportData(file, data) {
  let spaces = config.prettyPrintJson ? 2 : 0;

  return await fs.outputJson(file, data, { spaces });
}

function getName(caption) {
  caption = _.deburr(caption);
  caption = _.toLower(caption);
  caption = _.replace(caption, / /g, '-');
  caption = _.replace(caption, /[^a-zA-Z\d-]/g, '');

  return caption;
}

module.exports.config = config;
module.exports.exportData = exportData;
module.exports.getName = getName;
