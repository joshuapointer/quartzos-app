import AppIntents
import Foundation

@available(iOS 16.0, *)
struct OpenPresetsIntent: AppIntent {
  static var title: LocalizedStringResource = "Open Quartzie presets"

  static var description = IntentDescription(
    "Open Quartzie to your saved presets."
  )

  static var openAppWhenRun: Bool = true

  @MainActor
  func perform() async throws -> some IntentResult & OpensIntent {
    guard let url = IntentURLs.openScreen("presets") else {
      throw IntentDialogError(message: "Couldn't build the URL.")
    }
    return .result(opensIntent: OpenURLIntent(url))
  }
}
