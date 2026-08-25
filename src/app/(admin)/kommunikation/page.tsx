import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { campaigns, formatDKK, getCourse } from "@/lib/mock-data";

export default function KommunikationPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-slate-500">Kommunikation</p>
        <h1 className="text-2xl font-bold text-slate-900">
          Rekruttering & kampagner
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Kampagner, opgaver og salgs-KPI på tværs af kurser
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardTitle className="text-2xl">550</CardTitle>
          <CardDescription>Leads i alt (mock)</CardDescription>
        </Card>
        <Card>
          <CardTitle className="text-2xl">43</CardTitle>
          <CardDescription>Konverteringer</CardDescription>
        </Card>
        <Card>
          <CardTitle className="text-2xl">7,8%</CardTitle>
          <CardDescription>Konverteringsrate</CardDescription>
        </Card>
      </div>

      <div className="space-y-4">
        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>{campaign.title}</CardTitle>
                <CardDescription>
                  {campaign.channel} · {campaign.startDate} – {campaign.endDate}
                </CardDescription>
                <div className="mt-3 flex flex-wrap gap-2">
                  {campaign.courses.map((courseId) => {
                    const course = getCourse(courseId);
                    return (
                      <span
                        key={courseId}
                        className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-800"
                      >
                        {course?.title ?? courseId}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center lg:min-w-[240px]">
                <div>
                  <p className="text-lg font-bold">{formatDKK(campaign.budget)}</p>
                  <p className="text-xs text-slate-500">Budget</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{campaign.leads}</p>
                  <p className="text-xs text-slate-500">Leads</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{campaign.conversions}</p>
                  <p className="text-xs text-slate-500">Tilmeldinger</p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase text-slate-500">
                Opgaver (mock)
              </p>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                <li>☐ SoMe-post — planlagt torsdag</li>
                <li>☑ Nyhedsbrev sendt</li>
                <li>☐ Plakat til reception — afventer tekst</li>
              </ul>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardTitle>E-mail-skabeloner</CardTitle>
        <CardDescription>Automatiske mails knyttet til kursusflow</CardDescription>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {[
            "Tilmeldingsbekræftelse",
            "Betalingspåmindelse",
            "Praktisk info før kursus",
            "Tak for deltagelse",
            "Aflysning / refusion",
          ].map((template) => (
            <div
              key={template}
              className="rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-700"
            >
              {template}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
