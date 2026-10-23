"use client";

import ConfigForm from "@/components/ConfigForm";
import ConfigRail from "@/components/ConfigRail";
import PageShell from "@/components/PageShell";
import TopBar from "@/components/TopBar";

export default function NewConfigPage() {
  return (
    <PageShell>
      <TopBar title="New search" backHref="/admin" />
      <div className="grid gap-6 lg:grid-cols-[344px_minmax(0,1fr)] lg:items-start lg:gap-14">
        <ConfigRail
          eyebrow="Configuration · New search"
          title="Give your search a sharper signal."
        />
        <ConfigForm />
      </div>
    </PageShell>
  );
}
