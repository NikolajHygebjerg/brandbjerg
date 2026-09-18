import "dart:convert";

import "package:http/http.dart" as http;

import "../config.dart";

class BrandbjergApi {
  BrandbjergApi({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;
  String? _token;

  void setToken(String? token) => _token = token;

  Map<String, String> _headers({bool json = false}) {
    final h = <String, String>{};
    if (json) h["Content-Type"] = "application/json";
    if (_token != null) h["Authorization"] = "Bearer $_token";
    return h;
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await _client.post(
      AppConfig.apiUri("/api/v1/auth/login"),
      headers: _headers(json: true),
      body: jsonEncode({"email": email, "password": password}),
    );
    final data = _decode(res);
    if (res.statusCode >= 400) {
      throw ApiException(data["error"]?.toString() ?? "Login fejlede");
    }
    _token = data["token"] as String?;
    return data;
  }

  Future<Map<String, dynamic>> me() async {
    final res = await _client.get(
      AppConfig.apiUri("/api/v1/me"),
      headers: _headers(),
    );
    return _decode(res);
  }

  Future<List<dynamic>> kursistEnrollments() async {
    final res = await _client.get(
      AppConfig.apiUri("/api/v1/kursist/enrollments"),
      headers: _headers(),
    );
    final data = _decode(res);
    if (res.statusCode >= 400) {
      throw ApiException(data["error"]?.toString() ?? "Kunne ikke hente kurser");
    }
    return (data["enrollments"] as List<dynamic>? ?? []);
  }

  Future<List<dynamic>> staffCourses({int? year}) async {
    var path = "/api/v1/staff/courses";
    if (year != null) path += "?year=$year";
    final res = await _client.get(
      AppConfig.apiUri(path),
      headers: _headers(),
    );
    final data = _decode(res);
    if (res.statusCode >= 400) {
      throw ApiException(data["error"]?.toString() ?? "Kunne ikke hente kurser");
    }
    return (data["courses"] as List<dynamic>? ?? []);
  }

  Future<Map<String, dynamic>> courseProgram(String courseId) async {
    final res = await _client.get(
      AppConfig.apiUri("/api/v1/courses/$courseId/program"),
      headers: _headers(),
    );
    final data = _decode(res);
    if (res.statusCode >= 400) {
      throw ApiException(data["error"]?.toString() ?? "Kunne ikke hente program");
    }
    return data;
  }

  Map<String, dynamic> _decode(http.Response res) {
    try {
      return jsonDecode(res.body) as Map<String, dynamic>;
    } catch (_) {
      throw ApiException("Ugyldigt svar fra server (${res.statusCode})");
    }
  }
}

class ApiException implements Exception {
  ApiException(this.message);
  final String message;

  @override
  String toString() => message;
}
