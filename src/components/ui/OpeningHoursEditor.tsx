"use client";
import { OpeningHours, DayHours } from "@/types";

const DAYS = [
  { key: "monday",    label: "Lundi" },
  { key: "tuesday",   label: "Mardi" },
  { key: "wednesday", label: "Mercredi" },
  { key: "thursday",  label: "Jeudi" },
  { key: "friday",    label: "Vendredi" },
  { key: "saturday",  label: "Samedi" },
  { key: "sunday",    label: "Dimanche" },
];

const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

const DEFAULT_DAY: DayHours = {
  closed: false,
  mode: "split",
  continuousOpen: "09:00", continuousClose: "18:00",
  morningEnabled: true, morningOpen: "09:00", morningClose: "12:30",
  afternoonEnabled: true, afternoonOpen: "14:00", afternoonClose: "18:00",
};

interface Props {
  value: OpeningHours;
  onChange: (h: OpeningHours) => void;
}

export default function OpeningHoursEditor({ value, onChange }: Props) {
  const get = (key: string): DayHours => {
    const existing = (value as any)[key];
    // morningEnabled/afternoonEnabled par défaut à true si absents (fiches
    // existantes créées avant l'ajout de la dissociation matin/après-midi).
    return {
      ...DEFAULT_DAY,
      ...(existing ?? {}),
      morningEnabled: existing?.morningEnabled ?? true,
      afternoonEnabled: existing?.afternoonEnabled ?? true,
    };
  };

  const set = (key: string, patch: Partial<DayHours>) =>
    onChange({ ...value, [key]: { ...get(key), ...patch } });

  const copyWeekdays = (src: string) => {
    const s = get(src);
    const upd = { ...value };
    ["monday","tuesday","wednesday","thursday","friday"].forEach(d => {
      (upd as any)[d] = { ...s };
    });
    onChange(upd);
  };

  const TimeSelect = ({
    value: v, onChange: oc, disabled,
  }: { value: string; onChange: (t: string) => void; disabled?: boolean }) => (
    <select
      value={v || ""}
      onChange={e => oc(e.target.value)}
      disabled={disabled}
      className="input-field py-1 text-sm w-[82px] flex-shrink-0 disabled:opacity-40"
    >
      {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
    </select>
  );

  return (
    <div className="space-y-2">
      {/* Header legend */}
      <div className="hidden sm:flex gap-2 px-4 pb-1">
        <span className="text-xs text-gray-400 font-medium">Choisissez, pour chaque jour, entre une journée continue ou une coupure matin / après-midi — le matin et l&apos;après-midi peuvent être activés indépendamment.</span>
      </div>

      {DAYS.map(({ key, label }) => {
        const d = get(key);
        return (
          <div
            key={key}
            className={`rounded-xl border px-4 py-3 transition-colors ${
              d.closed ? "bg-gray-50 border-gray-100" : "bg-white border-gray-200"
            }`}
          >
            <div className="flex flex-wrap items-start gap-3">
              <span className="w-24 pt-1.5 text-sm font-semibold text-gray-700 flex-shrink-0">
                {label}
              </span>

              <div className="flex items-center gap-2 pt-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => set(key, { closed: !d.closed })}
                  className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none ${
                    d.closed ? "bg-gray-300" : "bg-landes-forest"
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                    d.closed ? "left-0.5" : "left-5"
                  }`} />
                </button>
                <span className={`text-xs font-medium ${d.closed ? "text-gray-400" : "text-landes-forest"}`}>
                  {d.closed ? "Fermé" : "Ouvert"}
                </span>
              </div>

              {!d.closed && (
                <div className="flex flex-col gap-2 flex-1 min-w-[260px]">
                  {/* Sélecteur de mode : Continu / Matin + Après-midi */}
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
                    <button
                      type="button"
                      onClick={() => set(key, { mode: "continuous" })}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        (d.mode ?? "split") === "continuous"
                          ? "bg-white text-landes-forest shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Journée continue
                    </button>
                    <button
                      type="button"
                      onClick={() => set(key, { mode: "split" })}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        (d.mode ?? "split") === "split"
                          ? "bg-white text-landes-forest shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Matin / Après-midi
                    </button>
                  </div>

                  {/* Champs horaires selon le mode */}
                  {d.mode === "continuous" ? (
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-landes-forest font-medium w-14 flex-shrink-0">Ouvert</span>
                        <TimeSelect value={d.continuousOpen || ""} onChange={v => set(key, { continuousOpen: v })} />
                        <span className="text-gray-300 text-sm">–</span>
                        <TimeSelect value={d.continuousClose || ""} onChange={v => set(key, { continuousClose: v })} />
                      </div>
                      {key === "monday" && (
                        <button
                          type="button"
                          onClick={() => copyWeekdays("monday")}
                          className="text-xs text-landes-forest underline underline-offset-2 hover:text-landes-pine self-center ml-1"
                        >
                          Copier Lu–Ve
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-4">
                      {/* Matin — activable/désactivable indépendamment */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => set(key, { morningEnabled: !(d.morningEnabled ?? true) })}
                          className={`relative w-8 h-4.5 rounded-full transition-colors focus:outline-none flex-shrink-0 ${
                            (d.morningEnabled ?? true) ? "bg-orange-400" : "bg-gray-300"
                          }`}
                          style={{ height: "18px" }}
                          title={(d.morningEnabled ?? true) ? "Désactiver le matin" : "Activer le matin"}
                        >
                          <span className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-all ${
                            (d.morningEnabled ?? true) ? "left-4" : "left-0.5"
                          }`} />
                        </button>
                        <span className={`text-xs font-medium w-10 flex-shrink-0 ${(d.morningEnabled ?? true) ? "text-orange-400" : "text-gray-300"}`}>Matin</span>
                        <TimeSelect value={d.morningOpen || ""} onChange={v => set(key, { morningOpen: v })} disabled={!(d.morningEnabled ?? true)} />
                        <span className="text-gray-300 text-sm">–</span>
                        <TimeSelect value={d.morningClose || ""} onChange={v => set(key, { morningClose: v })} disabled={!(d.morningEnabled ?? true)} />
                      </div>
                      {/* Après-midi — activable/désactivable indépendamment */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => set(key, { afternoonEnabled: !(d.afternoonEnabled ?? true) })}
                          className={`relative w-8 rounded-full transition-colors focus:outline-none flex-shrink-0 ${
                            (d.afternoonEnabled ?? true) ? "bg-blue-400" : "bg-gray-300"
                          }`}
                          style={{ height: "18px" }}
                          title={(d.afternoonEnabled ?? true) ? "Désactiver l'après-midi" : "Activer l'après-midi"}
                        >
                          <span className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-all ${
                            (d.afternoonEnabled ?? true) ? "left-4" : "left-0.5"
                          }`} />
                        </button>
                        <span className={`text-xs font-medium w-12 flex-shrink-0 ${(d.afternoonEnabled ?? true) ? "text-blue-400" : "text-gray-300"}`}>Après-m.</span>
                        <TimeSelect value={d.afternoonOpen || ""} onChange={v => set(key, { afternoonOpen: v })} disabled={!(d.afternoonEnabled ?? true)} />
                        <span className="text-gray-300 text-sm">–</span>
                        <TimeSelect value={d.afternoonClose || ""} onChange={v => set(key, { afternoonClose: v })} disabled={!(d.afternoonEnabled ?? true)} />
                      </div>
                      {key === "monday" && (
                        <button
                          type="button"
                          onClick={() => copyWeekdays("monday")}
                          className="text-xs text-landes-forest underline underline-offset-2 hover:text-landes-pine self-center ml-1"
                        >
                          Copier Lu–Ve
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
