const fs = require('fs-extra');
const exportSmogon = require('./smogon');

const target = './out/8';

async function main() {
  try {
    await fs.emptyDir(target);

    await exportSmogon(target);
  } catch (err) {
    console.error(err);
  }
}

main();
