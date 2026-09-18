import "package:flutter_secure_storage/flutter_secure_storage.dart";

import "../api/brandbjerg_api.dart";

const _tokenKey = "brandbjerg_mobile_token";

class AuthSession {
  AuthSession({BrandbjergApi? api, FlutterSecureStorage? storage})
      : api = api ?? BrandbjergApi(),
        _storage = storage ?? const FlutterSecureStorage();

  final BrandbjergApi api;
  final FlutterSecureStorage _storage;

  Map<String, dynamic>? user;

  Future<void> restore() async {
    final token = await _storage.read(key: _tokenKey);
    if (token == null || token.isEmpty) return;
    api.setToken(token);
    final data = await api.me();
    user = data["user"] as Map<String, dynamic>?;
  }

  Future<void> login(String email, String password) async {
    final data = await api.login(email, password);
    final token = data["token"] as String?;
    if (token == null) throw ApiException("Manglende token");
    await _storage.write(key: _tokenKey, value: token);
    user = data["user"] as Map<String, dynamic>?;
  }

  Future<void> logout() async {
    await _storage.delete(key: _tokenKey);
    api.setToken(null);
    user = null;
  }

  bool get isLoggedIn => user != null;

  bool get isStaff => user?["isStaff"] == true;
}
