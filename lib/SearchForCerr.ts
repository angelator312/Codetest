const one_line_commment = /\/\/.*?$/gms;
const block_commment = /(?<!\/)\/\*.*?\*\//gms;
const cerr_find = /\bcerr\b/gms;
export function IsThereACerr(code: string) {
  code = code.replaceAll(block_commment, "");
  code = code.replaceAll(one_line_commment, "");
  return cerr_find.test(code);
}
