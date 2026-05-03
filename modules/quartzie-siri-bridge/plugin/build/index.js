"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const APP_GROUP = 'group.com.quartzos.app';
const withQuartzieSiriBridge = (config) => {
    // Add App Group entitlement so the main app and any future intent
    // extension can share UserDefaults. App Intents auto-register at launch
    // via `AppShortcutsProvider` — no Info.plist key required.
    return (0, config_plugins_1.withEntitlementsPlist)(config, (cfg) => {
        const groups = cfg.modResults['com.apple.security.application-groups'] ?? [];
        if (!groups.includes(APP_GROUP)) {
            groups.push(APP_GROUP);
        }
        cfg.modResults['com.apple.security.application-groups'] = groups;
        return cfg;
    });
};
exports.default = withQuartzieSiriBridge;
