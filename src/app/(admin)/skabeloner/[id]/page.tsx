import { TemplateEditorView } from "@/components/mockup/template-editor-view";

export default async function SkabelonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TemplateEditorView templateId={id} />;
}
