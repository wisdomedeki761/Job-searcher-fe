"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import i18nCountries from "i18n-iso-countries";
import { IconArrowLeft, IconSparkles } from "@/components/icons";
import {
  admin,
  fetchSources,
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

/** Editable chip-list input: type then Enter/comma to add. */
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
      <label className="label-soft">{label}</label>
      <div className="mb-2 flex flex-wrap gap-2">
        {value.map((v) => (
          <span key={v} className="glass-chip capitalize">
            {v}
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== v))}
              className="ml-1 text-muted hover:text-rose"
              aria-label={`Remove ${v}`}
            >
              ✕
            </button>
          </span>
        ))}
      </div>
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
        className="input-neu"
      />
    </div>
  );
}

/** Button that opens a searchable list of every country in the world. */
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
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="btn-ghost w-full"
      >
        🌍 {open ? "Hide country list" : "Browse all countries"}
        {selected.length > 0 && (
          <span className="glass-chip ml-2 px-2">{selected.length} selected</span>
        )}
      </button>

      {open && (
        <div className="glass mt-2 p-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${COUNTRIES.length} countries…`}
            className="input-neu mb-2"
            autoFocus
          />
          <div className="max-h-64 overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted">
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
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition hover:bg-surface ${
                      active ? "text-accent" : ""
                    }`}
                  >
                    <span>{c}</span>
                    {active && <span aria-hidden>✓</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
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
      router.replace("/admin/login");
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
      setError(err instanceof Error ? err.message : "Save failed");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="glass space-y-4 p-5">
      <div>
        <label htmlFor="jobType" className="label-soft">
          Job type
        </label>
        <input
          id="jobType"
          value={jobType}
          onChange={(e) => setJobType(e.target.value)}
          placeholder="e.g. Frontend React Developer"
          required
          className="input-neu"
        />
      </div>

      <button
        type="button"
        onClick={enrich}
        disabled={enriching}
        className="btn-ghost w-full text-accent disabled:opacity-60"
      >
        <IconSparkles className="h-4 w-4" />
        {enriching ? "AI is filling the profile…" : "Auto-fill with AI"}
      </button>

      <TagsInput
        label="Keywords"
        value={keywords}
        onChange={setKeywords}
        placeholder="react, typescript…"
      />
      <TagsInput
        label="Exclude keywords"
        value={exclude}
        onChange={setExclude}
        placeholder="junior, unpaid…"
      />
      <div>
        <TagsInput
          label="Locations"
          value={locations}
          onChange={setLocations}
          placeholder="Remote, Berlin…"
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="employment" className="label-soft">
            Employment
          </label>
          <select
            id="employment"
            value={employment}
            onChange={(e) => setEmployment(e.target.value)}
            className="input-neu capitalize"
          >
            {EMPLOYMENT.map((v) => (
              <option key={v} value={v} className="capitalize">
                {v.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="workMode" className="label-soft">
            Work mode
          </label>
          <select
            id="workMode"
            value={workMode}
            onChange={(e) => setWorkMode(e.target.value)}
            className="input-neu capitalize"
          >
            {WORK_MODE.map((v) => (
              <option key={v} value={v} className="capitalize">
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="cron" className="label-soft">
            Cron schedule
          </label>
          <input
            id="cron"
            value={cron}
            onChange={(e) => setCron(e.target.value)}
            placeholder="0 */6 * * *"
            required
            className="input-neu"
          />
          <p className="mt-1 text-[11px] text-muted">e.g. every 6 hours</p>
        </div>
        <div>
          <label htmlFor="lookback" className="label-soft">
            Lookback (hours)
          </label>
          <input
            id="lookback"
            type="number"
            min={1}
            max={720}
            value={lookback}
            onChange={(e) => setLookback(Number(e.target.value))}
            className="input-neu"
          />
        </div>
      </div>

      {availableSources.length > 0 && (
        <div>
          <label className="label-soft">Sources</label>
          <div className="flex flex-wrap gap-2">
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
                  className={`glass-chip capitalize transition ${active ? "glass-chip-active" : ""}`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <label className="flex items-center justify-between rounded-2xl px-1 py-1">
        <span className="text-sm font-medium">Enabled</span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-6 w-11 cursor-pointer appearance-none rounded-full bg-surface shadow-neu-inset transition checked:bg-accent"
        />
      </label>

      {error && (
        <p className="rounded-2xl bg-rose/10 px-4 py-3 text-sm text-rose">{error}</p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="btn-primary w-full disabled:opacity-60"
      >
        {busy ? "Saving…" : isEdit ? "Save changes" : "Create search"}
      </button>
    </form>
  );
}
