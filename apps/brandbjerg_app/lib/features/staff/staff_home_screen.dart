import "package:flutter/material.dart";

import "../../core/auth/session.dart";
import "../kursist/course_program_screen.dart";

class StaffHomeScreen extends StatefulWidget {
  const StaffHomeScreen({super.key, required this.session});

  final AuthSession session;

  @override
  State<StaffHomeScreen> createState() => _StaffHomeScreenState();
}

class _StaffHomeScreenState extends State<StaffHomeScreen> {
  late Future<List<dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.session.api.staffCourses();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Text(
            "Medarbejder — kurser",
            style: Theme.of(context).textTheme.titleLarge,
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: () async {
              setState(() {
                _future = widget.session.api.staffCourses();
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
                final items = snapshot.data ?? [];
                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, i) {
                    final c = items[i] as Map<String, dynamic>;
                    return Card(
                      child: ListTile(
                        title: Text(c["title"]?.toString() ?? "Kursus"),
                        subtitle: Text(
                          "Uge ${c["weekNumber"]} · ${c["enrolled"]}/${c["capacity"]} tilmeldte",
                        ),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => CourseProgramScreen(
                                session: widget.session,
                                courseId: c["id"] as String,
                                title: c["title"]?.toString() ?? "Program",
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
          ),
        ),
      ],
    );
  }
}
