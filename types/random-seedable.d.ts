declare module 'random-seedable' {
  interface Random {
    seed(seed: number | string | bigint): void;
    randRange(min: number, max: number): number;
  }
  const random: Random;
  export default random;
}
