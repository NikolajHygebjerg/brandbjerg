import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CreditCard,
  Database,
  Mail,
  Network,
  Shield,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { FlowCard } from "@/components/mockup/stat-card";

const lifecycle = [
  "Udkast → Godkendt → Markedsføres → Åben tilmelding → Fuldt → Afvikles → Afsluttet",
];

const roles = [
  { role: "Planlægning", access: "Årshjul, oprette kurser, kapacitet" },
  { role: "Kommunikation", access: "Kampagner, tekster, mailskabeloner" },
  { role: "Salg", access: "Tilmeldinger, venteliste, manuelle tilmeldinger" },
  { role: "Afvikling", access: "Deltagerlister, fremmøde, praktisk info" },
  { role: "Regnskab", access: "Betalinger, KOMiT-sync, afstemning" },
  { role: "Ledelse", access: "Overblik, godkendelse, rapporter" },
];

const integrations = [
  {
    name: "KOMiT Finans",
    type: "Regnskab",
    flow: "Tilmelding betalt → bogføringskladde (CSV) → KOMiT",
    status: "Adapter-lag (mockup)",
  },
  {
    name: "Betalingsgateway",
    type: "QuickPay / Stripe",
    flow: "Tilmelding → betalingslink → webhook → status opdateres",
    status: "Planlagt",
  },
  {
    name: "E-mail",
    type: "Brevo / Resend",
    flow: "Bekræftelse, påmindelse, praktisk info",
    status: "Planlagt",
  },
  {
    name: "Hjemmeside",
    type: "Offentligt katalog",
    flow: "Kursuskatalog → tilmelding → admin-dashboard",
    status: "I mockup",
  },
];

export default function OverblikPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-sm text-slate-500">Ledelsespræsentation</p>
            <h1 className="text-xl font-bold text-slate-900">
              Platformoverblik & sammenhænge
            </h1>
          </div>
          <div className="flex gap-2">
            <Button href="/" variant="ghost">
              Forside
            </Button>
            <Button href="/planlaegning/statusark">
              Se admin
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <Card className="border-emerald-200 bg-emerald-50">
          <CardTitle className="text-emerald-900">
            Vision: Én platform for hele kursuslivscyklussen
          </CardTitle>
          <CardDescription className="text-emerald-800">
            Alle afdelinger arbejder i samme system omkring kurset — fra
            planlægning til afvikling. KOMiT forbliver regnskabssystem.
          </CardDescription>
        </Card>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Kursuslivscyklus
          </h2>
          <Card>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {[
                "Udkast",
                "Godkendt",
                "Markedsføres",
                "Åben",
                "Fuldt",
                "Afvikles",
                "Afsluttet",
              ].map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <span className="rounded-lg bg-slate-100 px-3 py-2 font-medium text-slate-800">
                    {step}
                  </span>
                  {i < 6 && <ArrowRight className="h-4 w-4 text-slate-400" />}
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-500">{lifecycle[0]}</p>
          </Card>
        </section>

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Network className="h-5 w-5" />
            Arkitektur & dataflow
          </h2>
          <div className="grid gap-4 lg:grid-cols-3">
            <FlowCard
              title="Custom platform"
              description="Kerne for korte kurser"
              items={[
                "Årshjul & kursusplanlægning",
                "Offentlig tilmelding & betaling",
                "Kommunikation & rekruttering",
                "Tværgående aktivitetslog",
              ]}
            />
            <FlowCard
              title="Integrationer"
              description="Eksterne systemer"
              items={[
                "Betalingsgateway (webhooks)",
                "E-mail (transaktionelt + marketing)",
                "KOMiT Finans (bogføring)",
              ]}
            />
            <FlowCard
              title="KOMiT (eksisterende)"
              description="Bevares som regnskab"
              items={[
                "Debitorer & posteringer",
                "Moms & bankafstemning",
                "Løn & langkursus-elever",
              ]}
            />
          </div>

          <Card className="mt-4">
            <pre className="overflow-x-auto text-xs leading-relaxed text-slate-700 sm:text-sm">
{`┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Offentlig hjemmeside │────▶│  Kursusplatform   │────▶│  KOMiT Finans   │
│  (katalog/tilmelding) │     │  (admin + data)   │     │  (bogføring)    │
└─────────────────────┘     └────────┬─────────┘     └─────────────────┘
                                       │
                              ┌────────┴─────────┐
                              │ Betaling · E-mail  │
                              └────────────────────┘`}
            </pre>
          </Card>
        </section>

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Users className="h-5 w-5" />
            Roller & adgang
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((r) => (
              <Card key={r.role}>
                <CardTitle className="text-sm">{r.role}</CardTitle>
                <CardDescription>{r.access}</CardDescription>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Database className="h-5 w-5" />
            Integrationer
          </h2>
          <div className="space-y-3">
            {integrations.map((int) => (
              <Card key={int.name} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-sm">{int.name}</CardTitle>
                  <CardDescription>
                    {int.type} · {int.flow}
                  </CardDescription>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {int.status}
                </span>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Shield className="h-5 w-5" />
            GDPR & sikkerhed
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FlowCard
              title="Dataminimering"
              description="Ingen CPR som standard"
              items={[
                "Kun navn, e-mail, telefon til korte kurser",
                "CPR kun hvor lovkrav kræver det",
                "Automatisk sletning efter retention",
              ]}
            />
            <FlowCard
              title="Teknisk sikkerhed"
              description="Når platformen bygges"
              items={[
                "EU-hosting & databehandleraftaler",
                "Kryptering i transit og hvile",
                "Audit log & rollebaseret adgang",
              ]}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Foreslåede faser
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {[
              { phase: "Fase 1", title: "Kerne", desc: "Årshjul, kurser, roller" },
              { phase: "Fase 2", title: "Salg", desc: "Tilmelding, betaling, mails" },
              { phase: "Fase 3", title: "KOMiT", desc: "Bogføringskladde, afstemning" },
              { phase: "Fase 4", title: "Rekruttering", desc: "Kampagner, KPI" },
            ].map((p) => (
              <Card key={p.phase}>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  {p.phase}
                </p>
                <CardTitle className="mt-1">{p.title}</CardTitle>
                <CardDescription>{p.desc}</CardDescription>
              </Card>
            ))}
          </div>
        </section>

        <Card className="bg-slate-900 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-white">Klar til demo?</CardTitle>
              <CardDescription className="text-slate-300">
                Gå videre til admin-dashboard eller offentligt katalog.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button href="/planlaegning/statusark" className="bg-emerald-600 hover:bg-emerald-500">
                <Building2 className="h-4 w-4" />
                Admin
              </Button>
              <Button href="/katalog" variant="secondary">
                <CreditCard className="h-4 w-4" />
                Katalog
              </Button>
              <Button href="/planlaegning/kurser/kur-001" variant="ghost" className="text-white hover:bg-white/10">
                <Mail className="h-4 w-4" />
                Eksempelkursus
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
