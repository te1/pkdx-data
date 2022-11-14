import { transformPokemon } from './pokemon.mjs';
import { transformMoves } from './moves.mjs';

async function main() {
  try {
    console.log('*** gen 9 - sv ***');
    await transformPokemon();
    await transformMoves();

    console.log('done');
  } catch (err) {
    console.error(err);
  }
}

main();
