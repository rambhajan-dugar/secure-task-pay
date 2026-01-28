import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kaam.app',
  appName: 'kaam',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    Geolocation: {
      // Request location permissions on app launch
    },
    Haptics: {
      // Haptic feedback enabled
    },
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    backgroundColor: '#0a0a0b',
  },
  android: {
    backgroundColor: '#0a0a0b',
  },
};

export default config;
