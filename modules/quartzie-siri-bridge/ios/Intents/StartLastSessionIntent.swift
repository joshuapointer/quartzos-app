import AppIntents
import Foundation

@available(iOS 18.0, *)
struct StartLastSessionIntent: AppIntent {
  static var title: LocalizedStringResource = "Start last session"

  static var description = IntentDescription(
    "Apply the last preset you used and open Quartzie to the heating screen."
  )

  static var openAppWhenRun: Bool = true

  @MainActor
  func perform() async throws -> some IntentResult & OpensIntent {
    guard let presetId = SharedDefaults.shared.lastPresetId, !presetId.isEmpty else {
      throw IntentDialogError(
        message: "No previous session yet. Pick a preset first."
      )
    }

    guard let url = IntentURLs.startSession(presetId: presetId) else {
      throw IntentDialogError(message: "Couldn't build the start URL.")
    }

    return .result(opensIntent: OpenURLIntent(url))
  }
}

/// A throwable that surfaces its message in the Siri dialog instead of the
/// default "There was a problem." A bare `LocalizedError` does NOT surface;
/// `CustomLocalizedStringResourceConvertible` is required.
struct IntentDialogError: LocalizedError, CustomLocalizedStringResourceConvertible {
  let message: String
  var errorDescription: String? { message }
  var localizedStringResource: LocalizedStringResource { LocalizedStringResource(stringLiteral: message) }
}
