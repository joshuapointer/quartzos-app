import { ConfigPlugin, withEntitlementsPlist } from '@expo/config-plugins';

const APP_GROUP = 'group.com.quartzos.app';

const withQuartzieSiriBridge: ConfigPlugin = (config) => {
  // Add App Group entitlement so the main app and any future intent
  // extension can share UserDefaults. App Intents auto-register at launch
  // via `AppShortcutsProvider` — no Info.plist key required.
  return withEntitlementsPlist(config, (cfg) => {
    const groups = (cfg.modResults['com.apple.security.application-groups'] as string[]) ?? [];
    if (!groups.includes(APP_GROUP)) {
      groups.push(APP_GROUP);
    }
    cfg.modResults['com.apple.security.application-groups'] = groups;
    return cfg;
  });
};

export default withQuartzieSiriBridge;
