import { useState, useEffect, useCallback } from "react";

/* ─── Types ─────────────────────────────────────────────── */
interface Timeslot {
  start_time: string; // "YYYY-MM-DD HH:mm:ss"
  end_time: string;
}

interface BookingTexts {
  stepDateTitle?: string;
  stepTimeTitle?: string;
  stepFormTitle?: string;
  prevMonth?: string;
  nextMonth?: string;
  noSlots?: string;
  labelName?: string;
  labelPhone?: string;
  labelNotes?: string;
  placeholderName?: string;
  placeholderPhone?: string;
  placeholderNotes?: string;
  btnBack?: string;
  btnModifyTime?: string;
  btnSubmit?: string;
  btnSubmitting?: string;
  reviewDate?: string;
  reviewStart?: string;
  reviewEnd?: string;
  successMsg?: string;
  errorMsg?: string;
  requiredField?: string;
  loading?: string;
}

interface BookingCalendarProps {
  timeslotsApi: string;
  appointmentsApi: string;
  texts?: BookingTexts;
  containerStyle?: React.CSSProperties;
}

/* ─── Helpers ────────────────────────────────────────────── */
const DAY_ABBR = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function extractDate(dt: string): string {
  return dt.split(" ")[0];
}

function extractTime(dt: string): string {
  const parts = dt.split(" ");
  if (parts.length < 2) return "";
  return parts[1].slice(0, 5);
}

function todayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildCalendarGrid(year: number, month: number): (string | null)[][] {
  // month is 0-indexed
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    cells.push(`${year}-${mm}-${dd}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

/* ─── Sub-components ─────────────────────────────────────── */

interface CalendarGridProps {
  year: number;
  month: number;
  availableDates: Set<string>;
  selectedDate: string | null;
  onSelectDate: (d: string) => void;
  onPrev: () => void;
  onNext: () => void;
  texts: BookingTexts;
}

function CalendarGrid({
  year, month, availableDates, selectedDate, onSelectDate, onPrev, onNext, texts,
}: CalendarGridProps) {
  const rows = buildCalendarGrid(year, month);
  const today = todayStr();

  return (
    <div className="w-full">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onPrev}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors cursor-pointer text-stone-600"
          aria-label={texts.prevMonth || "Mes anterior"}
        >
          <i className="ri-arrow-left-s-line text-lg"></i>
        </button>
        <span className="text-sm font-semibold text-stone-800">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={onNext}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors cursor-pointer text-stone-600"
          aria-label={texts.nextMonth || "Mes siguiente"}
        >
          <i className="ri-arrow-right-s-line text-lg"></i>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_ABBR.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-stone-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Rows */}
      {rows.map((row, ri) => (
        <div key={ri} className="grid grid-cols-7">
          {row.map((dateStr, ci) => {
            if (!dateStr) {
              return <div key={ci} className="h-10" />;
            }
            const isAvailable = availableDates.has(dateStr);
            const isSelected = dateStr === selectedDate;
            const isPast = dateStr < today;
            const isToday = dateStr === today;

            let cellClass =
              "h-10 flex flex-col items-center justify-center rounded-lg text-xs transition-all ";

            if (isSelected) {
              cellClass += "bg-amber-600 text-white font-bold cursor-pointer";
            } else if (isAvailable && !isPast) {
              cellClass +=
                "bg-amber-50 text-amber-800 font-semibold hover:bg-amber-100 cursor-pointer border border-amber-200";
            } else {
              cellClass += "text-stone-300 cursor-not-allowed";
            }

            const dayNum = dateStr.split("-")[2];

            return (
              <div
                key={ci}
                className={cellClass}
                onClick={() => isAvailable && !isPast && onSelectDate(dateStr)}
              >
                <span>{dayNum}</span>
                {isToday && !isSelected && (
                  <span className="w-1 h-1 rounded-full bg-amber-500 mt-0.5"></span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
export function BookingCalendar({
  timeslotsApi,
  appointmentsApi,
  texts = {},
  containerStyle,
}: BookingCalendarProps) {
  const t: BookingTexts = {
    stepDateTitle: "Selecciona una fecha",
    stepTimeTitle: "Selecciona un horario",
    stepFormTitle: "Confirma tu reserva",
    prevMonth: "Mes anterior",
    nextMonth: "Mes siguiente",
    noSlots: "No hay horarios disponibles para esta fecha.",
    labelName: "Nombre completo",
    labelPhone: "Teléfono",
    labelNotes: "Notas adicionales",
    placeholderName: "Tu nombre completo",
    placeholderPhone: "+34 600 000 000",
    placeholderNotes: "Cualquier información adicional...",
    btnBack: "Volver",
    btnModifyTime: "Modificar horario",
    btnSubmit: "Confirmar reserva",
    btnSubmitting: "Enviando...",
    reviewDate: "Fecha",
    reviewStart: "Hora inicio",
    reviewEnd: "Hora fin",
    successMsg: "¡Reserva confirmada! Te contactaremos pronto.",
    errorMsg: "Error al enviar la reserva. Inténtalo de nuevo.",
    requiredField: "Este campo es obligatorio",
    loading: "Cargando disponibilidad...",
    ...texts,
  };

  /* ── State ── */
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);

  const [calYear, setCalYear] = useState<number>(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState<number>(new Date().getMonth());

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Timeslot | null>(null);

  const [currentStep, setCurrentStep] = useState<0 | 1 | 2>(0);

  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  /* ── Fetch timeslots ── */
  const fetchTimeslots = useCallback(async () => {
    setLoadingSlots(true);
    try {
      const res = await fetch(timeslotsApi);
      const data = await res.json();
      const slots: Timeslot[] = Array.isArray(data) ? data : (data.data ?? data.timeslots ?? []);
      setTimeslots(slots);
      return slots;
    } catch {
      setTimeslots([]);
      return [] as Timeslot[];
    } finally {
      setLoadingSlots(false);
    }
  }, [timeslotsApi]);

  /* ── Init: fetch + auto-select closest date ── */
  useEffect(() => {
    fetchTimeslots().then((slots) => {
      if (!slots.length) return;
      const today = todayStr();
      const dates = slots.map((s) => extractDate(s.start_time)).sort();
      const future = dates.filter((d) => d >= today);
      const target = future.length ? future[0] : dates[dates.length - 1];
      const [y, m] = target.split("-").map(Number);
      setCalYear(y);
      setCalMonth(m - 1);
      setSelectedDate(target);
    });
  }, [fetchTimeslots]);

  /* ── Derived ── */
  const availableDates = new Set(
    timeslots.map((s) => extractDate(s.start_time))
  );

  const slotsForDate = selectedDate
    ? timeslots.filter((s) => extractDate(s.start_time) === selectedDate)
    : [];

  /* ── Calendar nav ── */
  const handlePrevMonth = () => {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
  };
  const handleNextMonth = () => {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
  };

  /* ── Step 0: select date ── */
  const handleSelectDate = (d: string) => {
    setSelectedDate(d);
    setSelectedSlot(null);
    setCurrentStep(1);
  };

  /* ── Step 1: select slot ── */
  const handleSelectSlot = (slot: Timeslot) => {
    setSelectedSlot(slot);
    setCurrentStep(2);
  };

  /* ── Step 2: back to step 1 without clearing form ── */
  const handleModifyTime = () => {
    setCurrentStep(1);
  };

  /* ── Validate ── */
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formName.trim()) errs.name = t.requiredField!;
    if (!formPhone.trim()) errs.phone = t.requiredField!;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !selectedSlot) return;
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const body: Record<string, string> = {
        customer_name: formName.trim(),
        customer_phone: formPhone.trim(),
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        notes: formNotes.trim(),
      };
      const res = await fetch(appointmentsApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("error");
      setSuccessMsg(t.successMsg!);
      // Reset booking state, keep form cleared
      setFormName("");
      setFormPhone("");
      setFormNotes("");
      setSelectedDate(null);
      setSelectedSlot(null);
      setCurrentStep(0);
      // Re-fetch to update availability
      const fresh = await fetchTimeslots();
      if (fresh.length) {
        const today = todayStr();
        const dates = fresh.map((s) => extractDate(s.start_time)).sort();
        const future = dates.filter((d) => d >= today);
        const target = future.length ? future[0] : dates[dates.length - 1];
        const [y, m] = target.split("-").map(Number);
        setCalYear(y);
        setCalMonth(m - 1);
        setSelectedDate(target);
      }
    } catch {
      setErrorMsg(t.errorMsg!);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Render ── */
  return (
    <div
      className="w-full bg-white rounded-2xl border border-stone-100 overflow-hidden"
      style={containerStyle}
    >
      {/* Step indicator */}
      <div className="flex items-center border-b border-stone-100 px-6 py-4 gap-2">
        {[0, 1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold transition-all ${
                currentStep === s
                  ? "bg-amber-600 text-white"
                  : currentStep > s
                  ? "bg-emerald-500 text-white"
                  : "bg-stone-100 text-stone-400"
              }`}
            >
              {currentStep > s ? <i className="ri-check-line text-xs"></i> : s + 1}
            </div>
            <span
              className={`text-xs font-medium hidden sm:inline ${
                currentStep === s ? "text-stone-800" : "text-stone-400"
              }`}
            >
              {s === 0 ? t.stepDateTitle : s === 1 ? t.stepTimeTitle : t.stepFormTitle}
            </span>
            {s < 2 && <div className="w-6 h-px bg-stone-200 mx-1 hidden sm:block"></div>}
          </div>
        ))}
      </div>

      <div className="p-6">
        {/* Success message */}
        {successMsg && (
          <div className="mb-4 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <i className="ri-checkbox-circle-line text-emerald-600 text-lg"></i>
            <span className="text-emerald-700 text-sm font-medium">{successMsg}</span>
          </div>
        )}

        {/* ── STEP 0: Calendar ── */}
        {currentStep === 0 && (
          <div>
            <h3 className="text-sm font-semibold text-stone-700 mb-4">{t.stepDateTitle}</h3>
            {loadingSlots ? (
              <div className="flex items-center justify-center py-12 gap-2 text-stone-400">
                <i className="ri-loader-4-line animate-spin text-xl"></i>
                <span className="text-sm">{t.loading}</span>
              </div>
            ) : (
              <CalendarGrid
                year={calYear}
                month={calMonth}
                availableDates={availableDates}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
                onPrev={handlePrevMonth}
                onNext={handleNextMonth}
                texts={t}
              />
            )}
          </div>
        )}

        {/* ── STEP 1: Time slots ── */}
        {currentStep === 1 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setCurrentStep(0)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors cursor-pointer text-stone-500"
              >
                <i className="ri-arrow-left-line text-sm"></i>
              </button>
              <h3 className="text-sm font-semibold text-stone-700">{t.stepTimeTitle}</h3>
            </div>
            {selectedDate && (
              <p className="text-xs text-stone-500 mb-4 flex items-center gap-1.5">
                <i className="ri-calendar-line text-amber-600"></i>
                {selectedDate}
              </p>
            )}
            {slotsForDate.length === 0 ? (
              <p className="text-sm text-stone-400 py-6 text-center">{t.noSlots}</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {slotsForDate.map((slot, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectSlot(slot)}
                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-400 transition-all cursor-pointer group"
                  >
                    <span className="text-sm font-bold text-amber-800 group-hover:text-amber-900">
                      {extractTime(slot.start_time)}
                    </span>
                    <span className="text-xs text-amber-600 mt-0.5">
                      → {extractTime(slot.end_time)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Review + Form ── */}
        {currentStep === 2 && selectedSlot && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setCurrentStep(0)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors cursor-pointer text-stone-500"
              >
                <i className="ri-arrow-left-line text-sm"></i>
              </button>
              <h3 className="text-sm font-semibold text-stone-700">{t.stepFormTitle}</h3>
            </div>

            {/* Review block */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
                  Tu reserva
                </p>
                <button
                  onClick={handleModifyTime}
                  className="text-xs text-amber-700 hover:text-amber-900 underline cursor-pointer transition-colors whitespace-nowrap"
                >
                  {t.btnModifyTime}
                </button>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-amber-700">{t.reviewDate}</span>
                  <span className="text-xs font-semibold text-amber-900">
                    {extractDate(selectedSlot.start_time)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-amber-700">{t.reviewStart}</span>
                  <span className="text-xs font-semibold text-amber-900">
                    {extractTime(selectedSlot.start_time)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-amber-700">{t.reviewEnd}</span>
                  <span className="text-xs font-semibold text-amber-900">
                    {extractTime(selectedSlot.end_time)}
                  </span>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  {t.labelName} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => { setFormName(e.target.value); setErrors((prev) => ({ ...prev, name: "" })); }}
                  placeholder={t.placeholderName}
                  className={`w-full border rounded-lg px-3 py-2 text-sm text-stone-800 placeholder-stone-400 outline-none transition-colors ${
                    errors.name ? "border-red-400 bg-red-50" : "border-stone-200 focus:border-amber-400 bg-white"
                  }`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  {t.labelPhone} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => { setFormPhone(e.target.value); setErrors((prev) => ({ ...prev, phone: "" })); }}
                  placeholder={t.placeholderPhone}
                  className={`w-full border rounded-lg px-3 py-2 text-sm text-stone-800 placeholder-stone-400 outline-none transition-colors ${
                    errors.phone ? "border-red-400 bg-red-50" : "border-stone-200 focus:border-amber-400 bg-white"
                  }`}
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  {t.labelNotes}
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder={t.placeholderNotes}
                  rows={3}
                  maxLength={500}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 placeholder-stone-400 outline-none focus:border-amber-400 transition-colors resize-none bg-white"
                />
                <p className="text-xs text-stone-400 text-right mt-0.5">{formNotes.length}/500</p>
              </div>

              {/* Error */}
              {errorMsg && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <i className="ri-error-warning-line text-red-500 text-sm"></i>
                  <span className="text-xs text-red-600">{errorMsg}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><i className="ri-loader-4-line animate-spin"></i> {t.btnSubmitting}</>
                ) : (
                  <><i className="ri-calendar-check-line"></i> {t.btnSubmit}</>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingCalendar;
