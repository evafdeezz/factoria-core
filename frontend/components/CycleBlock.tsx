"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCycleStatus, registerPeriod, CycleStatusDto } from "@/lib/menstrualCycle";

interface Props {
  athleteId: number;
}

// Estilos principales según la fase del ciclo.
const PHASE_COLORS: Record<string, string> = {
  MENSTRUAL: "border-red-700 bg-red-950/30",
  FOLLICULAR: "border-yellow-600 bg-yellow-950/20",
  OVULATORY: "border-emerald-600 bg-emerald-950/20",
  LUTEAL: "border-sky-700 bg-sky-950/20",
  LATE: "border-orange-600 bg-orange-950/20",
};

// Estilos de la etiqueta pequeña que muestra la fase actual.
const PHASE_BADGE: Record<string, string> = {
  MENSTRUAL: "bg-red-900/60 text-red-200",
  FOLLICULAR: "bg-yellow-900/60 text-yellow-200",
  OVULATORY: "bg-emerald-900/60 text-emerald-200",
  LUTEAL: "bg-sky-900/60 text-sky-200",
  LATE: "bg-orange-900/60 text-orange-200",
};

// Formatea una fecha como yyyy-MM-dd usando la fecha local del navegador.
function toLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Convierte una fecha yyyy-MM-dd en un objeto Date local.
function parseLocalDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Devuelve la fecha de hoy en el mismo formato que usa el input date.
function todayLocalDate() {
  return toLocalDateString(new Date());
}

export default function CycleBlock({ athleteId }: Props) {
  const router = useRouter();

  const [status, setStatus] = useState<CycleStatusDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayLocalDate());
  const [registering, setRegistering] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Carga el estado actual del ciclo desde el backend.
  async function load() {
    try {
      const data = await getCycleStatus(athleteId);
      setStatus(data);
    } catch {
      // Si falla por permisos, red o falta de datos, ocultamos el bloque.
    } finally {
      setLoading(false);
    }
  }

  // Recarga la información cuando cambia el atleta.
  useEffect(() => {
    void load();
  }, [athleteId]);

  // Abre el modal dejando seleccionada por defecto la fecha de hoy.
  function openRegisterModal() {
    setSelectedDate(todayLocalDate());
    setShowModal(true);
  }

  // Registra un nuevo período y actualiza el bloque con la información recalculada.
  async function handleRegister() {
    setRegistering(true);

    try {
      const result = await registerPeriod(athleteId, selectedDate);

      setRegisterSuccess(true);
      setShowModal(false);

      await load();

      setTimeout(() => setRegisterSuccess(false), 3000);

      router.push(`/athlete/menstrual/${result.cycleId}`);
    } catch {
      // Si algo falla, el modal permite que la usuaria pueda intentarlo de nuevo.
    } finally {
      setRegistering(false);
    }
  }

  if (loading || !status) return null;

  // Si el período está retrasado, se usa un estado visual específico.
  const phaseKey = status.isLate ? "LATE" : status.phase ?? "LUTEAL";
  const color = PHASE_COLORS[phaseKey] ?? "border-slate-700 bg-slate-900/40";
  const badge = PHASE_BADGE[phaseKey] ?? "bg-slate-800 text-slate-200";

  // Calcula el avance del ciclo para la barra de progreso.
  const progress = status.isLate
    ? 100
    : Math.round((status.cycleDay / status.totalCycleLength) * 100);

  return (
    <>
      <div className={`border rounded-2xl p-4 space-y-3 ${color}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{status.emoji}</span>

            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                Ciclo menstrual
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                {status.isLate ? (
                  <p className="text-sm font-semibold text-orange-300">
                    Día {status.cycleDay} desde tu último período
                  </p>
                ) : (
                  <p className="text-sm font-semibold text-slate-50">
                    Día {status.cycleDay} de {status.totalCycleLength}
                  </p>
                )}

                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badge}`}>
                  {status.phaseLabel}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openRegisterModal}
            className="text-[10px] text-slate-400 hover:text-sky-300 border border-slate-700 hover:border-sky-600 rounded-lg px-2 py-1 transition flex-shrink-0"
          >
            {status.isLate ? "¡Me ha bajado!" : "Registrar período"}
          </button>
        </div>

        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              status.isLate
                ? "bg-orange-500 animate-pulse"
                : "bg-gradient-to-r from-sky-500 to-sky-400"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {status.summary}
        </p>

        {!status.isLate && (
          <>
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="text-[11px] text-sky-400 hover:text-sky-300 font-medium"
            >
              {expanded ? "▲ Ocultar consejo de entrenamiento" : "▼ Ver consejo de entrenamiento"}
            </button>

            {expanded && (
              <div className="space-y-2">
                <div className="bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2">
                  <p className="text-[10px] text-sky-300 font-semibold uppercase tracking-wider mb-1">
                    🏃 Para tu entrenamiento hoy
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {status.training}
                  </p>
                </div>

                {status.warning && (
                  <div className="bg-amber-950/30 border border-amber-700/50 rounded-xl px-3 py-2">
                    <p className="text-xs text-amber-300 leading-relaxed">
                      {status.warning}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {status.isLate && (
          <div className="bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2">
            <p className="text-[10px] text-orange-300 font-semibold uppercase tracking-wider mb-1">
              Consejo para hoy
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              {status.training}
            </p>
          </div>
        )}

        {registerSuccess && (
          <p className="text-[11px] text-emerald-300 bg-emerald-900/30 border border-emerald-700 rounded-lg px-3 py-1.5">
            Período registrado correctamente ✓
          </p>
        )}

        <div className="flex items-center gap-4 pt-1">
          {status.cycleId && (
            <button
              type="button"
              onClick={() => router.push(`/athlete/menstrual/${status.cycleId}`)}
              className="text-[11px] text-sky-400 hover:text-sky-300 underline"
            >
              Ver diario de este ciclo →
            </button>
          )}

          <button
            type="button"
            onClick={() => router.push("/athlete/menstrual")}
            className="text-[11px] text-slate-400 hover:text-slate-200 underline"
          >
            Calendario menstrual →
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <div>
              <h2 className="text-base font-semibold text-slate-50">
                Registrar inicio de período
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                Indica cuándo empezó. Esto actualizará tu ciclo y los consejos del panel.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-300">
                Fecha de inicio
              </label>

              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                max={todayLocalDate()}
                className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100 [color-scheme:dark]"
              />

              {selectedDate && (
                <p className="text-[10px] text-slate-500">
                  {parseLocalDate(selectedDate).toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 border border-slate-700 rounded-lg py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleRegister}
                disabled={registering || !selectedDate}
                className="flex-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-60"
              >
                {registering ? "Guardando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}