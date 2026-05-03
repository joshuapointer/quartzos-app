import AppIntents
import Foundation

@available(iOS 18.0, *)
struct OpenHistoryIntent: AppIntent {
  static var title: LocalizedStringResource = "Open Quartzie history"

  static var description = IntentDescription(
    "Open Quartzie to your session history."
  )

  static var openAppWhenRun: Bool = true

  @MainActor
  func perform() async throws -> some IntentResult & OpensIntent {
    guard let url = IntentURLs.openScreen("history") else {
      throw IntentDialogError(message: "Couldn't build the URL.")
    }
    return .result(opensIntent: OpenURLIntent(url))
  }
}
