import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { QarzaService } from "../../modules/qarza/api/qarzaSearchApi.js";

const ApiQarzaSelect = ({ value, onChange, placeholder = "Search qarza accounts...", type = null }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState([]);
    const ref = useRef();

    const selected = useMemo(() => options.find(o => o.value === value), [options, value]);

    const searchQarzaAccounts = useCallback(async (query) => {
        if (!query || query.length < 2) {
            setOptions([]);
            return;
        }
        setLoading(true);
        try {
            const results = await QarzaService.search(query, 20);
            // Filter by type if specified
            const filtered = type ? results.filter(r => r.type === type) : results;
            setOptions(filtered.map(q => ({ 
                label: q.name + (q.phoneNo ? ` · ${q.phoneNo}` : ""), 
                value: q._id, 
                data: q 
            })));
        } catch (error) {
            console.error("Error searching qarza accounts:", error);
            setOptions([]);
        } finally {
            setLoading(false);
        }
    }, [type]);

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (open && search) {
                searchQarzaAccounts(search);
            }
        }, 300);
        return () => clearTimeout(debounceTimer);
    }, [search, open, searchQarzaAccounts]);

    return (
        <div ref={ref} className="relative w-full">
            <button type="button" onClick={() => setOpen(p => !p)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl transition text-left"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: selected ? "var(--ink)" : "var(--muted)" }}>
                <span className="truncate">{selected?.label || placeholder}</span>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "var(--muted)" }} />
            </button>
            {open && (
                <div className="absolute z-50 w-full mt-1 rounded-xl shadow-xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <div className="p-2" style={{ borderBottom: "1px solid var(--border)" }}>
                        <input 
                            autoFocus 
                            type="text" 
                            placeholder="Search qarza accounts..." 
                            value={search} 
                            onChange={e => setSearch(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm rounded-lg outline-none"
                            style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", color: "var(--ink)" }} 
                        />
                    </div>
                    <div className="max-h-84 overflow-y-auto">
                        {loading ? (
                            <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
                        ) : search.length < 2 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">Type at least 2 characters to search</div>
                        ) : options.length > 0 ? (
                            options.map(o => (
                                <div key={o.value} onClick={() => { onChange(o.value, o.data); setOpen(false); setSearch(""); }}
                                    className="px-3 py-2 text-sm cursor-pointer transition"
                                    style={{ background: value === o.value ? "rgba(15,118,110,0.08)" : "transparent", color: value === o.value ? "var(--accent-2)" : "var(--ink)", fontWeight: value === o.value ? 600 : 400 }}
                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(15,118,110,0.06)"}
                                    onMouseLeave={e => e.currentTarget.style.background = value === o.value ? "rgba(15,118,110,0.08)" : "transparent"}>
                                    {o.label}
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">No qarza accounts found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApiQarzaSelect;
