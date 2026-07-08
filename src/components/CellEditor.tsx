import React, { useEffect, useRef, useState } from "react";
import { 
  ColumnDefinition, 
  CellValue, 
  ScheduleValue, 
  ScheduleStatus, 
  DEFAULT_HOURS,
  DAYS
} from "../types.js";
import { Clock, Check, CalendarRange, ChevronDown, X } from "lucide-react";

interface CellEditorProps {
  column: ColumnDefinition;
  value: CellValue;
  onChange: (newValue: CellValue) => void;
}

export default function CellEditor({ column, value, onChange }: CellEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // TYPE 1: TEXT CELL
  if (column.type === "text") {
    const textValue = (value as string) || "";
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    };

    // Auto-adjust height based on content
    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, [textValue]);

    return (
      <div className="w-full min-h-[44px] flex items-center p-2">
        <textarea
          ref={textareaRef}
          value={textValue}
          onChange={handleTextChange}
          placeholder="..."
          rows={1}
          className="w-full bg-transparent text-slate-100 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 rounded px-3 py-2 resize-none overflow-hidden text-sm leading-relaxed whitespace-pre-wrap break-words border border-transparent hover:border-white/5 focus:bg-white/[0.03]"
        />
      </div>
    );
  }

  // TYPE 2: SELECT CELL (CUSTOM COLORED DROPDOWN)
  if (column.type === "select") {
    const selectedOptionId = value as string;
    const options = column.options || [];
    const selectedOption = options.find(opt => opt.id === selectedOptionId);

    return (
      <div ref={containerRef} className="relative w-full min-h-[44px] flex items-center justify-center p-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-1.5 px-3 py-2 rounded-lg border border-white/5 hover:border-white/10 bg-white/5 text-left transition-all duration-150 cursor-pointer"
          style={
            selectedOption
              ? { backgroundColor: `${selectedOption.bgColor}20`, borderColor: selectedOption.bgColor, color: selectedOption.textColor }
              : {}
          }
        >
          {selectedOption ? (
            <span className="text-xs font-semibold tracking-wide flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selectedOption.bgColor }} />
              {selectedOption.text}
            </span>
          ) : (
            <span className="text-xs text-slate-500">Unselected</span>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 min-w-[180px] max-h-60 overflow-y-auto bg-[#0c0c0c] border border-white/10 rounded-xl shadow-2xl p-1.5 animate-in fade-in duration-100">
            {options.length === 0 ? (
              <div className="p-3 text-xs text-slate-500 text-center">No options defined</div>
            ) : (
              <>
                <button
                  onClick={() => {
                    onChange("");
                    setIsOpen(false);
                  }}
                  className="w-full text-left text-xs px-2.5 py-1.5 text-slate-400 hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Clear selection
                </button>
                <div className="h-px bg-white/5 my-1" />
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      onChange(opt.id);
                      setIsOpen(false);
                    }}
                    style={{ backgroundColor: `${opt.bgColor}10`, color: opt.textColor }}
                    className="w-full text-left text-xs font-semibold px-2.5 py-2 hover:bg-white/5 rounded-lg flex items-center justify-between transition-colors mb-0.5 border border-transparent hover:border-white/10 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: opt.bgColor }} />
                      {opt.text}
                    </span>
                    {selectedOptionId === opt.id && (
                      <Check className="w-3.5 h-3.5" style={{ color: opt.textColor }} />
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // TYPE 3: SCHEDULE STATUS-HOUR SELECTOR
  if (column.type === "schedule") {
    // Robust normalization of old flat schedule formats
    const rawValue = value as any;
    const scheduleValue: ScheduleValue = {};

    if (rawValue) {
      const hasTopLevelHours = Object.keys(rawValue).some(key => key.includes('h00'));
      if (hasTopLevelHours) {
        // Migrate old format to "vendredi"
        scheduleValue["vendredi"] = rawValue;
      } else {
        // Copy standard nested structure
        DAYS.forEach(d => {
          if (rawValue[d.id]) {
            scheduleValue[d.id] = { ...rawValue[d.id] };
          }
        });
      }
    }

    const [activeEditorDay, setActiveEditorDay] = useState<'vendredi' | 'samedi' | 'dimanche'>("vendredi");

    const parseCompoundStatus = (rawStatus: string) => {
      if (!rawStatus) return { main: "", rdv: "" };
      if (rawStatus.includes('|')) {
        const [main, rdv] = rawStatus.split('|');
        return { main: main || "", rdv: rdv || "" };
      }
      // Legacy migration
      if (rawStatus === 'rdv_chatelet') return { main: "", rdv: "rdv_chatelet" };
      if (rawStatus === 'rdv_parc_expo') return { main: "", rdv: "rdv_parc_expo" };
      if (rawStatus === 'maybe' || rawStatus === 'yes' || rawStatus === 'Confirmed') {
        return { main: rawStatus, rdv: "" };
      }
      return { main: "", rdv: "" };
    };

    const getStatusStyle = (status: ScheduleStatus) => {
      switch (status) {
        case "yes":
        case "Confirmed":
          return {
            bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
            dot: "bg-emerald-400",
            label: "déjà prévu"
          };
        case "maybe":
          return {
            bg: "bg-amber-500/10 border-amber-500/20 text-amber-400",
            dot: "bg-amber-400",
            label: "dispo"
          };
        case "rdv_chatelet":
          return {
            bg: "bg-sky-500/10 border-sky-500/20 text-sky-400",
            dot: "bg-sky-400",
            label: "rdv Châtelet"
          };
        case "rdv_parc_expo":
          return {
            bg: "bg-pink-500/10 border-pink-500/20 text-pink-400",
            dot: "bg-pink-400",
            label: "rdv Parc Expo"
          };
        default:
          return {
            bg: "bg-white/5 border-white/5 text-slate-500",
            dot: "bg-slate-700",
            label: "-"
          };
      }
    };

    const setHourStatusPart = (dayId: string, hour: string, type: 'main' | 'rdv', valueToToggle: string) => {
      const updated = { ...scheduleValue };
      if (!updated[dayId]) {
        updated[dayId] = {};
      }
      const dayHours = { ...updated[dayId] };
      const rawStatus = dayHours[hour] || "";
      const { main: currentMain, rdv: currentRdv } = parseCompoundStatus(rawStatus);

      let newMain = currentMain;
      let newRdv = currentRdv;

      if (type === 'main') {
        newMain = (currentMain === valueToToggle) ? "" : valueToToggle;
      } else if (type === 'rdv') {
        newRdv = (currentRdv === valueToToggle) ? "" : valueToToggle;
      }

      // Reconstruct combined string
      const combined = `${newMain}|${newRdv}`;
      if (combined === "|") {
        delete dayHours[hour];
      } else {
        dayHours[hour] = combined;
      }
      updated[dayId] = dayHours;
      onChange(updated);
    };

    const handleCopyPreviousDay = () => {
      let prevDayId: string | null = null;
      if (activeEditorDay === 'samedi') prevDayId = 'vendredi';
      else if (activeEditorDay === 'dimanche') prevDayId = 'samedi';

      if (!prevDayId) return;

      const updated = { ...scheduleValue };
      updated[activeEditorDay] = { ...(updated[prevDayId] || {}) };
      onChange(updated);
    };

    return (
      <div ref={containerRef} className="relative w-full min-h-[50px] flex items-center justify-center p-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex flex-col gap-3 p-3.5 rounded-xl border border-white/5 hover:border-white/10 bg-white/5 text-slate-300 transition-colors cursor-pointer text-left"
        >
          <div className="flex flex-col gap-3 w-full">
            {DAYS.map(day => {
              const dayHours = scheduleValue[day.id] || {};
              const filledForDay = DEFAULT_HOURS.filter(h => {
                const status = dayHours[h];
                if (!status) return false;
                const { main, rdv } = parseCompoundStatus(status);
                return main !== "" || rdv !== "";
              });
              return (
                <div key={day.id} className="flex flex-col gap-2 border-b border-white/5 last:border-0 pb-2.5 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{day.label}</span>
                    {filledForDay.length === 0 && (
                      <span className="text-[10px] text-slate-600 font-medium italic">Aucun</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filledForDay.map(hour => {
                      const status = dayHours[hour] || "";
                      const { main, rdv } = parseCompoundStatus(status);
                      const isDispo = main === "maybe";
                      const isDejaPrevu = main === "yes" || main === "Confirmed";
                      const isChatelet = rdv === "rdv_chatelet";
                      const isParcExpo = rdv === "rdv_parc_expo";
                      return (
                        <div
                          key={hour}
                          className="bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 flex flex-col items-center justify-center text-center min-w-[100px] hover:border-white/20 transition-all shadow-sm"
                        >
                          <span className="font-mono text-base font-black text-white">{hour}</span>
                          {isDispo && (
                            <span className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5 mt-0.5">
                              ✓ <span className="text-[9px] font-medium text-amber-300">dispo</span>
                            </span>
                          )}
                          {isDejaPrevu && (
                            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5 mt-0.5">
                              ✓ <span className="text-[9px] font-semibold text-emerald-300">déjà prévu</span>
                            </span>
                          )}
                          {isChatelet && (
                            <span className="text-[10px] font-bold text-sky-400 flex items-center gap-0.5 mt-0.5">
                              ✓ <span className="text-[9px] font-semibold text-sky-300">rdv Châtelet</span>
                            </span>
                          )}
                          {isParcExpo && (
                            <span className="text-[10px] font-bold text-pink-400 flex items-center gap-0.5 mt-0.5">
                              ✓ <span className="text-[9px] font-semibold text-pink-300">rdv Parc Expo</span>
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </button>

        {isOpen && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 z-50 w-[380px] bg-[#0c0c0c] border border-white/10 rounded-xl shadow-2xl p-4 animate-in fade-in duration-150">
            {/* Popover Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-200">Set Availability</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-slate-300 hover:bg-white/5 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Parent selector for days */}
            <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-white/5 mb-3">
              {DAYS.map(day => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => setActiveEditorDay(day.id)}
                  className={`flex-1 text-[10px] font-bold py-1.5 px-2 rounded-md transition-all cursor-pointer ${
                    activeEditorDay === day.id
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {day.label.split(' ')[0]}
                </button>
              ))}
            </div>

            {(activeEditorDay === 'samedi' || activeEditorDay === 'dimanche') && (
              <button
                type="button"
                onClick={handleCopyPreviousDay}
                className="w-full mb-3 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 text-[10px] font-bold rounded-lg border border-indigo-500/20 hover:border-indigo-500/30 transition-all cursor-pointer"
              >
                📋 Copier le jour précédent ({activeEditorDay === 'samedi' ? 'Vendredi' : 'Samedi'})
              </button>
            )}

            {/* Hours list for active day */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {DEFAULT_HOURS.map((hour) => {
                const currentStatus = (scheduleValue[activeEditorDay] || {})[hour] || "";
                const { main, rdv } = parseCompoundStatus(currentStatus);
                return (
                  <div key={hour} className="flex flex-col gap-1.5 py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-300">{hour}</span>
                      <div className="flex items-center gap-1">
                        {main && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${getStatusStyle(main).bg}`}>
                            {getStatusStyle(main).label}
                          </span>
                        )}
                        {rdv && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${getStatusStyle(rdv).bg}`}>
                            {getStatusStyle(rdv).label}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                      {/* DISPO */}
                      <button
                        onClick={() => setHourStatusPart(activeEditorDay, hour, 'main', 'maybe')}
                        className={`text-[9px] font-bold py-1 rounded transition-all cursor-pointer text-center ${
                          main === "maybe"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "text-slate-500 hover:text-slate-400 hover:bg-white/5"
                        }`}
                      >
                        dispo
                      </button>

                      {/* DEJA PREVU */}
                      <button
                        onClick={() => setHourStatusPart(activeEditorDay, hour, 'main', 'yes')}
                        className={`text-[9px] font-bold py-1 rounded transition-all cursor-pointer text-center ${
                          main === "yes" || main === "Confirmed"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "text-slate-500 hover:text-slate-400 hover:bg-white/5"
                        }`}
                      >
                        déjà prévu
                      </button>

                      {/* RDV CHATELET */}
                      <button
                        onClick={() => setHourStatusPart(activeEditorDay, hour, 'rdv', 'rdv_chatelet')}
                        className={`text-[9px] font-bold py-1 rounded transition-all cursor-pointer text-center ${
                          rdv === "rdv_chatelet"
                            ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                            : "text-slate-500 hover:text-slate-400 hover:bg-white/5"
                        }`}
                      >
                        Châtelet
                      </button>

                      {/* RDV PARC EXPO */}
                      <button
                        onClick={() => setHourStatusPart(activeEditorDay, hour, 'rdv', 'rdv_parc_expo')}
                        className={`text-[9px] font-bold py-1 rounded transition-all cursor-pointer text-center ${
                          rdv === "rdv_parc_expo"
                            ? "bg-pink-500/20 text-pink-300 border border-pink-500/30"
                            : "text-slate-500 hover:text-slate-400 hover:bg-white/5"
                        }`}
                      >
                        Parc Expo
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-1.5 border-t border-white/5 pt-3 mt-3">
              <button
                onClick={() => {
                  onChange({});
                  setIsOpen(false);
                }}
                className="px-2.5 py-1.5 text-[10px] font-bold text-rose-400 hover:bg-rose-500/10 rounded transition-all cursor-pointer"
              >
                Clear All
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-3.5 py-1.5 text-[10px] font-bold bg-indigo-600 text-white hover:bg-indigo-500 rounded-lg transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
