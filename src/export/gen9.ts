import { Generation } from '@pkmn/data';
import { exportGames } from './games';
import { exportPokedex } from './pokedex';

const fakeGen = {
  num: 9,
} as unknown as Generation;

export async function exportGen9Placeholder(target: string) {
  console.log(`*** gen 9 (placeholder data) ***`);

  await exportPokemon(target);
  await exportGames(fakeGen, target);
  await exportPokedex(fakeGen, target);

  console.log('');
}

async function exportPokemon(target: string) {
  // TODO handle gen9 preview pokemon data
}
