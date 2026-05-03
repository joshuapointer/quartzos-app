import ExpoModulesCore
import Foundation

public class QuartzieSiriBridgeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("QuartzieSiriBridgeModule")

    Function("setPresetCatalog") { (json: String) in
      SharedDefaults.shared.presetCatalogJSON = json
    }

    Function("setLastPresetId") { (id: String?) in
      SharedDefaults.shared.lastPresetId = id
    }

    Function("getAppGroupIdentifier") { () -> String in
      return SharedDefaults.appGroupIdentifier
    }
  }
}
