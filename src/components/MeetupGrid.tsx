import { useState } from "react";
import { 
  BoardState, 
  ColumnDefinition, 
  RowData, 
  DAYS, 
  CellValue,
  ColumnType,
  ScheduleValue,
  DEFAULT_HOURS
} from "../types.js";
import { 
  Plus, 
  Copy, 
  Trash2, 
  Settings, 
  Lock, 
  Unlock, 
  Sparkles, 
  Calendar, 
  UserPlus, 
  Info,
  Layers,
  Sparkle
} from "lucide-react";
import CellEditor from "./CellEditor.js";
import ColumnConfigModal from "./ColumnConfigModal.js";

interface MeetupGridProps {
  board: BoardState;
  onUpdateBoard: (updatedBoard: BoardState) => void;
}

export default function MeetupGrid({ board, onUpdateBoard }: MeetupGridProps) {
  const [isColModalOpen, setIsColModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<ColumnDefinition | undefined>(undefined);
  const [inlineEditingColId, setInlineEditingColId] = useState<string | null>(null);
  const [inlineEditingVal, setInlineEditingVal] = useState<string>("");

  // Display all rows directly since we removed tab filtering
  const filteredRows = board.rows;

  const getCoincidences = (row: RowData, filterType: 'interested' | 'confirmed') => {
    const scheduleColumn = board.columns.find(col => col.type === "schedule");
    if (!scheduleColumn) return [];

    const statusColumn = board.columns.find(col => col.id === "status");
    const targetOptionIds = statusColumn?.options?.filter(opt => {
      const text = opt.text.toLowerCase();
      if (filterType === 'confirmed') {
        return text.includes("confirm") || text.includes("ok") || opt.id === "opt-1";
      } else {
        return text.includes("interest") || text.includes("disponible") || text.includes("maybe") || opt.id === "opt-2";
      }
    }).map(opt => opt.id) || (filterType === 'confirmed' ? ["opt-1"] : ["opt-2"]);

    const mySchedule = (row.cells[scheduleColumn.id] || {}) as ScheduleValue;

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

    const getActiveSlots = (sched: ScheduleValue) => {
      const slots: string[] = [];
      DAYS.forEach(day => {
        const dayHours = sched[day.id] || {};
        DEFAULT_HOURS.forEach(hour => {
          const raw = dayHours[hour];
          if (raw) {
            const { main, rdv } = parseCompoundStatus(raw);
            if (main !== "" || rdv !== "") {
              slots.push(`${day.id}_${hour}`);
            }
          }
        });
      });
      return slots;
    };

    const mySlots = getActiveSlots(mySchedule);
    if (mySlots.length === 0) return [];

    const results: Array<{ 
      name: string; 
      columnName: string;
      dayHoursText: string;
      statusLabel: string;
      isInterested: boolean;
      isPerfect: boolean;
    }> = [];

    board.rows.forEach(otherRow => {
      if (otherRow.id === row.id) return;

      const otherStatus = otherRow.cells["status"] as string;
      if (!targetOptionIds.includes(otherStatus)) return;

      const otherSchedule = (otherRow.cells[scheduleColumn.id] || {}) as ScheduleValue;
      const otherSlots = getActiveSlots(otherSchedule);
      if (otherSlots.length === 0) return;

      const overlapSlots = mySlots.filter(s => otherSlots.includes(s));
      if (overlapSlots.length === 0) return;

      const overlapByDay: { [dayLabel: string]: string[] } = {};
      DAYS.forEach(day => {
        const myDayHours = mySchedule[day.id] || {};
        const otherDayHours = otherSchedule[day.id] || {};

        DEFAULT_HOURS.forEach(hour => {
          const myRaw = myDayHours[hour];
          const otherRaw = otherDayHours[hour];
          if (myRaw && otherRaw) {
            const myParsed = parseCompoundStatus(myRaw);
            const otherParsed = parseCompoundStatus(otherRaw);

            const hasMyContent = myParsed.main !== "" || myParsed.rdv !== "";
            const hasOtherContent = otherParsed.main !== "" || otherParsed.rdv !== "";

            if (hasMyContent && hasOtherContent) {
              if (!overlapByDay[day.label]) {
                overlapByDay[day.label] = [];
              }

              const formatStatObj = (parsed: { main: string, rdv: string }) => {
                const labels: string[] = [];
                if (parsed.main === 'maybe') labels.push('dispo');
                else if (parsed.main === 'yes' || parsed.main === 'Confirmed') labels.push('déjà prévu');
                
                if (parsed.rdv === 'rdv_chatelet') labels.push('rdv Châtelet');
                else if (parsed.rdv === 'rdv_parc_expo') labels.push('rdv Parc Expo');
                
                return labels.join(' + ') || '-';
              };

              const myStatFormatted = formatStatObj(myParsed);
              const otherStatFormatted = formatStatObj(otherParsed);

              const matchText = myStatFormatted === otherStatFormatted 
                ? `${hour} (${myStatFormatted})`
                : `${hour} (${myStatFormatted} / ${otherStatFormatted})`;

              overlapByDay[day.label].push(matchText);
            }
          }
        });
      });

      const dayHoursParts = Object.entries(overlapByDay).map(([dayLabel, hours]) => {
        const shortDay = dayLabel.split(' ')[0];
        return `${shortDay}: ${hours.join(", ")}`;
      });
      const dayHoursText = dayHoursParts.join(" | ");

      const isPerfectMatch = mySlots.length === otherSlots.length && mySlots.every(s => otherSlots.includes(s));

      const otherStatusText = (statusColumn?.options?.find(opt => opt.id === otherStatus)?.text || "").toLowerCase();
      const isOtherInterested = otherStatus === "opt-2" || otherStatusText.includes("interest") || otherStatusText.includes("disponible") || otherStatusText.includes("maybe");

      let statusLabel = "status: confirmed";
      if (isOtherInterested) {
        statusLabel = "status: not sure (interessé disponible)";
      } else if (isPerfectMatch) {
        statusLabel = "Sure 100% faisable";
      }

      results.push({
        name: (otherRow.cells["participant"] as string) || "Anonymous",
        columnName: scheduleColumn.name || "Rdv Châtelet",
        dayHoursText,
        statusLabel,
        isInterested: isOtherInterested,
        isPerfect: isPerfectMatch
      });
    });

    return results;
  };

  // Column helpers
  const handleSaveColumn = (col: ColumnDefinition) => {
    const existingColIndex = board.columns.findIndex(c => c.id === col.id);
    let updatedCols = [...board.columns];

    if (existingColIndex > -1) {
      updatedCols[existingColIndex] = col;
    } else {
      updatedCols.push(col);
    }

    // Ensure all rows have a key for this column
    const updatedRows = board.rows.map(row => {
      if (row.cells[col.id] === undefined) {
        return {
          ...row,
          cells: {
            ...row.cells,
            [col.id]: col.type === "schedule" ? {} : ""
          }
        };
      }
      return row;
    });

    onUpdateBoard({
      ...board,
      columns: updatedCols,
      rows: updatedRows
    });
  };

  const handleDeleteColumn = (colId: string) => {
    if (colId === "participant") return; // cannot delete default column

    const updatedCols = board.columns.filter(c => c.id !== colId);
    
    // Clean up cells for the deleted column from all rows
    const updatedRows = board.rows.map(row => {
      const updatedCells = { ...row.cells };
      delete updatedCells[colId];
      return {
        ...row,
        cells: updatedCells
      };
    });

    onUpdateBoard({
      ...board,
      columns: updatedCols,
      rows: updatedRows
    });
  };

  // Row helpers
  const handleAppendRow = () => {
    const newRowId = `row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    
    // Initialize empty values for all defined columns
    const initialCells: { [colId: string]: CellValue } = {};
    board.columns.forEach(col => {
      initialCells[col.id] = col.type === "schedule" ? {} : "";
    });

    const newRow: RowData = {
      id: newRowId,
      dayId: "vendredi",
      cells: initialCells
    };

    onUpdateBoard({
      ...board,
      rows: [...board.rows, newRow]
    });
  };

  const handleDuplicateRow = (sourceRow: RowData, indexInFiltered: number) => {
    const newRowId = `row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    
    // Deep copy cell values
    const duplicatedCells: { [colId: string]: CellValue } = {};
    board.columns.forEach(col => {
      const originalValue = sourceRow.cells[col.id];
      if (col.type === "schedule") {
        duplicatedCells[col.id] = originalValue ? { ...(originalValue as object) } : {};
      } else {
        duplicatedCells[col.id] = originalValue !== undefined ? originalValue : "";
      }
    });

    const duplicatedRow: RowData = {
      id: newRowId,
      dayId: sourceRow.dayId,
      cells: duplicatedCells
    };

    // We find the index in the master rows array to insert it right after the source row
    const masterIndex = board.rows.findIndex(r => r.id === sourceRow.id);
    const updatedRows = [...board.rows];
    
    if (masterIndex > -1) {
      updatedRows.splice(masterIndex + 1, 0, duplicatedRow);
    } else {
      updatedRows.push(duplicatedRow);
    }

    onUpdateBoard({
      ...board,
      rows: updatedRows
    });
  };

  const handleDeleteRow = (rowId: string) => {
    const updatedRows = board.rows.filter(r => r.id !== rowId);
    onUpdateBoard({
      ...board,
      rows: updatedRows
    });
  };

  const handleCellChange = (rowId: string, colId: string, newValue: CellValue) => {
    const updatedRows = board.rows.map(row => {
      if (row.id === rowId) {
        return {
          ...row,
          cells: {
            ...row.cells,
            [colId]: newValue
          }
        };
      }
      return row;
    });

    onUpdateBoard({
      ...board,
      rows: updatedRows
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden w-full">
      
      {/* 2. Main content area for grid */}
      <main className="flex-1 bg-[#050505] overflow-y-auto flex flex-col relative min-w-0">
        
        {/* Table Content Padding */}
        <div className="flex-1 p-6 space-y-6">
          
          {/* Internal Title bar with controls */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex-1 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  value={board.name}
                  onChange={(e) => onUpdateBoard({ ...board, name: e.target.value })}
                  placeholder="Meetup Organizer Name"
                  className="text-xl font-bold text-slate-100 bg-transparent border-b border-transparent hover:border-white/10 focus:border-indigo-500 focus:outline-none transition-all py-0.5 w-full sm:w-[320px] md:w-[420px]"
                />
                <span className="text-xs font-semibold text-slate-500 font-mono bg-[#0c0c0c] border border-white/5 px-2 py-0.5 rounded shrink-0">
                  {filteredRows.length} registered
                </span>
              </div>
              <textarea
                value={board.description || ""}
                onChange={(e) => onUpdateBoard({ ...board, description: e.target.value })}
                placeholder="Add a meetup description or notes here... (Click to edit before deploy)"
                className="text-xs text-slate-400 bg-transparent border-b border-transparent hover:border-white/10 focus:border-indigo-500 focus:outline-none transition-all py-1 w-full mt-1.5 resize-none h-10 scrollbar-none"
                rows={2}
              />
            </div>

            {/* Quick Append Row triggers */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAppendRow}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-600/20 transition-all cursor-pointer hover:scale-102"
              >
                <UserPlus className="w-3.5 h-3.5" />
                S'ajouter
              </button>
            </div>
          </div>

          {/* Grid spreadsheet */}
          <div className="overflow-x-auto border border-white/5 rounded-xl bg-black/20 shadow-2xl backdrop-blur-md">
            <table className="w-full border-collapse text-left select-none table-fixed min-w-[800px]">
              <thead>
                <tr className="bg-black/60 border-b border-white/5">
                  {board.columns.map((col, index) => {
                    // Sizing rules: text cell types get more room, schedules are wide, names are standard
                    let widthClass = "w-[240px]";
                    if (col.id === "participant") widthClass = "w-[200px]";
                    else if (col.type === "text") widthClass = "w-[340px]";
                    else if (col.type === "schedule") widthClass = "w-[440px]";

                    return (
                      <th 
                        key={col.id} 
                        className={`${widthClass} px-5 py-4 border-r border-white/5 last:border-0 text-slate-400 text-[10px] font-bold uppercase tracking-widest bg-black/20`}
                      >
                        <div className="flex items-center justify-between group">
                          {inlineEditingColId === col.id ? (
                            <input
                              type="text"
                              value={inlineEditingVal}
                              onChange={(e) => setInlineEditingVal(e.target.value)}
                              onBlur={() => {
                                if (inlineEditingVal.trim()) {
                                  const updatedCols = board.columns.map(c => c.id === col.id ? { ...c, name: inlineEditingVal.trim() } : c);
                                  onUpdateBoard({ ...board, columns: updatedCols });
                                }
                                setInlineEditingColId(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  if (inlineEditingVal.trim()) {
                                    const updatedCols = board.columns.map(c => c.id === col.id ? { ...c, name: inlineEditingVal.trim() } : c);
                                    onUpdateBoard({ ...board, columns: updatedCols });
                                  }
                                  setInlineEditingColId(null);
                                } else if (e.key === "Escape") {
                                  setInlineEditingColId(null);
                                }
                              }}
                              className="bg-slate-800 text-slate-100 px-2 py-1 rounded text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <div 
                              className="flex flex-col gap-0.5 cursor-pointer hover:bg-white/5 p-1 rounded-md transition-all text-left w-full"
                              onClick={() => {
                                setInlineEditingColId(col.id);
                                setInlineEditingVal(col.name);
                              }}
                              title="Click to rename column"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="truncate text-slate-200" title={col.name}>{col.name}</span>
                                <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">✏️</span>
                              </div>
                              <span className="text-[9px] font-semibold text-slate-500 lowercase">
                                {col.type === "text" ? "free text" : col.type === "select" ? "menu options" : "schedule hour"}
                              </span>
                            </div>
                          )}
                          
                          {/* Always editable */}
                          {col.id !== "participant" && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingColumn(col);
                                  setIsColModalOpen(true);
                                }}
                                className="p-1 hover:bg-white/5 hover:text-indigo-400 rounded text-slate-500 transition-colors"
                                title="Edit Column settings"
                              >
                                <Settings className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteColumn(col.id);
                                }}
                                className="p-1 hover:bg-rose-500/10 hover:text-rose-400 rounded text-slate-500 transition-colors"
                                title="Delete Column"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </th>
                    );
                  })}

                  {/* Coincidence: Interested Column */}
                  <th className="w-[280px] px-5 py-4 border-r border-white/5 text-slate-400 text-[10px] font-bold uppercase tracking-widest bg-black/20">
                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-slate-200">Coincide (Interested 🤔)</span>
                      <span className="text-[9px] font-semibold text-slate-500 lowercase">
                        overlapping hours with interested
                      </span>
                    </div>
                  </th>

                  {/* Coincidence: Confirmed Column */}
                  <th className="w-[280px] px-5 py-4 border-r border-white/5 text-slate-400 text-[10px] font-bold uppercase tracking-widest bg-black/20">
                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-slate-200">Coincide (Confirmed 🎉)</span>
                      <span className="text-[9px] font-semibold text-slate-500 lowercase">
                        overlapping hours with confirmed
                      </span>
                    </div>
                  </th>

                  {/* Actions Column */}
                  <th className="w-[120px] px-4 py-4 text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest bg-black/20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-[#050505]">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td 
                      colSpan={board.columns.length + 3} 
                      className="px-6 py-16 text-center text-slate-500 text-sm bg-black/10"
                    >
                      <div className="flex flex-col items-center justify-center gap-2.5 max-w-sm mx-auto">
                        <Info className="w-8 h-8 text-slate-700" />
                        <p className="font-semibold text-slate-400">Empty Organizer Sheet</p>
                        <p className="text-xs text-slate-600">No participants are listed on this board yet.</p>
                        <button
                          onClick={handleAppendRow}
                          className="mt-3 px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 rounded-lg flex items-center gap-1.5 border border-white/5 hover:border-white/10 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" /> S'ajouter
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, index) => (
                    <tr 
                      key={row.id} 
                      className="hover:bg-white/[0.02] group/row transition-all duration-100 align-top"
                    >
                      {/* Cells mapping */}
                      {board.columns.map((col) => (
                        <td 
                          key={col.id} 
                          className="border-r border-white/5 last:border-0 p-0 align-middle"
                        >
                          <CellEditor
                            column={col}
                            value={row.cells[col.id] || (col.type === "schedule" ? {} : "")}
                            onChange={(newValue) => handleCellChange(row.id, col.id, newValue)}
                          />
                        </td>
                      ))}

                      {/* Coincidence: Interested Cell */}
                      <td className="border-r border-white/5 p-3.5 align-middle">
                        {(() => {
                          const coincidences = getCoincidences(row, 'interested');
                          if (coincidences.length === 0) {
                            return <span className="text-xs text-slate-600 italic px-2">—</span>;
                          }
                          return (
                            <div className="flex flex-col gap-2.5 max-h-[160px] overflow-y-auto pr-1">
                              {coincidences.map((c, idx) => (
                                <div key={idx} className="text-xs leading-relaxed bg-black/40 p-2.5 rounded-lg border border-white/5 flex flex-col gap-1">
                                  <div>
                                    <span className="text-slate-400">Coincide with </span>
                                    <span className="font-bold text-amber-400">{c.name}</span>
                                    <span className="text-slate-400"> for </span>
                                    <span className="font-semibold text-slate-200">{c.columnName}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-300 font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5 w-fit">
                                    {c.dayHoursText}
                                  </div>
                                  <div className="text-[10px] flex items-center gap-1.5 mt-0.5">
                                    <span className="text-slate-500 font-bold uppercase tracking-wider">Status:</span>
                                    <span className={c.isInterested ? "text-amber-400 font-bold" : c.isPerfect ? "text-emerald-400 font-bold" : "text-indigo-400 font-medium"}>
                                      {c.statusLabel}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Coincidence: Confirmed Cell */}
                      <td className="border-r border-white/5 p-3.5 align-middle">
                        {(() => {
                          const coincidences = getCoincidences(row, 'confirmed');
                          if (coincidences.length === 0) {
                            return <span className="text-xs text-slate-600 italic px-2">—</span>;
                          }
                          return (
                            <div className="flex flex-col gap-2.5 max-h-[160px] overflow-y-auto pr-1">
                              {coincidences.map((c, idx) => (
                                <div key={idx} className="text-xs leading-relaxed bg-black/40 p-2.5 rounded-lg border border-white/5 flex flex-col gap-1">
                                  <div>
                                    <span className="text-slate-400">Coincide with </span>
                                    <span className="font-bold text-emerald-400">{c.name}</span>
                                    <span className="text-slate-400"> for </span>
                                    <span className="font-semibold text-slate-200">{c.columnName}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-300 font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5 w-fit">
                                    {c.dayHoursText}
                                  </div>
                                  <div className="text-[10px] flex items-center gap-1.5 mt-0.5">
                                    <span className="text-slate-500 font-bold uppercase tracking-wider">Status:</span>
                                    <span className={c.isInterested ? "text-amber-400 font-bold" : c.isPerfect ? "text-emerald-400 font-bold" : "text-indigo-400 font-medium"}>
                                      {c.statusLabel}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Actions Column */}
                      <td className="p-2 align-middle text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleDuplicateRow(row, index)}
                            className="p-2 hover:bg-white/5 hover:text-indigo-400 text-slate-500 hover:text-slate-300 rounded-lg transition-all"
                            title="Duplicate row & copy participant info"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteRow(row.id)}
                            className="p-2 hover:bg-rose-500/10 hover:text-rose-400 text-slate-500 hover:text-rose-400 rounded-lg transition-all"
                            title="Delete Row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Quick tips explaining word wrapping text area resize */}
          <div className="flex items-start gap-3 bg-[#080808] p-4 rounded-xl border border-white/5 text-xs text-slate-500">
            <Sparkle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-400 block mb-1">Spreadsheet Layout Guide:</span>
              <ul className="list-disc pl-4 space-y-1 text-slate-500">
                <li>Word wrapping text cells expand the height of their entire row automatically as you type to prevent overflow.</li>
                <li>Hour availability lists (08h00 - 14h00) show compact colored time slots with an interactive picker.</li>
                <li>Anyone with the link can edit cells, rows, and add custom columns.</li>
              </ul>
            </div>
          </div>

        </div>

        {/* Floating Action Button: Add custom column */}
        <div className="absolute bottom-8 right-8 z-30">
          <button
            onClick={() => {
              setEditingColumn(undefined);
              setIsColModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 text-white px-6 py-3 rounded-full flex items-center gap-3 border border-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <span className="text-xs font-semibold uppercase tracking-wider">Add Custom Column</span>
            <Plus className="w-4.5 h-4.5" />
          </button>
        </div>

      </main>

      {/* Column Config Modal */}
      <ColumnConfigModal
        isOpen={isColModalOpen}
        onClose={() => {
          setIsColModalOpen(false);
          setEditingColumn(undefined);
        }}
        onSave={handleSaveColumn}
        existingColumn={editingColumn}
      />

    </div>
  );
}
