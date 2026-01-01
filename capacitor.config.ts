import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.urusdirisendiri.app',
  appName: 'urus-diri-sendiri',
  webDir: 'dist',
  plugins: {
    Keyboard: {
      resize: 'body',
      style: 'dark',
    },
  },
};

export default config;
