import "package:flutter/material.dart";

import "../../core/auth/session.dart";

class CourseProgramScreen extends StatefulWidget {
  const CourseProgramScreen({
    super.key,
    required this.session,
    required this.courseId,
    required this.title,
  });

  final AuthSession session;
  final String courseId;
  final String title;

  @override
  State<CourseProgramScreen> createState() => _CourseProgramScreenState();
}

class _CourseProgramScreenState extends State<CourseProgramScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.session.api.courseProgram(widget.courseId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _future,
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text(snapshot.error.toString()));
          }
          final days = snapshot.data!["days"] as List<dynamic>? ?? [];
          if (days.isEmpty) {
            return const Center(child: Text("Programmet er endnu ikke publiceret."));
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: days.length,
            itemBuilder: (context, i) {
              final day = days[i] as Map<String, dynamic>;
              final modules = day["modules"] as List<dynamic>? ?? [];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "${day["label"]} · ${day["dateLabel"]}",
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 8),
                      ...modules.map((m) {
                        final mod = m as Map<String, dynamic>;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: Text(
                            "${mod["tidFra"]}–${mod["tidTil"]}  ${mod["overskrift"]}",
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        );
                      }),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
