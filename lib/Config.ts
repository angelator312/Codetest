export interface ConfigType {
  verbose: boolean;
  keepInputFiles: boolean;
  watch: boolean;
}

export const CFG: ConfigType = {
  verbose: false,
  keepInputFiles: false,
  watch: false,
};

export function SetConfig(cfg: Partial<ConfigType>): void {
  for (const k of Object.keys(CFG)) {
    const key = k as keyof ConfigType;
    if (cfg[key] !== undefined) {
      CFG[key] = cfg[key]!;
    }
  }
}
