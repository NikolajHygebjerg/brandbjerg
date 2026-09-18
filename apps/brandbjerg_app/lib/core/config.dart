/// Basis-URL til Next.js API (mobil v1).
///
/// Lokal dev (emulator): Android `10.0.2.2:4317`, iOS simulator `127.0.0.1:4317`.
/// Produktion: https://brandbjerg-kurser.vercel.app
class AppConfig {
  static const String apiBaseUrl = String.fromEnvironment(
    "API_BASE_URL",
    defaultValue: "http://127.0.0.1:4317",
  );

  static Uri apiUri(String path) {
    final base = apiBaseUrl.endsWith("/")
        ? apiBaseUrl.substring(0, apiBaseUrl.length - 1)
        : apiBaseUrl;
    return Uri.parse("$base$path");
  }
}
