import path from 'path';
import fs from 'fs-extra';
import _ from 'lodash';
import { getSlug } from './utils.mjs';

export async function transformMoves() {
  console.log('- moves');

  const pathData = './data/';
  const pathDumps = path.join(pathData, 'dumps/gen9/sv/');

  console.log('\tloading data...');
  const dumpMoveData = await fs.readFile(
    path.join(pathDumps + 'move-data.txt'),
    'utf8'
  );
  const dumpMoveNames = await fs.readFile(
    path.join(pathDumps + 'move-names.txt'),
    'utf8'
  );
  const dumpMoveDescriptions = await fs.readFile(
    path.join(pathDumps + 'move-descriptions.txt'),
    'utf8'
  );

  let resultNames = parseNames(dumpMoveNames);
  let resultDescriptions = parseDescriptions(dumpMoveDescriptions);
  let result = parseData(dumpMoveData, resultNames, resultDescriptions);

  result = _.sortBy(result, 'slug');

  if (result.length) {
    console.log(`\twriting ${result.length} moves...`);
    await fs.writeJson(path.join(pathDumps, 'moves.json'), result, {
      spaces: 2,
    });
  }
}

function parseNames(dumpMoveNames) {
  const result = {};

  for (const line of dumpMoveNames.split('\n')) {
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

function parseDescriptions(dumpMoveDescriptions) {
  const result = {};

  let id = null;
  let text = null;

  for (const line of dumpMoveDescriptions.split('\n')) {
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

function parseData(dumpMoveData, resultNames, resultDescriptions) {
  const result = {};

  let entry;
  let slug = null;

  for (const line of dumpMoveData.split('\n')) {
    if (line.startsWith('//')) {
      continue; // skip comments
    } else if (line === '') {
      continue; // skip empty lines
    }

    if (line.endsWith(':')) {
      // add last entry to result before creating a new entry
      if (entry) {
        result[slug] = entry;
        slug = null;
      }

      let name = line.split(':')[0];

      slug = getSlug(name);

      entry = {
        name,
        slug,
        // gen info is missing
        // target info is missing
        // desc and shortDesc from showdown are missing
        flavorText: resultDescriptions[resultNames[name]],
      };

      continue;
    }

    let lineData = line.split(': ');
    let key = lineData[0].trim();
    let value = lineData[1];

    switch (key) {
      case 'Type':
        entry.type = getSlug(value);
        break;

      case 'Category':
        entry.category = getSlug(value);
        break;

      case 'Power':
        entry.basePower = parseInt(value) || undefined;
        break;

      case 'Accuracy':
        entry.accuracy =
          entry.category === 'status'
            ? undefined
            : parseInt(value) || undefined;
        break;

      case 'PP':
        entry.pp = parseInt(value) || undefined;
        break;

      case 'Priority':
        entry.priority = parseInt(value) ?? undefined;
        break;

      default:
        console.warn('unknown line', line);
        break;
    }
  }

  if (entry) {
    result[slug] = entry;
  }

  return result;
}
