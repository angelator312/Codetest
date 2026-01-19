import { Out, Eol } from "./Out.js";

export function Str(s) {
  Out(s);
}

export function Int(n) {
  Str(n);
}

export function Choice(...choices) {
  Out(choices[MinMax(0, choices.length - 1)]);
}

export function GenericSeq(size, p) {
  for (let i = 0; i < size; i++) {
    const v = p(i);
    if (v !== undefined) Out(v);
  }
  Eol();
}

export function GenericMatrix(w, h, p) {
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      const v = p(x, y);
      if (v !== undefined) Out(v);
    }
    Eol();
  }
}
