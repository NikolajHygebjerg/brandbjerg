import "package:brandbjerg_app/app.dart";
import "package:brandbjerg_app/core/auth/session.dart";
import "package:flutter_test/flutter_test.dart";

void main() {
  testWidgets("App starter uden crash", (tester) async {
    await tester.pumpWidget(BrandbjergApp(session: AuthSession()));
    await tester.pump();
    expect(find.textContaining("Brandbjerg"), findsWidgets);
  });
}
