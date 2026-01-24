export const CFG = {
  verbose: false,
  keepInputFiles: false,
  watch: false,
};

export function SetConfig(cfg){
  for(const k of Object.keys(CFG)){
    if(cfg[k] !== undefined){
      CFG[k] = cfg[k];
    }
  }
}