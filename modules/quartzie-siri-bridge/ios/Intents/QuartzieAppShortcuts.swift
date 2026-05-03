import AppIntents

@available(iOS 18.0, *)
struct QuartzieAppShortcuts: AppShortcutsProvider {
  @AppShortcutsBuilder
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: StartLastSessionIntent(),
      phrases: [
        "Start my dab in \(.applicationName)",
        "Start a \(.applicationName) session",
        "Repeat my last \(.applicationName) session"
      ],
      shortTitle: "Start last session",
      systemImageName: "flame.fill"
    )

    AppShortcut(
      intent: StartSessionWithPresetIntent(),
      phrases: [
        "Start a \(\.$preset) session in \(.applicationName)",
        "Run \(\.$preset) in \(.applicationName)"
      ],
      shortTitle: "Start with preset",
      systemImageName: "slider.horizontal.3"
    )

    AppShortcut(
      intent: OpenHistoryIntent(),
      phrases: [
        "Show my \(.applicationName) history",
        "Open \(.applicationName) history"
      ],
      shortTitle: "Open history",
      systemImageName: "clock.arrow.circlepath"
    )

    AppShortcut(
      intent: OpenPresetsIntent(),
      phrases: [
        "Show my \(.applicationName) presets",
        "Open \(.applicationName) presets"
      ],
      shortTitle: "Open presets",
      systemImageName: "square.stack.fill"
    )
  }
}
