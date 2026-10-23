import { IconBriefcase, IconMapPin, IconClock } from "@/components/icons";

/**
 * Left rail on the new/edit search pages: eyebrow chip, headline, and the
 * three setup tips from the desktop export.
 */
export default function ConfigRail({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  const tips = [
    {
      Icon: IconBriefcase,
      heading: "Define the role",
      body: "Use focused keywords and exclusions to keep results relevant.",
    },
    {
      Icon: IconMapPin,
      heading: "Choose your reach",
      body: "Target locations and sources that work for you.",
    },
    {
      Icon: IconClock,
      heading: "Set your rhythm",
      body: "Check every 6 hours, or choose your own cron schedule.",
    },
  ];

  return (
    <div className="flex flex-col gap-6 pt-2">
      <span className="chip chip-accent uppercase">{eyebrow}</span>
      <h1 className="text-[38px] font-semibold leading-tight text-ink">
        {title}
      </h1>
      <p className="text-sm text-muted">
        Tell us what a great role looks like. We&apos;ll keep an eye on the
        sources, so you don&apos;t have to.
      </p>

      <div className="divider" />

      <div className="flex flex-col gap-4">
        {tips.map(({ Icon, heading, body }) => (
          <div key={heading} className="flex items-start gap-3">
            <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-accent" />
            <div>
              <p className="text-[13px] font-semibold text-ink">{heading}</p>
              <p className="mt-0.5 text-xs text-muted">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="rounded-xl bg-accent-soft px-4 py-3 text-xs text-accent">
        ✦ Start with a job type and let AI fill the profile. You stay in control
        of every field.
      </p>
    </div>
  );
}
