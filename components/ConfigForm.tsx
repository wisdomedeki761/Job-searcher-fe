"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import i18nCountries from "i18n-iso-countries";
import Alert from "@/components/Alert";
import {
  IconCheck,
  IconChevronDown,
  IconGlobe,
  IconRefresh,
  IconSearch,
  IconSparkles,
} from "@/components/icons";
import {
  admin,
  fetchSources,
  getStoredAdmin,
  getToken,
  type AIProfile,
  type SearchConfig,
} from "@/lib/api";

const EMPLOYMENT = ["any", "full_time", "part_time", "contract", "internship"];
const WORK_MODE = ["any", "remote", "hybrid", "onsite"];

/** Every country in the world (English names), sorted alphabetically. */
const COUNTRIES = Object.values(i18nCountries.getNames("en")).sort((a, b) =>
  a.localeCompare(b),
);

/** Editable chip-list input: chips live inside the well, type + Enter/comma. */
function TagsInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    onChange([...new Set([...value, ...parts])]);
    setDraft("");
  };

  return (
    <div>
      <label className="label">{label}</label>
      <div className="field mt-2 flex min-h-[52px] flex-wrap items-center gap-2 p-2.5">
        {value.map((v) => (
          <span key={v} className="chip chip-accent capitalize">
            {v}
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== v))}
              className="ml-0.5 hover:opacity-70"
              aria-label={`Remove ${v}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            }
          }}
          onBlur={() => add(draft)}
          placeholder={placeholder}
          className="min-w-[160px] flex-1 border-0 bg-transparent p-0 text-xs text-ink outline-none placeholder:text-placeholder"
        />
      </div>
    </div>
  );
}

/** Scrollable list of every country in the world (LOCATIONS · BROWSE ALL). */
function CountryPicker({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle
      ? COUNTRIES.filter((c) => c.toLowerCase().includes(needle))
      : COUNTRIES;
  }, [q]);

  return (
    <div className="mt-3 flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5"
      >
        <IconGlobe className="h-[18px] w-[18px] text-accent" />
        <span className="flex-1 text-left text-xs font-semibold text-accent">
          Browse all countries
        </span>
        <IconChevronDown
          className={`h-4 w-4 text-muted transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div className="field flex h-11 items-center gap-2.5 p-3">
            <IconSearch className="h-4 w-4 shrink-0 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search countries…"
              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[13px] text-ink outline-none placeholder:text-placeholder"
              autoFocus
            />
          </div>
          <div className="field h-64 overflow-y-auto p-0 px-3">
            {filtered.length === 0 ? (
              <p className="px-2 py-2 text-sm text-muted">
                No countries match &ldquo;{q}&rdquo;.
              </p>
            ) : (
              filtered.map((c) => {
                const active = selected.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onToggle(c)}
                    className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-2 text-left text-[13px] transition ${
                      active
                        ? "bg-accent-soft font-medium text-accent"
                        : "text-ink hover:bg-field"
                    }`}
                  >
                    <span className="flex-1">{c}</span>
                    {active && <IconCheck className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
          <p className="text-[11px] text-muted">
            {COUNTRIES.length} countries · {selected.length} selected
          </p>
        </>
      )}
    </div>
  );
}

/** Selects rendered as chip rows (SELECTS · AVAILABLE OPTIONS). */
function ChipSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`chip capitalize transition ${value === v ? "chip-accent" : "hover:text-ink"}`}
          >
            {v.replace("_", " ")}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Shared create/edit form for a search config. When `configId` is undefined
 * the form creates a new config; otherwise it loads and updates that config.
 */
export default function ConfigForm({ configId }: { configId?: string }) {
  const isEdit = Boolean(configId);
  const router = useRouter();

  const [jobType, setJobType] = useState("");
  const [cron, setCron] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [exclude, setExclude] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [employment, setEmployment] = useState("any");
  const [workMode, setWorkMode] = useState("any");
  const [sources, setSources] = useState<string[]>([]);
  const [lookback, setLookback] = useState(24);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [enabled, setEnabled] = useState(true);

  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [enriching, setEnriching] = useState(false);

  // Auth guard + load existing config + available sources.
  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    // View-only accounts can't edit configs — back to the feed.
    const cached = getStoredAdmin();
    if (cached && !cached.can_manage_configs) {
      router.replace("/");
      return;
    }
    fetchSources()
      .then((s) => setAvailableSources(s.sources))
      .catch(() => setAvailableSources([]));

    if (configId) {
      admin
        .getConfig(configId)
        .then((cfg: SearchConfig) => {
          setJobType(cfg.job_type);
          setCron(cfg.cron_expression);
          setKeywords(cfg.keywords ?? []);
          setExclude(cfg.exclude_keywords ?? []);
          setLocations(cfg.locations ?? []);
          setEmployment(cfg.employment_type || "any");
          setWorkMode(cfg.work_mode || "any");
          setSources(cfg.sources ?? []);
          setLookback(cfg.lookback_hours || 24);
          setAiGenerated(cfg.ai_generated);
          setEnabled(cfg.enabled);
        })
        .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
    }
  }, [configId, router]);

  /** Ask the AI to fill keywords/locations/schedule from the job type. */
  const enrich = useCallback(async () => {
    if (!jobType.trim()) {
      setError("Enter a job type first, then let the AI fill the profile.");
      return;
    }
    setEnriching(true);
    setError(null);
    try {
      const p: AIProfile = await admin.enrich(jobType.trim());
      setKeywords(p.keywords ?? []);
      setExclude(p.exclude_keywords ?? []);
      setLocations(p.locations ?? []);
      setEmployment(p.employment_type || "any");
      setWorkMode(p.work_mode || "any");
      if (p.sources?.length) setSources(p.sources);
      if (p.lookback_hours) setLookback(p.lookback_hours);
      if (p.suggested_cron && !cron) setCron(p.suggested_cron);
      setAiGenerated(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI enrichment failed");
    } finally {
      setEnriching(false);
    }
  }, [jobType, cron]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!jobType.trim()) {
      setError("Job type is required.");
      return;
    }
    if (!Number.isFinite(lookback) || lookback < 1 || lookback > 720) {
      setError("Lookback hours must be between 1 and 720.");
      return;
    }
    setBusy(true);
    setError(null);
    const body = {
      job_type: jobType.trim(),
      cron_expression: cron.trim(),
      keywords,
      exclude_keywords: exclude,
      locations,
      employment_type: employment,
      work_mode: workMode,
      sources,
      lookback_hours: lookback,
      ai_generated: aiGenerated,
      enabled,
    };
    try {
      if (configId) {
        await admin.updateConfig(configId, body);
      } else {
        await admin.createConfig(body);
      }
      router.push("/admin");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't save this search. Please try again.",
      );
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="card flex flex-col gap-6 p-7">
      {/* FORM · SAVING — the whole field stack dims while the request runs */}
      <div className={busy ? "flex flex-col gap-6 opacity-50" : "contents"}>
      <div>
        <label htmlFor="jobType" className="label">
          Job type *
        </label>
        <input
          id="jobType"
          value={jobType}
          onChange={(e) => setJobType(e.target.value)}
          placeholder="e.g. Frontend React Developer"
          required
          disabled={busy || enriching}
          className="field mt-2"
        />
      </div>

      <button
        type="button"
        onClick={enrich}
        disabled={enriching || busy}
        className="btn-ghost w-full"
      >
        <IconSparkles className="h-4 w-4 text-accent" />
        {enriching ? "AI is filling the profile…" : "Auto-fill with AI"}
      </button>

      {/* AI · FILLING THE PROFILE — fields below keep their shape as skeletons */}
      {enriching ? (
        <>
          <div className="card flex h-[100px] flex-col items-start gap-3.5 p-5">
            <div className="skeleton h-4 w-full shrink-0 rounded-[5px]" />
            <div className="skeleton h-3 w-[140px] shrink-0 rounded-[5px]" />
            <div className="skeleton h-3 w-[100px] shrink-0 rounded-[5px]" />
          </div>
          <div className="card flex h-[100px] flex-col items-start gap-3.5 p-5">
            <div className="skeleton h-4 w-full shrink-0 rounded-[5px]" />
            <div className="skeleton h-3 w-[140px] shrink-0 rounded-[5px]" />
            <div className="skeleton h-3 w-[100px] shrink-0 rounded-[5px]" />
          </div>
          <p className="text-xs text-muted">
            Finding relevant keywords, exclusions, locations, employment, work
            mode, schedule, lookback, sources, and enabled status…
          </p>
        </>
      ) : (
        <>
          <div className="divider" />

          <TagsInput
            label="Keywords"
            value={keywords}
            onChange={setKeywords}
            placeholder="Type and press Enter or comma"
          />
          <TagsInput
            label="Exclude keywords"
            value={exclude}
            onChange={setExclude}
            placeholder="Type and press Enter or comma"
          />
          <div>
            <TagsInput
              label="Locations"
              value={locations}
              onChange={setLocations}
              placeholder="Type and press Enter or comma"
            />
            <CountryPicker
              selected={locations}
              onToggle={(name) =>
                setLocations((prev) =>
                  prev.includes(name)
                    ? prev.filter((x) => x !== name)
                    : [...prev, name],
                )
              }
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <ChipSelect
              label="Employment"
              options={EMPLOYMENT}
              value={employment}
              onChange={setEmployment}
            />
            <ChipSelect
              label="Work mode"
              options={WORK_MODE}
              value={workMode}
              onChange={setWorkMode}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cron" className="label">
                Cron schedule
              </label>
              <input
                id="cron"
                value={cron}
                onChange={(e) => setCron(e.target.value)}
                placeholder="0 */6 * * *"
                required
                className="field mt-2 font-mono"
              />
              <p className="hint mt-1.5">e.g. every 6 hours</p>
            </div>
            <div>
              <label htmlFor="lookback" className="label">
                Lookback hours
              </label>
              <input
                id="lookback"
                type="number"
                min={1}
                max={720}
                value={lookback}
                onChange={(e) => setLookback(Number(e.target.value))}
                className="field mt-2"
              />
              <p className="hint mt-1.5">From 1 to 720 hours</p>
            </div>
          </div>

          {availableSources.length > 0 && (
            <div>
              <label className="label">Sources</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {availableSources.map((s) => {
                  const active = sources.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() =>
                        setSources(
                          active ? sources.filter((x) => x !== s) : [...sources, s],
                        )
                      }
                      className={`chip capitalize transition ${
                        active ? "chip-accent" : "hover:text-ink"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              <p className="hint mt-2">Choose one or more registered sources.</p>
            </div>
          )}

          <div className="divider" />

          <label className="flex cursor-pointer items-center justify-between gap-4">
            <span className="text-sm font-medium text-ink">
              Enabled
              <span className="mt-0.5 block text-[11px] font-normal text-muted">
                Run this search automatically on its schedule.
              </span>
            </span>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="switch"
            />
          </label>
        </>
      )}
      </div>

      {/* FORM · VALIDATION & SERVER ERROR */}
      {error && <Alert>{error}</Alert>}

      <button type="submit" disabled={busy || enriching} className="btn-primary w-full">
        {busy && <IconRefresh className="h-4 w-4 animate-spin" />}
        {busy ? "Saving…" : isEdit ? "Save changes" : "Create search"}
      </button>
    </form>
  );
}
