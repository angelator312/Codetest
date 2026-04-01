import { Out, Eol } from "./Out.ts";
import { MinMax } from "./Random.ts";

export function Str(s: string): void {
  Out(s);
}

export function Int(n: number | string): void {
  Str(n.toString());
}

export function Choice<T>(...choices: T[]): T {
  return choices[MinMax(0, choices.length - 1)]!;
}
/**
 * Makes a sequence from a function.
 * @param size - sequence length
 * @param p - function that generates single element
 */
export function GenericSeq<T>(size: number, p: (i: number) => T): void {
  for (let i = 0; i < size; i++) {
    const v = p(i);
    if (v !== undefined) Out(v as string);
  }
  Eol();
}

/**
 * Makes a matrix from a function.
 * @param w - width of matrix
 * @param h - height of matrix
 * @param p - function that generates single element
 */
export function GenericMatrix<T>(
  w: number,
  h: number,
  p: (x: number, y: number) => T,
): void {
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      const v = p(x, y);
      if (v !== undefined) Out(v as string);
    }
    Eol();
  }
}

export function GenericPermutation(n: number) {
  let permutation = Array.from({ length: n }, (_, i) => i + 1);

  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
  }

  return permutation;
}
