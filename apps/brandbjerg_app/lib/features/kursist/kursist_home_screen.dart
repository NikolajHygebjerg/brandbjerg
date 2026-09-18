import "package:flutter/material.dart";

import "../../core/api/brandbjerg_api.dart";
import "../../core/auth/session.dart";
import "course_program_screen.dart";

class KursistHomeScreen extends StatefulWidget {
  const KursistHomeScreen({super.key, required this.session});

  final AuthSession session;

  @override
  State<KursistHomeScreen> createState() => _KursistHomeScreenState();
}

class _KursistHomeScreenState extends State<KursistHomeScreen> {
  late Future<List<dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.session.api.kursistEnrollments();
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async {
        setState(() {
          _future = widget.session.api.kursistEnrollments();
        });
        await _future;
      },
      child: FutureBuilder<List<dynamic>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const ListTile(
              title: Center(child: CircularProgressIndicator()),
            );
          }
          if (snapshot.hasError) {
            return ListView(
              children: [
                ListTile(
                  title: Text(
                    snapshot.error is ApiException
                        ? (snapshot.error as ApiException).message
                        : "Fejl ved hentning",
                  ),
                ),
              ],
            );
          }
          final items = snapshot.data ?? [];
          if (items.isEmpty) {
            return ListView(
              children: const [
                ListTile(
                  title: Text("Ingen tilmeldinger"),
                  subtitle: Text(
                    "Brug den e-mail du tilmeldte dig med (demo: deltager0@example.dk).",
                  ),
                ),
              ],
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, i) {
              final e = items[i] as Map<String, dynamic>;
              return Card(
                child: ListTile(
                  title: Text(e["title"]?.toString() ?? "Kursus"),
                  subtitle: Text(e["dateLabel"]?.toString() ?? ""),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => CourseProgramScreen(
                          session: widget.session,
                          courseId: e["courseId"] as String,
                          title: e["title"]?.toString() ?? "Program",
                        ),
                      ),
                    );
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}
