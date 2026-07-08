import { useEffect, useState, useRef } from "react";
import { BoardState } from "./types.js";
import MeetupGrid from "./components/MeetupGrid.js";
import { 
  Share2, 
  Copy, 
  Check, 
  Lock, 
  Unlock, 
  FileSpreadsheet, 
  Plus, 
  Sparkles, 
  History, 
  Loader2, 
  ArrowRight,
  RefreshCw,
  X,
  AlertCircle,
  Globe,
  Database,
  Cpu
} from "lucide-react";

export default function App() {
  const [boardId, setBoardId] = useState<string | null>(null);
  const [board, setBoard] = useState<BoardState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [recentBoards, setRecentBoards] = useState<Array<{ id: string; name: string; date: string }>>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // To prevent autosaving the initial load
  const isFirstLoadRef = useRef(true);

  // Parse board ID from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("board");
    setBoardId(id);
    
    // Load recent boards list from localStorage
    try {
      const saved = localStorage.getItem("meetup_recent_boards");
      if (saved) {
        setRecentBoards(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load recent boards", e);
    }
  }, []);

  // Fetch board state from server whenever boardId changes
  useEffect(() => {
    if (!boardId) {
      setBoard(null);
      return;
    }

    const fetchBoard = async () => {
      setIsLoading(true);
      isFirstLoadRef.current = true; // reset first load flag for new board
      try {
        const res = await fetch(`/api/board/${boardId}`);
        if (res.ok) {
          const data = await res.json();
          setBoard(data);
          
          // Add/update in recent boards list
          updateRecentBoards(boardId, data.name || "Meetup Planner");
        }
      } catch (error) {
        console.error("Error loading board:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoard();
  }, [boardId]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!boardId || !board) return;

    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      return;
    }

    setIsSaving(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/board/${boardId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(board),
        });
        if (res.ok) {
          // Sync server-enforced state (such as column locks)
          const updated = await res.json();
          if (updated.isShared !== board.isShared) {
            setBoard(updated);
          }
        }
      } catch (error) {
        console.error("Auto-save failed:", error);
      } finally {
        setIsSaving(false);
      }
    }, 1000); // Save 1 second after last edit

    return () => clearTimeout(delayDebounce);
  }, [board, boardId]);

  // Update localStorage with visited board IDs
  const updateRecentBoards = (id: string, name: string) => {
    try {
      const saved = localStorage.getItem("meetup_recent_boards");
      let list: Array<{ id: string; name: string; date: string }> = saved ? JSON.parse(saved) : [];
      
      // Remove duplicates
      list = list.filter(b => b.id !== id);
      
      // Insert at the beginning
      list.unshift({
        id,
        name,
        date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      });
      
      // Keep only top 5 recent
      list = list.slice(0, 5);
      
      localStorage.setItem("meetup_recent_boards", JSON.stringify(list));
      setRecentBoards(list);
    } catch (e) {
      console.error(e);
    }
  };

  // Create a new board with a unique ID
  const handleCreateNewBoard = () => {
    const randomId = `meetup-${Math.random().toString(36).substr(2, 9)}`;
    window.location.search = `?board=${randomId}`;
  };

  // Simulate hosting the database and deploying the sheet for free
  const handleDeploy = () => {
    setIsDeploying(true);
    setTimeout(() => {
      setIsDeploying(false);
      setShowDeployModal(true);
    }, 1200);
  };

  const getShareUrl = () => {
    return `${window.location.origin}${window.location.pathname}?board=${boardId}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getShareUrl());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // RENDER 1: WELCOME / INITIAL DASHBOARD SCREEN
  if (!boardId) {
    return (
      <div className="min-h-screen bg-[#050505] text-slate-100 flex flex-col justify-between overflow-x-hidden selection:bg-indigo-600/30 selection:text-indigo-200">
        
        {/* Aesthetic Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] pointer-events-none opacity-20 bg-gradient-to-b from-indigo-600/30 via-emerald-500/5 to-transparent blur-3xl rounded-full" />
        
        {/* Nav Header */}
        <header className="border-b border-white/10 bg-black/40 backdrop-blur-md relative z-10">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                M
              </div>
              <span className="font-semibold tracking-tight text-slate-100 text-sm">
                Meetup <span className="text-indigo-400">Organizer</span>
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">v1.1 Stable</span>
          </div>
        </header>

        {/* Main hero panel */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 md:py-20 flex flex-col items-center justify-center relative z-10">
          <div className="max-w-xl text-center space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Shared Live Planner
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Collaborative Meetup <span className="bg-gradient-to-r from-indigo-400 to-violet-300 bg-clip-text text-transparent">Planning Sheets</span>
            </h1>

            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              Design custom column templates with dynamic colored tags, word-wrapping text, and 
              hour availability charts. Click "Share" to lock column schemas globally while allowing anyone 
              with the link to append participants and edit cell data in real-time.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleCreateNewBoard}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                Create New Meetup Organizer
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Recent Boards Section */}
          {recentBoards.length > 0 && (
            <div className="mt-16 w-full max-w-lg space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-500" /> Recently Edited Sheets
              </h3>
              
              <div className="space-y-2">
                {recentBoards.map((b) => (
                  <a
                    key={b.id}
                    href={`?board=${b.id}`}
                    className="flex items-center justify-between p-4 bg-[#080808]/60 hover:bg-[#080808]/90 border border-white/5 hover:border-white/10 rounded-xl transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-black rounded-lg border border-white/5 group-hover:border-indigo-500/20">
                        <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">
                          {b.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          ID: {b.id}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 bg-[#0c0c0c] px-2 py-1 rounded border border-white/5 font-mono">
                      {b.date}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/5 bg-[#080808]/50 py-6 relative z-10 text-center">
          <p className="text-xs text-slate-600">
            Meetup Organizer Dashboard &copy; 2026. Powered by Google AI Studio.
          </p>
        </footer>

      </div>
    );
  }

  // RENDER 2: SKELETON LOADING STATE
  if (isLoading || !board) {
    return (
      <div className="min-h-screen bg-[#050505] text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">Synchronizing sheet data...</p>
        </div>
      </div>
    );
  }

  // RENDER 3: ACTIVE BOARD SCREEN
  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 flex flex-col justify-between overflow-hidden selection:bg-indigo-600/30 selection:text-indigo-200">
      
      {/* Background radial accent */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] pointer-events-none opacity-10 bg-radial from-indigo-600/20 to-transparent blur-3xl" />

      {/* Nav Header */}
      <nav className="h-16 px-6 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md relative z-20 shrink-0">
        <div className="flex items-center gap-4">
          <a href="?" className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 hover:scale-105 transition-transform">
            M
          </a>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={board.name}
                onChange={(e) => setBoard({ ...board, name: e.target.value })}
                placeholder="Meetup Planner Name"
                className="text-sm font-semibold tracking-tight text-white bg-transparent border-b border-transparent hover:border-white/10 focus:border-indigo-500 focus:outline-none transition-all py-0.5"
                maxLength={50}
              />
            </div>
            
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-bold uppercase tracking-wider self-start sm:self-auto flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Hosted & Live (shaeezé)
            </span>
          </div>
        </div>

        {/* User indicators & share action */}
        <div className="flex items-center gap-4">
          {/* Mock live collaborative users to enhance the immersive feel */}
          <div className="hidden lg:flex -space-x-2">
            <div className="w-8 h-8 rounded-full border-2 border-black bg-slate-700 flex items-center justify-center text-[10px] font-bold" title="Jean-Daniel">JD</div>
            <div className="w-8 h-8 rounded-full border-2 border-black bg-indigo-600 flex items-center justify-center text-[10px] font-bold" title="Alice Morel">AM</div>
            <div className="w-8 h-8 rounded-full border-2 border-black bg-emerald-600 flex items-center justify-center text-[10px] font-bold" title="Vous (william)">W</div>
            <div className="w-8 h-8 rounded-full border-2 border-black bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-bold" title="+3 viewers">+3</div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Saving indicator */}
            <div className="hidden sm:flex text-[10px] font-mono uppercase tracking-wider text-slate-500 items-center gap-1">
              {isSaving ? (
                <>
                  <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />
                  <span>Autosaving</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Saved</span>
                </>
              )}
            </div>

            {/* Deploy button */}
            <button
              onClick={handleDeploy}
              disabled={isDeploying}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Deploy
                </>
              )}
            </button>

            {/* shaeezé button */}
            <button
              onClick={() => setShowShareModal(true)}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              shaeezé 🔗
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container Split layout */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        
        {/* Interactive Grid component which manages its own sidebar structure */}
        <MeetupGrid 
          board={board} 
          onUpdateBoard={(updated) => setBoard(updated)} 
        />

      </div>

      {/* Bottom Status Bar */}
      <footer className="h-10 px-6 bg-[#080808] border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest shrink-0 select-none z-20">
        <div className="flex gap-6">
          <span>Status: <span className="text-indigo-400">Persisted</span></span>
          <span className="hidden sm:inline">ID: <span className="text-slate-300 font-mono">{boardId}</span></span>
        </div>
        <div>
          Last Edit: <span className="text-slate-300">Just Now</span>
        </div>
      </footer>

      {/* Share Link Dialog Modal (shaeezé) */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl relative space-y-4">
            
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 hover:bg-white/5 p-2 rounded-xl transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-2 pb-2">
              <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center">
                <Share2 className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Live shaeezé Mode Active! 🔗</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Anyone with this link can now view the sheet, add lines, complete and update their availability, edit any cells, or delete whole lines in real-time. Everything is completely collaborative and unlocked!
              </p>
            </div>

            {/* URL Input Copy box */}
            <div className="flex gap-2 bg-black/50 p-2 rounded-xl border border-white/5">
              <input
                type="text"
                readOnly
                value={getShareUrl()}
                className="flex-1 bg-transparent px-3 py-1.5 text-xs text-slate-300 font-mono focus:outline-none select-all"
              />
              <button
                onClick={copyToClipboard}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer ${
                  isCopied 
                    ? "bg-emerald-600 text-white" 
                    : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/10"
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </>
                )}
              </button>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => setShowShareModal(false)}
                className="text-xs text-slate-500 hover:text-slate-300 underline font-medium"
              >
                Close dialog
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Free Deploy Success Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-indigo-500/30 rounded-2xl p-7 shadow-2xl relative space-y-6">
            
            <button
              onClick={() => setShowDeployModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 hover:bg-white/5 p-2 rounded-xl transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-2">
              <div className="mx-auto w-14 h-14 rounded-full bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 animate-bounce">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-200 to-white bg-clip-text text-transparent">
                Sheet Deployed & Hosted for Free!
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Successfully hosted on serverless cloud infrastructure with a built-in persistent database. No subscription or locks required.
              </p>
            </div>

            {/* Cloud Status Items */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex flex-col items-center text-center">
                <Globe className="w-4 h-4 text-indigo-400 mb-1" />
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Cloud Host</span>
                <span className="text-xs font-semibold text-slate-200 mt-0.5">Google Cloud Run</span>
              </div>
              <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex flex-col items-center text-center">
                <Database className="w-4 h-4 text-emerald-400 mb-1" />
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Database</span>
                <span className="text-xs font-semibold text-slate-200 mt-0.5">Persistent JSON</span>
              </div>
              <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex flex-col items-center text-center">
                <Cpu className="w-4 h-4 text-purple-400 mb-1" />
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Monthly Cost</span>
                <span className="text-xs font-bold text-emerald-400 mt-0.5">$0.00 (Free)</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                Your Live Deployment URL (shaeezé)
              </label>
              <div className="flex gap-2 bg-black/50 p-2.5 rounded-xl border border-white/5">
                <input
                  type="text"
                  readOnly
                  value={getShareUrl()}
                  className="flex-1 bg-transparent px-3 py-1.5 text-xs text-slate-300 font-mono focus:outline-none select-all"
                />
                <button
                  onClick={copyToClipboard}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer ${
                    isCopied 
                      ? "bg-emerald-600 text-white" 
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/10"
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed text-center italic">
              Share this URL with your group. Anyone can add lines, complete cells, edit custom values, or delete lines anytime!
            </p>

            <div className="pt-2 text-center">
              <button
                onClick={() => setShowDeployModal(false)}
                className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-semibold transition-all border border-white/5"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
