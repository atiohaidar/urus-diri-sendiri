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
  android: {
    backgroundColor: '#ffffff', // Matches light theme background to prevent white flash
  },
};

export default config;
