import React, { useEffect, useRef, useState, useCallback } from "react";
import { RefreshCw, Search, User, Bot, FileEdit, Trash2, PlusCircle, Clock, ChevronDown, X } from "lucide-react";
import api from "../../../shared/services/axiosInstance.js";

// ── All model names ──────────────────────────────────────────────────────────
const ALL_MODELS = [
  "attendence", "class", "course", "student", "studentMark",
  "user", "liveClass", "teacher", "teacherAttendence",
  "studentFeeTransaction", "subject", "exam", "expense",
  "qarzaAccount", "qarzaPayment", "paymentWithoutAccount",
  "teacherSalaryPayment", "reminder", "expenseCatag",
  "studentInvoice", "teacherInvoice", "partnerInvestment", "classPartnership",
];

const ACTION_META = {
  create: { label: "Created", icon: PlusCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  update: { label: "Updated", icon: FileEdit, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  delete: { label: "Deleted", icon: Trash2, color: "text-red-500", bg: "bg-red-50", border: "border-red-200" },
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-PK", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Multi-select dropdown ────────────────────────────────────────────────────
function ModelMultiSelect({ selectedModels, setSelectedModels }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggle(model) {
    setSelectedModels(prev =>
      prev.includes(model) ? prev.filter(m => m !== model) : [...prev, model]
    );
  }

  function clearAll() { setSelectedModels([]); }

  const label = selectedModels.length === 0
    ? "All Models"
    : selectedModels.length === 1
      ? selectedModels[0]
      : `${selectedModels.length} models selected`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 bg-white border-2 border-slate-200 shadow-sm text-zinc-700 p-2.5 px-5 rounded-xl font-semibold text-sm hover:border-cyan-400 transition-colors min-w-[180px] justify-between"
      >
        <span className="truncate max-w-[150px]">{label}</span>
        <div className="flex items-center gap-1">
          {selectedModels.length > 0 && (
            <X size={13} className="text-slate-400 hover:text-red-500"
              onClick={(e) => { e.stopPropagation(); clearAll(); }} />
          )}
          <ChevronDown size={14} className={`text-cyan-600 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-2 left-0 bg-white border-2 border-slate-200 rounded-xl shadow-xl w-64 max-h-72 overflow-y-auto">
          <div className="p-2 border-b border-slate-100 flex items-center justify-between px-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Select Models</span>
            <button onClick={clearAll} className="text-xs text-cyan-600 font-semibold hover:underline">Clear</button>
          </div>
          {ALL_MODELS.map(model => (
            <div
              key={model}
              onClick={() => toggle(model)}
              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors ${selectedModels.includes(model) ? "bg-cyan-50" : ""}`}
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selectedModels.includes(model) ? "bg-cyan-600 border-cyan-600" : "border-slate-300"}`}>
                {selectedModels.includes(model) && <span className="text-white text-[10px] font-bold">✓</span>}
              </div>
              <span className="text-sm text-slate-700 font-mono">{model}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Each log row ─────────────────────────────────────────────────────────────
function EachLogRow({ log }) {
  const action = log?.action?.toLowerCase();
  const meta = ACTION_META[action] || ACTION_META["update"];
  const Icon = meta.icon;
  const isAI = log?.changedBy === "EDC AI";

  return (
    <div className="flex items-center w-full border-b border-slate-100 hover:bg-slate-50 transition-colors duration-100 py-3 px-2">
      <div className="w-[13%] flex justify-center">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${meta.bg} ${meta.color} border ${meta.border}`}>
          <Icon size={11} />{meta.label}
        </span>
      </div>
      <div className="w-[13%] px-4 text-center">
        <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200">
          {log?.model || log?.relatedWith || "—"}
        </span>
      </div>
      <div className="w-[20%] px-4 text-center">
        <span className="text-xs font-mono text-slate-400 truncate block" title={log?.documentId}>
          {log?.documentId ? `${log.documentId.toString().slice(0, 8)}...${log.documentId.toString().slice(-4)}` : "—"}
        </span>
      </div>
      <div className="flex-1 px-4 text-sm text-slate-600 truncate" title={log?.description}>
        {log?.description || "—"}
      </div>
      <div className="w-[10%] flex justify-center">
        {isAI ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full">
            <Bot size={11} /> {log?.changedBy?.toUpperCase() || "EDC AI"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2.5 py-1 rounded-full">
            <User size={11} /> {log?.changedBy?.toUpperCase() || "Human"}
          </span>
        )}
      </div>
      <div className="w-[15%] px-4 text-center">
        <span className="text-xs text-slate-400 whitespace-nowrap flex items-center justify-center gap-1">
          <Clock size={10} />{formatDate(log?.createdAt || log?.date)}
        </span>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function ActivityLogs() {
  const pageRef = useRef();
  const skipRef = useRef(0);
  const limit = 30;

  // data state
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalLogs, setTotalLogs] = useState(0);

  // filter state — these are the "pending" values the user is editing
  const [selectedModels, setSelectedModels] = useState([]);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [searchText, setSearchText] = useState("");

  // applied filters — only updated when Search button is clicked
  const appliedFilters = useRef({ models: [], dateStart: "", dateEnd: "", filterAction: "all" });

  // ── API call ───────────────────────────────────────────────────────────────
  async function getLogs(origin) {
    try {
      if (loading && origin !== "reset") return; // prevent duplicate calls

      if (origin === "reset") {
        skipRef.current = 0;
        setHasMore(true);
        setLogs([]);
      }

      setLoading(true);
      const skipTo = origin === "reset" ? 0 : skipRef.current;
      const f = appliedFilters.current;

      const body = {
        models: f.models.length > 0 ? f.models : ["all"],
        date: (f.dateStart || f.dateEnd)
          ? { start: f.dateStart || undefined, end: f.dateEnd || undefined }
          : null,
      };

      // action filter — append to query param so backend can also handle it
      // (here we handle it client-side too for instant UX after load)
      const res = await api.post(`/activityLogRoutes/getLogs/${skipTo}/${limit}`, body);

      if (res.data?.success) {
        const incoming = res.data.logs || [];
        setTotalLogs(res.data.totalLogs || 0);

        if (origin === "reset") {
          setLogs(incoming);
          skipRef.current = incoming.length;
        } else {
          setLogs(prev => [...prev, ...incoming]);
          skipRef.current = skipRef.current + incoming.length;
        }

        if (incoming.length < limit) setHasMore(false);
      } else {
        if (origin === "reset") setLogs([]);
        setHasMore(false);
      }
    } catch (error) {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }

  // ── On mount ───────────────────────────────────────────────────────────────
  useEffect(() => { getLogs("reset"); }, []);

  // ── Search button click — apply filters then fetch ─────────────────────────
  function handleSearch() {
    appliedFilters.current = {
      models: selectedModels,
      dateStart: dateStart,
      dateEnd: dateEnd,
      filterAction: filterAction,
    };
    getLogs("reset");
  }

  // ── Refresh ────────────────────────────────────────────────────────────────
  function handleRefresh() {
    setSelectedModels([]);
    setDateStart("");
    setDateEnd("");
    setFilterAction("all");
    setSearchText("");
    appliedFilters.current = { models: [], dateStart: "", dateEnd: "", filterAction: "all" };
    getLogs("reset");
  }

  // ── Infinite scroll ────────────────────────────────────────────────────────
  function handleScroll() {
    const container = pageRef.current;
    if (!container) return;
    const nearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100;
    if (nearBottom && !loading && hasMore) {
      getLogs("scroll");
    }
  }

  // ── Client-side filter for action tab + text search (instant, no API) ──────
  const filtered = logs.filter(log => {
    const matchesAction = filterAction === "all" || log?.action?.toLowerCase() === filterAction;
    const matchesSearch = !searchText ||
      log?.model?.toLowerCase().includes(searchText.toLowerCase()) ||
      log?.description?.toLowerCase().includes(searchText.toLowerCase()) ||
      log?.documentId?.toString().includes(searchText);
    return matchesAction && matchesSearch;
  });

  return (
    <div className="h-full overflow-hidden relative flex">
      {/* <Navbar /> */}

      <div
        ref={pageRef}
        onWheel={(e) => { pageRef.current.scrollTop += e.deltaY; }}
        onScroll={handleScroll}
        className="h-screen overflow-y-scroll flex-1 p-10 font-sans"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="w-max bg-gradient-to-r from-cyan-600 to-blue-800 bg-clip-text text-4xl font-bold text-transparent">
            Activity Logs
          </h1>
          <p className="text-slate-500 text-lg font-medium">
            All database operations are tracked here.
            {totalLogs > 0 && <span className="ml-2 text-sm text-cyan-600 font-semibold">{totalLogs.toLocaleString()} total logs</span>}
          </p>
        </div>

        {/* ── Filter bar ── */}
        <div className="flex items-center gap-4 px-2 flex-wrap mb-4">

          {/* Model multi-select */}
          <ModelMultiSelect selectedModels={selectedModels} setSelectedModels={setSelectedModels} />

          {/* Date start */}
          <div className="flex items-center gap-2 bg-white border-2 border-slate-200 shadow-sm text-zinc-700 p-2.5 px-5 rounded-xl font-semibold">
            <span className="text-xs text-slate-400 whitespace-nowrap">From</span>
            <input
              type="date"
              value={dateStart}
              onChange={e => setDateStart(e.target.value)}
              className="focus:ring-0 outline-0 border-0 text-sm cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60"
            />
          </div>

          {/* Date end */}
          <div className="flex items-center gap-2 bg-white border-2 border-slate-200 shadow-sm text-zinc-700 p-2.5 px-5 rounded-xl font-semibold">
            <span className="text-xs text-slate-400 whitespace-nowrap">To</span>
            <input
              type="date"
              value={dateEnd}
              onChange={e => setDateEnd(e.target.value)}
              className="focus:ring-0 outline-0 border-0 text-sm cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60"
            />
          </div>

          {/* Search text */}
          <div className="flex items-center gap-2 bg-white border-2 border-slate-200 shadow-sm text-zinc-700 p-2.5 px-5 rounded-xl font-semibold focus-within:border-cyan-400 transition-colors flex-1 min-w-[200px]">
            <input
              value={searchText}
              type="text"
              className="flex-1 focus:ring-0 outline-0 border-0 text-sm"
              placeholder="Search model, description, ID..."
              onChange={e => setSearchText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
            />
          </div>

          {/* Search button */}
          <button
            onClick={handleSearch}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-700 text-white p-2.5 px-6 rounded-xl font-semibold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            <Search size={15} />
            Search
          </button>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            className="group flex items-center gap-2 bg-white border-2 border-slate-200 shadow-sm cursor-pointer text-zinc-700 p-2.5 px-5 rounded-xl font-semibold hover:border-cyan-400 transition-colors"
          >
            <RefreshCw size={15} className="text-cyan-600 group-hover:rotate-180 transition-transform duration-300" />
            Reset
          </button>
        </div>

        {/* ── Action filter tabs ── */}
        {/* <div className="flex items-center gap-2 px-2 mb-8">
          <div className="flex items-center gap-1 bg-white border-2 border-slate-200 shadow-sm rounded-xl p-1.5 px-2">
            {["all", "create", "update", "delete"].map(act => (
              <button
                key={act}
                onClick={() => setFilterAction(act)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-colors duration-100 ${
                  filterAction === act
                    ? "bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {act}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400 ml-2">{filtered.length} showing</span>
        </div> */}

        {/* ── Table header ── */}
        <div className="flex w-full border-b border-gray-600 bg-slate-100 font-semibold text-slate-700 rounded-t-lg">
          <div className="w-[13%] px-5 py-3 text-center text-sm">Action</div>
          <div className="w-[13%] px-5 py-3 text-center text-sm">Model</div>
          <div className="w-[20%] px-5 py-3 text-center text-sm">Document ID</div>
          <div className="flex-1 px-5 py-3 text-center text-sm">Description</div>
          <div className="w-[10%] px-5 py-3 text-center text-sm">By</div>
          <div className="w-[15%] px-5 py-3 text-center text-sm whitespace-nowrap">Date & Time</div>
        </div>

        {/* ── Rows ── */}
        {filtered.length < 1 ? (
          <div className="text-gray-600 h-[50vh] w-full flex justify-center items-center">
            {loading ? "Loading logs..." : "No activity logs found"}
          </div>
        ) : (
          <div className="w-full">
            {filtered.map((log, index) => (
              <EachLogRow key={log._id || index} log={log} />
            ))}

            {loading && (
              <div className="w-full py-4 text-center text-gray-500 text-sm">
                Loading more logs...
              </div>
            )}

            {!hasMore && filtered.length > 0 && (
              <div className="w-full py-4 text-center text-slate-400 text-xs">
                — All logs loaded —
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}