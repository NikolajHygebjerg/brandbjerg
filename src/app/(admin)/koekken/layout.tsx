import { KitchenSubnav } from "@/components/mockup/kitchen-subnav";

export default function KoekkenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <KitchenSubnav />
      {children}
    </div>
  );
}
