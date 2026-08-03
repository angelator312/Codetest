const one_line_commment = /\/\/.*?$/gms;
const block_commment = /(?<!\/)\/\*.*?\*\//gms;
const cerr_find = /\bcerr\b/gms;
const define_cerr_as_nothing = /\s*#define\s+cerr\s+if\(0\)\s*cerr/gm;
export function IsThereACerr(code: string) {
  code = code.replaceAll(block_commment, "");
  code = code.replaceAll(one_line_commment, "");
  let a = define_cerr_as_nothing.test(code);
  if (a) {
    return false;
  }
  return cerr_find.test(code);
}
