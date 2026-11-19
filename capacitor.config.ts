import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'substrack.app',
  appName: 'SubsTrack',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
  plugins: {
    CapacitorSQLite: {
      // Defaults to true, which makes the plugin build an AndroidKeyStore
      // MasterKey + EncryptedSharedPreferences at load() — that throws on
      // devices where keystore keygen fails and bricks the whole plugin.
      // We only ever open 'no-encryption' connections, so it's off.
      androidIsEncryption: false,
      iosIsEncryption: false,
    },
    LocalNotifications: {
      // Monochrome silhouette of the logo — Android tints it with iconColor.
      smallIcon: 'ic_stat_substrack',
      iconColor: '#f15a24',
    },
  },
}

export default config
