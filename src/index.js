const fs = require('fs-extra');
const exportSmogon = require('./smogon');
const exportStatic = require('./static');

const target = './out/8';

async function main() {
  try {
    await fs.emptyDir(target);

    await exportSmogon(target);
    await exportStatic(target);

    console.log('done\n');
  } catch (err) {
    console.error(err);
  }
}

main();
