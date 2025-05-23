export enum RUN_ENV {
  DESKTOP = 'DESKTOP',
  WEB = 'WEB',
}

export const getRunEnv = (): RUN_ENV => {
  // In a Vite project, import.meta.env.VITE_RUN_ENV can be used.
  // We'll default to DESKTOP if not set, assuming Tauri context.
  // The Docker build will explicitly set VITE_RUN_ENV to WEB.
  const env = import.meta.env.VITE_RUN_ENV;
  if (env === 'WEB') {
    return RUN_ENV.WEB;
  }
  return RUN_ENV.DESKTOP;
};
