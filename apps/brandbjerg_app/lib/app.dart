import "package:flutter/material.dart";

import "core/auth/session.dart";
import "features/auth/login_screen.dart";
import "features/home/home_screen.dart";

class BrandbjergApp extends StatefulWidget {
  const BrandbjergApp({super.key, required this.session});

  final AuthSession session;

  @override
  State<BrandbjergApp> createState() => _BrandbjergAppState();
}

class _BrandbjergAppState extends State<BrandbjergApp> {
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    try {
      await widget.session.restore();
    } catch (_) {
      await widget.session.logout();
    }
    if (mounted) setState(() => _ready = true);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: "Brandbjerg",
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF047857),
          brightness: Brightness.light,
        ),
        useMaterial3: true,
      ),
      home: !_ready
          ? const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            )
          : widget.session.isLoggedIn
              ? HomeScreen(session: widget.session)
              : LoginScreen(session: widget.session),
    );
  }
}
