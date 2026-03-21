import random from 'random-seedable';

export function Seed(seed: number): void {
  random.seed(seed);
}

export function MinMax(min: number, max: number): number {
  return random.randRange(min, max + 1);
}
