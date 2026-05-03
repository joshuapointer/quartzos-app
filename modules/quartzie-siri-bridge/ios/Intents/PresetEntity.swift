import AppIntents
import Foundation

@available(iOS 16.0, *)
struct PresetEntity: AppEntity {
  let id: String
  let name: String

  static var typeDisplayRepresentation: TypeDisplayRepresentation {
    TypeDisplayRepresentation(name: "Preset")
  }

  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: "\(name)")
  }

  static var defaultQuery = PresetEntityQuery()
}

@available(iOS 16.0, *)
struct PresetEntityQuery: EntityQuery {
  func entities(for identifiers: [PresetEntity.ID]) async throws -> [PresetEntity] {
    let catalog = SharedDefaults.shared.loadPresetCatalog()
    let wanted = Set(identifiers)
    return catalog
      .filter { wanted.contains($0.id) }
      .map { PresetEntity(id: $0.id, name: $0.name) }
  }

  func suggestedEntities() async throws -> [PresetEntity] {
    SharedDefaults.shared
      .loadPresetCatalog()
      .map { PresetEntity(id: $0.id, name: $0.name) }
  }
}
