import { transformPokemon } from './pokemon.mjs';

async function main() {
  try {
    console.log('*** gen 9 - sv ***');
    await transformPokemon();

    console.log('done');
  } catch (err) {
    console.error(err);
  }
}

main();
