import Foundation

/// Shared App Group `UserDefaults` accessor.
///
/// JS writes here via the Expo bridge module; Swift App Intents read here
/// when invoked. This is a one-way mirror: SQLite remains the source of
/// truth. The mirror exists only because intents may run before the JS
/// runtime is loaded.
struct SharedDefaults {
  static let appGroupIdentifier = "group.com.quartzos.app"

  static let shared = SharedDefaults()

  private let presetCatalogKey = "quartzie.presetCatalog"
  private let lastPresetIdKey = "quartzie.lastPresetId"

  private var defaults: UserDefaults? {
    UserDefaults(suiteName: SharedDefaults.appGroupIdentifier)
  }

  var presetCatalogJSON: String? {
    get { defaults?.string(forKey: presetCatalogKey) }
    nonmutating set { defaults?.set(newValue, forKey: presetCatalogKey) }
  }

  var lastPresetId: String? {
    get { defaults?.string(forKey: lastPresetIdKey) }
    nonmutating set { defaults?.set(newValue, forKey: lastPresetIdKey) }
  }

  func loadPresetCatalog() -> [PresetCatalogEntry] {
    guard let json = presetCatalogJSON,
          let data = json.data(using: .utf8),
          let entries = try? JSONDecoder().decode([PresetCatalogEntry].self, from: data)
    else {
      return []
    }
    return entries
  }
}

struct PresetCatalogEntry: Codable, Hashable {
  let id: String
  let name: String
}
