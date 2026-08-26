import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  Network,
  Shield,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const entryPoints = [
  {
    href: "/overblik",
    title: "Ledelsesoverblik",
    description:
      "Arkitektur, moduler, dataflow og integrationer — ideelt til præsentation for ledelsen.",
    icon: Network,
    highlight: true,
  },
  {
    href: "/planlaegning/statusark",
    title: "Årsoversigt",
    description:
      "Intern platform med årsoversigt, årshjul, kurser, tilmeldinger, kommunikation og økonomi.",
    icon: ClipboardCheck,
  },
  {
    href: "/katalog",
    title: "Offentligt kursuskatalog",
    description: "Hjemmeside-visning med kursusoversigt og tilmeldingsflow.",
    icon: Store,
  },
];

const modules = [
  "Årshjul & planlægning",
  "Kursusadministration",
  "Tilmelding & betaling",
  "Kommunikation & rekruttering",
  "Afvikling & deltagere",
  "Økonomi → KOMiT",
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-emerald-900 to-slate-900 text-white">
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-emerald-100">
          <Shield className="h-3.5 w-3.5" />
          GDPR-venlig mockup · ingen rigtige persondata
        </div>

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Kursusplatform til højskole
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-emerald-100">
          Interaktiv mockup der viser sider, funktioner og sammenhænge på tværs
          af afdelinger — bygget til ledelsespræsentation.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/login" className="bg-white text-emerald-900 hover:bg-emerald-50">
            Log ind
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button href="/overblik" variant="outline" className="border-white/30 text-white hover:bg-white/10">
            Ledelsesoverblik
          </Button>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {entryPoints.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Card
                  className={`h-full transition hover:shadow-md ${
                    item.highlight ? "ring-2 ring-emerald-400" : ""
                  }`}
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription className="mt-2 text-slate-600">
                    {item.description}
                  </CardDescription>
                </Card>
              </Link>
            );
          })}
        </div>

        <Card className="mt-8">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Moduler i mockuppen</CardTitle>
              <div className="mt-3 flex flex-wrap gap-2">
                {modules.map((mod) => (
                  <span
                    key={mod}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    {mod}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
