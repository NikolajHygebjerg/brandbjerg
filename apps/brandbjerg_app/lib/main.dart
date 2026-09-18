import "package:flutter/material.dart";

import "app.dart";
import "core/auth/session.dart";

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(BrandbjergApp(session: AuthSession()));
}
