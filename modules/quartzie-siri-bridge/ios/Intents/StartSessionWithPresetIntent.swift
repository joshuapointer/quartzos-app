import AppIntents
import Foundation

@available(iOS 16.0, *)
struct StartSessionWithPresetIntent: AppIntent {
  static var title: LocalizedStringResource = "Start session with preset"

  static var description = IntentDescription(
    "Apply a saved Quartzie preset and open the heating screen."
  )

  static var openAppWhenRun: Bool = true

  @Parameter(title: "Preset")
  var preset: PresetEntity

  static var parameterSummary: some ParameterSummary {
    Summary("Start a \(\.$preset) session")
  }

  @MainActor
  func perform() async throws -> some IntentResult & OpensIntent {
    guard let url = IntentURLs.startSession(presetId: preset.id) else {
      throw IntentDialogError(message: "Couldn't build the start URL.")
    }
    return .result(opensIntent: OpenURLIntent(url))
  }
}
