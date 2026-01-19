import random from 'random-seedable';

export function Seed(seed) {
  random.seed(seed);
};

export function MinMax(min, max) {
  return random.randRange(min, max+1);
};