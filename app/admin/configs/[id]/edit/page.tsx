"use client";

import ConfigForm from "@/components/ConfigForm";
import ConfigRail from "@/components/ConfigRail";
import PageShell from "@/components/PageShell";
import TopBar from "@/components/TopBar";

export default function EditConfigPage({
  params,
}: {
  params: { id: string };
}) {
  // Next 14 passes params as a plain object (Promise params are Next 15+).
  const { id } = params;

  return (
    <PageShell>
      <TopBar title="Edit search" backHref="/admin" />
      <div className="grid gap-6 lg:grid-cols-[344px_minmax(0,1fr)] lg:items-start lg:gap-14">
        <ConfigRail
          eyebrow="Configuration · Editing"
          title="A little fine-tuning. A better fit."
        />
        <ConfigForm configId={id} />
      </div>
    </PageShell>
  );
}
