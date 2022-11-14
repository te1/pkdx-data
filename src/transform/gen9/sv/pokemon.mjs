import path from 'path';
import fs from 'fs-extra';
import _ from 'lodash';

export async function transformPokemon() {
  console.log('- pokemon');

  const pathData = './data/';
  const pathDumps = path.join(pathData, 'dumps/gen9/sv/');

  console.log('\tloading data...');
  const dataPokedex = await fs.readJson(
    path.join(pathData + 'pokedex/paldea_sv.json')
  );
  const dumpPokemon = await fs.readFile(
    path.join(pathDumps + 'pokemon.txt'),
    'utf8'
  );
  const dumpPokemonMisc = await fs.readFile(
    path.join(pathDumps + 'pokemon-misc.txt'),
    'utf8'
  );

  let resultMisc = parseMisc(dumpPokemonMisc);
  let result = parsePokemon(dumpPokemon, resultMisc, dataPokedex);

  result = _.orderBy(result, ['num', 'slug']);

  if (result.length) {
    console.log(`\twriting ${result.length} pokemon...`);
    await fs.writeJson(path.join(pathDumps, 'pokemon.json'), result, {
      spaces: 2,
    });
  }
}

function parsePokemon(dumpPokemon, dataMisc, dataPokedex) {
  const result = [];

  let entry;
  let section = null;
  let skip = false;

  for (const line of dumpPokemon.split('\n')) {
    if (line.startsWith('//')) {
      continue; // skip comments
    } else if (line === '') {
      section = null; // reset section for next entry
      continue;
    } else if (line === 'Evolutions:') {
      section = 'evo';
      continue;
    } else if (line === 'Learned Moves:') {
      section = 'moves';
      continue;
    } else if (line === 'Reminder Moves:') {
      section = 'movesReminder';
      continue;
    } else if (line === 'Egg Moves:') {
      section = 'movesEgg';
      continue;
    } else if (line === 'TM Moves:') {
      section = 'movesTm';
      continue;
    }

    // first line of entry has lots of info
    if (line.includes('(Total: ')) {
      // add last entry to result before creating a new entry
      if (entry) {
        if (_.size(entry.learnset)) {
          // sort by move slug for consistency
          entry.learnset = _(entry.learnset)
            .toPairs()
            .sortBy(0)
            .fromPairs()
            .value();
        }

        result.push(entry);
      }

      let lineData = line.split(' - ');

      let name = lineData[0];

      // skip variants for now (end in -1 or other numbers)
      skip = !!name.match(/-[0-9]{1,2}$/);
      if (skip) {
        continue;
      }

      let slug = getSlug(name);

      let statsArray = lineData[1].split(' ')[0].split('/');
      let stats = {
        hp: parseInt(statsArray[0]),
        atk: parseInt(statsArray[1]),
        def: parseInt(statsArray[2]),
        spa: parseInt(statsArray[3]),
        spd: parseInt(statsArray[4]),
        spe: parseInt(statsArray[5]),
      };

      let types = lineData[2].toLowerCase().split('/');
      if (types[0] === types[1]) {
        types.pop(); // don't add the same type twice
      }

      let abilitiesArray = lineData[3].split('/');
      let abilities = { 0: getSlug(abilitiesArray[0]) };
      if (abilitiesArray[0] !== abilitiesArray[1]) {
        abilities['1'] = getSlug(abilitiesArray[1]); // don't add the same ability twice
      }
      if (abilitiesArray[2]) {
        abilities['H'] = getSlug(abilitiesArray[2]);
      }

      let entryMisc = dataMisc[slug];

      entry = {
        slug,
        name,
        num: _.find(dataPokedex.data, { slug })?.num ?? null,
        types,
        // gen info is missing
        abilities,
        baseStats: stats,
        weight: entryMisc?.weight ?? undefined,
        height: entryMisc?.height ?? undefined,
        genderRatio: entryMisc?.genderRatio ?? undefined,
        learnset: {},
      };

      continue;
    }

    if (skip) {
      continue;
    }

    switch (section) {
      case 'evo':
        // ignore for now
        break;

      case 'moves':
        var lineData = line.split(' @ ');
        var name = lineData[0];
        var slug = getSlug(name);
        var how = lineData[1];

        if (how?.startsWith('Lv. ')) {
          how = 'L:' + how.split(' ')[1];
        } else if (how === 'Evolution') {
          how = 'L:0';
        } else {
          console.warn('unknown how', entry.name, how);
        }

        var learnset = entry.learnset[slug] ?? [];
        learnset.push(how);
        entry.learnset[slug] = learnset;
        break;

      case 'movesReminder':
      case 'movesEgg':
      case 'movesTm':
        lineData = line.split(', ');
        for (const name of lineData) {
          let slug = getSlug(name);

          let learnset = entry.learnset[slug] ?? [];

          switch (section) {
            case 'movesReminder':
              learnset.push('T');
              break;

            case 'movesEgg':
              learnset.push('E');
              break;

            case 'movesTm':
              learnset.push('M');
              break;
          }

          entry.learnset[slug] = learnset;
        }
        break;

      default:
        console.warn('unknown line', line);
        break;
    }
  }

  if (entry) {
    result.push(entry);
  }

  return result;
}

function parseMisc(dumpPokemonMisc) {
  const result = {};

  let entry;
  let slug = null;
  let skip = false;

  for (const line of dumpPokemonMisc.split('\n')) {
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

      // skip variants for now (end in -1 or other numbers)
      skip = !!name.match(/-[0-9]{1,2}$/);
      if (skip) {
        continue;
      }

      slug = getSlug(name);

      entry = {};

      continue;
    }

    if (skip) {
      continue;
    }

    let lineData = line.split(': ');
    let key = lineData[0].trim();
    let value = lineData[1];

    switch (key) {
      case 'Height':
        entry.height = parseInt(value) / 10;
        break;

      case 'Weight':
        entry.weight = parseInt(value) / 10;
        break;

      case 'Catch Rate':
      case 'Base Friendship':
      case 'EV Yield':
        // ignore for now
        break;

      case 'Gender Ratio':
        var m, f;
        m = null;
        f = null;

        var values = value.split(', ');

        for (const value of values) {
          if (value.endsWith('Female')) {
            f = parseInt(value.split('% ')[0]) / 100;
          } else if (value.endsWith('Male')) {
            m = parseInt(value.split('% ')[0]) / 100;
          }
        }

        entry.genderRatio = {
          M: m ?? undefined,
          F: f ?? undefined,
        };
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

function getSlug(name) {
  return _.deburr(name)
    .replaceAll(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}
