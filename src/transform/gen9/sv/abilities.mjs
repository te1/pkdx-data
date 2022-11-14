import path from 'path';
import fs from 'fs-extra';
import _ from 'lodash';
import { getSlug } from './utils.mjs';

export async function transformAbilities() {
  console.log('- abilities');

  const pathData = './data/';
  const pathDumps = path.join(pathData, 'dumps/gen9/sv/');

  console.log('\tloading data...');
  const dumpAbilityNames = await fs.readFile(
    path.join(pathDumps + 'ability-names.txt'),
    'utf8'
  );
  const dumpAbilityDescriptions = await fs.readFile(
    path.join(pathDumps + 'ability-descriptions.txt'),
    'utf8'
  );

  let resultNames = parseNames(dumpAbilityNames);
  let resultDescriptions = parseDescriptions(dumpAbilityDescriptions);
  let result = buildData(resultNames, resultDescriptions);

  result = _.sortBy(result, 'slug');

  if (result.length) {
    console.log(`\twriting ${result.length} abilities...`);
    await fs.writeJson(path.join(pathDumps, 'abilities.json'), result, {
      spaces: 2,
    });
  }
}

function parseNames(dumpAbilityNames) {
  const result = {};

  for (const line of dumpAbilityNames.split('\n')) {
    if (line.startsWith('//')) {
      continue; // skip comments
    } else if (line === '') {
      continue; // skip empty lines
    }

    let lineData = line.split(': ');
    let id = parseInt(lineData[0]);

    if (id === 0) {
      continue; // skip
    }

    let name = lineData[1];

    result[name] = id;
  }

  return result;
}

function parseDescriptions(dumpAbilityDescriptions) {
  const result = {};

  let id = null;
  let text = null;

  for (const line of dumpAbilityDescriptions.split('\n')) {
    if (line.startsWith('//')) {
      continue; // skip comments
    } else if (line === '') {
      continue; // skip empty lines
    } else if (line.endsWith(':')) {
      // add last entry to result before creating a new entry
      if (id && text) {
        result[id] = text;
      }

      id = parseInt(line.split(':')[0]);
      text = null;
      continue;
    }

    if (id === 0) {
      continue; // skip
    }

    if (line && line !== '-') {
      if (!text) {
        text = line;
      } else if (text.endsWith('-')) {
        text = text + line;
      } else {
        text = text + ' ' + line;
      }
    }
  }

  // add last entry to result
  if (id && text) {
    result[id] = text;
  }

  return result;
}

function buildData(resultNames, resultDescriptions) {
  const result = {};

  for (const [name, id] of Object.entries(resultNames)) {
    const slug = getSlug(name);

    const entry = {
      name,
      slug,
      // gen info is missing
      // desc and shortDesc from showdown are missing
      flavorText: resultDescriptions[id],
    };

    result[slug] = entry;
  }

  return result;
}
