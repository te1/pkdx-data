import { transformPokemon } from './pokemon.mjs';
import { transformMoves } from './moves.mjs';
import { transformAbilities } from './abilities.mjs';

async function main() {
  try {
    console.log('*** gen 9 - sv ***');
    await transformPokemon();
    await transformMoves();
    await transformAbilities();

    console.log('done');
  } catch (err) {
    console.error(err);
  }
}

main();
