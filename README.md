# CurrenSee Backend (Node.js + Express + MySQL)

This replaces the local `sqflite` database (`db_helper.dart`) with a real
MySQL database sitting behind a small REST API, running on your machine.

## 1. Prerequisites

- Node.js 18+
- MySQL Server running locally (MySQL Workbench / XAMPP / native install — any works)

## 2. Set up the database

```bash
mysql -u root -p < db/schema.sql
```

This creates the `currensee` database and all tables (`users`, `conversions`,
`alerts`, `notifications`, `preferences`, `feedback`, `support_tickets`) —
matching the schema that was previously in `_onCreate` inside `db_helper.dart`.

## 3. Configure and run the server

```bash
cd currensee-backend
npm install
cp .env.example .env
# edit .env: set DB_PASSWORD to your MySQL password, and set a real JWT_SECRET
npm start
```

You should see:
```
CurrenSee backend listening on http://localhost:3000
```

Check it's alive: open `http://localhost:3000/health` in a browser — you should see `{"status":"ok"}`.

## 4. API overview

| Method | Route                          | Auth? | Purpose                          |
|--------|---------------------------------|-------|-----------------------------------|
| POST   | /api/auth/register              | No    | Create account, returns JWT       |
| POST   | /api/auth/login                 | No    | Log in, returns JWT               |
| GET    | /api/users/me                   | Yes   | Get profile                       |
| PUT    | /api/users/me                   | Yes   | Update profile                    |
| GET    | /api/users/me/preferences        | Yes   | Get preferences                   |
| PUT    | /api/users/me/preferences        | Yes   | Update preferences                |
| GET    | /api/conversions                | Yes   | List conversion history           |
| POST   | /api/conversions                | Yes   | Save a conversion result          |
| DELETE | /api/conversions/:id             | Yes   | Delete a conversion                |
| GET    | /api/alerts                     | Yes   | List rate alerts                  |
| POST   | /api/alerts                     | Yes   | Create a rate alert               |
| PUT    | /api/alerts/:id                  | Yes   | Toggle active / triggered         |
| DELETE | /api/alerts/:id                  | Yes   | Delete an alert                    |
| GET    | /api/notifications               | Yes   | List notifications                |
| PUT    | /api/notifications/:id/read       | Yes   | Mark as read                       |
| POST   | /api/feedback                   | Yes   | Submit feedback                   |
| GET    | /api/feedback                   | Yes   | List own feedback                 |
| POST   | /api/support                    | Yes   | Open a support ticket             |
| GET    | /api/support                    | Yes   | List own support tickets          |

Every "Yes" route needs a header: `Authorization: Bearer <token>` — the
token you got back from `/api/auth/register` or `/api/auth/login`.

## 5. Connecting from Flutter

Add `http` to `pubspec.yaml` if it isn't there already:

```yaml
dependencies:
  http: ^1.2.0
  shared_preferences: ^2.2.0
```

Extend `api_constants.dart` with your local backend's base URL. **Important:**
on a real device or emulator, `localhost` refers to the device itself, not
your computer:
- Android emulator → use `http://10.0.2.2:3000`
- iOS simulator → `http://localhost:3000` works fine
- Physical device → use your computer's LAN IP, e.g. `http://192.168.1.50:3000`

```dart
class ApiConstants {
  ApiConstants._();

  // Existing Frankfurter rate service...
  static const String baseUrl = 'https://api.frankfurter.app';

  // NEW: your own Node/MySQL backend
  static const String backendBaseUrl = 'http://10.0.2.2:3000/api';

  static String get registerUrl => '$backendBaseUrl/auth/register';
  static String get loginUrl => '$backendBaseUrl/auth/login';
  static String get conversionsUrl => '$backendBaseUrl/conversions';
  static String get alertsUrl => '$backendBaseUrl/alerts';
  static String get notificationsUrl => '$backendBaseUrl/notifications';
}
```

A minimal service replacing what `db_helper.dart` used to do directly:

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/api_constants.dart';

class BackendService {
  Future<String?> _token() async =>
      (await SharedPreferences.getInstance()).getString('auth_token');

  Future<Map<String, String>> _headers({bool auth = true}) async {
    final headers = {'Content-Type': 'application/json'};
    if (auth) {
      final token = await _token();
      if (token != null) headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Future<Map<String, dynamic>> register(String name, String email, String password) async {
    final res = await http.post(
      Uri.parse(ApiConstants.registerUrl),
      headers: await _headers(auth: false),
      body: jsonEncode({'name': name, 'email': email, 'password': password}),
    );
    if (res.statusCode != 201) throw Exception(jsonDecode(res.body)['error']);
    final data = jsonDecode(res.body);
    (await SharedPreferences.getInstance()).setString('auth_token', data['token']);
    return data['user'];
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await http.post(
      Uri.parse(ApiConstants.loginUrl),
      headers: await _headers(auth: false),
      body: jsonEncode({'email': email, 'password': password}),
    );
    if (res.statusCode != 200) throw Exception(jsonDecode(res.body)['error']);
    final data = jsonDecode(res.body);
    (await SharedPreferences.getInstance()).setString('auth_token', data['token']);
    return data['user'];
  }

  Future<List<dynamic>> getConversions() async {
    final res = await http.get(Uri.parse(ApiConstants.conversionsUrl), headers: await _headers());
    if (res.statusCode != 200) throw Exception('Failed to load conversions');
    return jsonDecode(res.body);
  }

  Future<void> saveConversion({
    required String fromCurrency,
    required String toCurrency,
    required double amount,
    required double convertedAmount,
    required double rate,
  }) async {
    final res = await http.post(
      Uri.parse(ApiConstants.conversionsUrl),
      headers: await _headers(),
      body: jsonEncode({
        'fromCurrency': fromCurrency,
        'toCurrency': toCurrency,
        'amount': amount,
        'convertedAmount': convertedAmount,
        'rate': rate,
      }),
    );
    if (res.statusCode != 201) throw Exception('Failed to save conversion');
  }
}
```

Your model classes (`conversion_model.dart`, `rate_alert_model.dart`, etc.)
don't need to change — `fromMap`/`toMap` work equally well on the JSON that
comes back from `jsonDecode(res.body)`, since the field names match the
column names already used in `db_helper.dart`.

## 6. What to do with `db_helper.dart`

You can either:
- Delete it and the `sqflite`/`path` dependencies once everything is migrated, or
- Keep it temporarily as an offline cache and sync with the backend later.

Either way, screens/providers that currently call `DBHelper.instance` should
be switched to call `BackendService` instead.
