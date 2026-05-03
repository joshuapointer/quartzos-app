import Foundation

/// Centralised builders for `quartzos://intent/...` deep links.
///
/// Uses `URLComponents` + `URLQueryItem` so dynamic values (preset ids) are
/// percent-encoded — defence-in-depth against ids that ever contain
/// reserved characters in the future. Today the JS side only generates
/// UUIDs, so the active blast radius is zero.
enum IntentURLs {
  static func startSession(presetId: String) -> URL? {
    var components = URLComponents()
    components.scheme = "quartzos"
    components.host = "intent"
    components.path = "/start-session"
    components.queryItems = [URLQueryItem(name: "presetId", value: presetId)]
    return components.url
  }

  static func openScreen(_ screen: String) -> URL? {
    var components = URLComponents()
    components.scheme = "quartzos"
    components.host = "intent"
    components.path = "/open"
    components.queryItems = [URLQueryItem(name: "screen", value: screen)]
    return components.url
  }
}
