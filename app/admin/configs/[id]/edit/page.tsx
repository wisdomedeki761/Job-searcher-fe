"use client";

import Link from "next/link";
import { IconArrowLeft } from "@/components/icons";
import ConfigForm from "@/components/ConfigForm";

export default function EditConfigPage({
  params,
}: {
  params: { id: string };
}) {
  // Next 14 passes params as a plain object (Promise params are Next 15+).
  const { id } = params;

  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg px-4 pb-16 pt-6 md:max-w-2xl lg:max-w-3xl lg:px-8">
      <header className="mb-5 flex items-center gap-3">
        <Link href="/admin" className="btn-circle" aria-label="Back">
          <IconArrowLeft />
        </Link>
        <h1 className="text-xl font-bold">Edit search</h1>
      </header>
      <ConfigForm configId={id} />
    </div>
  );
}
