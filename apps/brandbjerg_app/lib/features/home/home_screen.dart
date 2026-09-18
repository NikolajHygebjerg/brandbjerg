import "package:flutter/material.dart";

import "../../core/auth/session.dart";
import "../auth/login_screen.dart";
import "../kursist/kursist_home_screen.dart";
import "../staff/staff_home_screen.dart";

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key, required this.session});

  final AuthSession session;

  Future<void> _logout(BuildContext context) async {
    await session.logout();
    if (!context.mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => LoginScreen(session: session)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final name = session.user?["name"]?.toString() ?? "Bruger";
    final body = session.isStaff
        ? StaffHomeScreen(session: session)
        : KursistHomeScreen(session: session);

    return Scaffold(
      appBar: AppBar(
        title: Text("Hej, $name"),
        actions: [
          IconButton(
            onPressed: () => _logout(context),
            icon: const Icon(Icons.logout),
            tooltip: "Log ud",
          ),
        ],
      ),
      body: body,
    );
  }
}
