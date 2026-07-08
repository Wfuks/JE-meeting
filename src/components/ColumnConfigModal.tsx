import { useState, useEffect } from "react";
import { ColumnDefinition, SelectOption, ColumnType } from "../types.js";
import { Plus, Trash2, X, Settings, ListPlus, Type, CalendarRange } from "lucide-react";

interface ColumnConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (column: ColumnDefinition) => void;
  existingColumn?: ColumnDefinition;
}

// Preset color pairs optimized for dark theme with perfect visual contrast
const COLOR_PRESETS = [
  { name: "Forest", bg: "#065f46", text: "#ecfdf5" },
  { name: "Ocean", bg: "#1e3a8a", text: "#dbeafe" },
  { name: "Sunset", bg: "#991b1b", text: "#ffe4e6" },
  { name: "Gold", bg: "#854d0e", text: "#fef9c3" },
  { name: "Amethyst", bg: "#581c87", text: "#f3e8ff" },
  { name: "Teal Glow", bg: "#115e59", text: "#ccfbf1" },
  { name: "Neon Rose", bg: "#831843", text: "#fce7f3" },
  { name: "Slate", bg: "#334155", text: "#f1f5f9" },
  { name: "Vibrant Sky", bg: "#0369a1", text: "#e0f2fe" },
  { name: "Plum", bg: "#701a75", text: "#fae8ff" },
];

export default function ColumnConfigModal({
  isOpen,
  onClose,
  onSave,
  existingColumn
}: ColumnConfigModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<ColumnType>("text");
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [newOptionText, setNewOptionText] = useState("");
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

  // Initialize form on edit/open
  useEffect(() => {
    if (existingColumn) {
      setName(existingColumn.name);
      setType(existingColumn.type);
      setOptions(existingColumn.options || []);
    } else {
      setName("");
      setType("text");
      setOptions([]);
    }
    setNewOptionText("");
    setSelectedColorIndex(0);
  }, [existingColumn, isOpen]);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (!newOptionText.trim()) return;
    
    const color = COLOR_PRESETS[selectedColorIndex];
    const newOption: SelectOption = {
      id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text: newOptionText.trim(),
      bgColor: color.bg,
      textColor: color.text
    };

    setOptions([...options, newOption]);
    setNewOptionText("");
    // Cycle color index to give diversity automatically
    setSelectedColorIndex((selectedColorIndex + 1) % COLOR_PRESETS.length);
  };

  const handleRemoveOption = (id: string) => {
    setOptions(options.filter(opt => opt.id !== id));
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const column: ColumnDefinition = {
      id: existingColumn?.id || `col-${Date.now()}`,
      name: name.trim(),
      type,
      ...(type === "select" ? { options } : {})
    };

    onSave(column);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0c0c0c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-slate-100">
              {existingColumn ? "Edit Column" : "Add Custom Column"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 hover:bg-white/5 p-2 rounded-lg transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Column Name */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Column Title
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Diet Prefs, Activity Choice, Boardgames"
              className="w-full bg-black/50 border border-white/5 focus:border-indigo-500 rounded-lg px-4 py-3 text-sm text-slate-100 focus:outline-none transition-all placeholder-slate-700"
              maxLength={40}
              required
            />
          </div>

          {/* Column Cell Type */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Cell Data Type
            </label>
            
            <div className="grid grid-cols-3 gap-3">
              {/* FREE TEXT */}
              <button
                type="button"
                onClick={() => setType("text")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all cursor-pointer ${
                  type === "text"
                    ? "bg-indigo-600/10 border-indigo-500 text-indigo-400"
                    : "bg-black/50 border-white/5 text-slate-400 hover:border-white/10"
                }`}
              >
                <Type className="w-5 h-5" />
                <div className="text-xs font-bold">Free Text</div>
                <p className="text-[10px] opacity-75">Growing textarea editor</p>
              </button>

              {/* DROPDOWN */}
              <button
                type="button"
                onClick={() => setType("select")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all cursor-pointer ${
                  type === "select"
                    ? "bg-indigo-600/10 border-indigo-500 text-indigo-400"
                    : "bg-black/50 border-white/5 text-slate-400 hover:border-white/10"
                }`}
              >
                <ListPlus className="w-5 h-5" />
                <div className="text-xs font-bold">Menu Options</div>
                <p className="text-[10px] opacity-75">Colored badge dropdown</p>
              </button>

              {/* SCHEDULE */}
              <button
                type="button"
                onClick={() => setType("schedule")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all cursor-pointer ${
                  type === "schedule"
                    ? "bg-indigo-600/10 border-indigo-500 text-indigo-400"
                    : "bg-black/50 border-white/5 text-slate-400 hover:border-white/10"
                }`}
              >
                <CalendarRange className="w-5 h-5" />
                <div className="text-xs font-bold">Schedule Hour</div>
                <p className="text-[10px] opacity-75">08h00 - 14h00 unrolls</p>
              </button>
            </div>
          </div>

          {/* Conditional Options Builder for Dropdown */}
          {type === "select" && (
            <div className="space-y-4 border-t border-white/5 pt-5 animate-in slide-in-from-bottom-2 duration-200">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Configure Menu Options
              </label>

              {/* Option adder input */}
              <div className="space-y-3 bg-black/40 p-4 rounded-xl border border-white/5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOptionText}
                    onChange={(e) => setNewOptionText(e.target.value)}
                    placeholder="Enter menu option (e.g. Yes 👍)"
                    className="flex-1 bg-black/60 border border-white/5 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none placeholder-slate-700"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>

                {/* Color presets chooser */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-medium">Select Badge Color Style:</span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {COLOR_PRESETS.map((preset, i) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setSelectedColorIndex(i)}
                        className={`text-[9px] font-semibold py-1.5 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                          selectedColorIndex === i
                            ? "border-indigo-500 ring-1 ring-indigo-500/50 scale-105"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: preset.bg, color: preset.text }}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Options list */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Added Options ({options.length})</span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {options.length === 0 ? (
                    <div className="text-xs text-slate-600 italic py-4 text-center bg-black/20 rounded-lg border border-dashed border-white/5">
                      Add options above to build your dropdown menu options.
                    </div>
                  ) : (
                    options.map((opt, index) => (
                      <div
                        key={opt.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-600 font-mono">#{index + 1}</span>
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg border"
                            style={{ backgroundColor: `${opt.bgColor}20`, borderColor: opt.bgColor, color: opt.textColor }}
                          >
                            {opt.text}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(opt.id)}
                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/5 bg-black/20">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim() || (type === "select" && options.length === 0)}
            className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-indigo-500 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            Save Column
          </button>
        </div>

      </div>
    </div>
  );
}
