import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/mockup/stat-card";
import { enrollments, formatDKK } from "@/lib/mock-data";

const komitQueue = [
  {
    id: "sync-01",
    reference: "KUR-2026-042",
    participant: "Mette Hansen",
    amount: 1_450,
    status: "klar_til_import",
    date: "24. feb 2026",
  },
  {
    id: "sync-02",
    reference: "KUR-2026-038",
    participant: "Jens Pedersen",
    amount: 1_450,
    status: "importeret",
    date: "23. feb 2026",
  },
  {
    id: "sync-03",
    reference: "KUR-2026-035",
    participant: "Louise Frandsen",
    amount: 3_200,
    status: "afventer_godkendelse",
    date: "22. feb 2026",
  },
];

const statusLabels: Record<string, string> = {
  klar_til_import: "Klar til KOMiT-import",
  importeret: "Importeret i KOMiT",
  afventer_godkendelse: "Afventer godkendelse",
};

const statusColors: Record<string, string> = {
  klar_til_import: "bg-blue-100 text-blue-800",
  importeret: "bg-emerald-100 text-emerald-800",
  afventer_godkendelse: "bg-amber-100 text-amber-800",
};

export default function OekonomiPage() {
  const paidTotal = enrollments
    .filter((e) => e.status === "betalt")
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-slate-500">Regnskab</p>
        <h1 className="text-2xl font-bold text-slate-900">Økonomi & KOMiT</h1>
        <p className="mt-1 text-sm text-slate-500">
          Betalingsoversigt og synkronisering til KOMiT Finans
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Indbetalinger (sæson)" value={formatDKK(paidTotal)} />
        <StatCard label="Afventer KOMiT-sync" value="1" />
        <StatCard label="Importeret denne uge" value="12" hint="Mock-tal" />
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardTitle className="text-blue-900">KOMiT-integration (mock)</CardTitle>
        <CardDescription className="text-blue-800">
          Platformen genererer bogføringskladder som CSV til import i KOMiT
          Finans kassekladde. Debitor oprettes i KOMiT eller via stamdata-import.
        </CardDescription>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-200 px-4 py-3">
          <CardTitle>Synkroniseringskø</CardTitle>
          <CardDescription>Betalinger klar til eller sendt til KOMiT</CardDescription>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Deltager</th>
                <th className="px-4 py-3 font-medium">Beløb</th>
                <th className="px-4 py-3 font-medium">Dato</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {komitQueue.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-mono text-xs">{item.reference}</td>
                  <td className="px-4 py-3">{item.participant}</td>
                  <td className="px-4 py-3">{formatDKK(item.amount)}</td>
                  <td className="px-4 py-3 text-slate-600">{item.date}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[item.status]}`}
                    >
                      {statusLabels[item.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
