import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Filter, ShieldAlert, ChevronDown, ChevronUp, Code, Copy, Check } from 'lucide-react';
import { api } from '../services/api';
import { AttackTestCase } from '../types';

export const AttackLibrary: React.FC = () => {
  const [battery, setBattery] = useState<AttackTestCase[]>([]);
  const [categories, setCategories] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bat, cats] = await Promise.all([api.getBattery(), api.getCategories()]);
      setBattery(bat);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load attack battery', err);
    } finally {
      setLoading(false);
    }
  };

  const copyPayload = (id: string, payload: string) => {
    navigator.clipboard.writeText(payload);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredAttacks = battery.filter((atk) => {
    const matchCat = selectedCategory === 'ALL' || atk.category === selectedCategory;
    const matchSev = selectedSeverity === 'ALL' || atk.severity === selectedSeverity;
    const matchQuery =
      searchQuery === '' ||
      atk.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      atk.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      atk.objective.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSev && matchQuery;
  });

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-100 flex items-center space-x-3">
          <BookOpen className="w-6 h-6 text-cyan-400" />
          <span>Adversarial Attack Library</span>
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Structured, academic-safe attack test cases covering the OWASP Top 10 for LLMs (LLM01).
        </p>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-4 shadow-lg space-y-4 font-mono text-xs">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search attacks by ID, name, or objective..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:border-cyan-500 outline-none"
            />
          </div>

          {/* Severity Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 text-[11px] uppercase">Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Categories ({battery.length})
          </button>
          {Object.keys(categories).map((catKey) => (
            <button
              key={catKey}
              onClick={() => setSelectedCategory(catKey)}
              className={`px-3 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                selectedCategory === catKey
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {catKey} ({battery.filter((a) => a.category === catKey).length})
            </button>
          ))}
        </div>
      </div>

      {/* Attack List */}
      <div className="space-y-4">
        {filteredAttacks.length === 0 ? (
          <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-8 text-center text-slate-500 font-mono text-xs">
            No attack test cases match the active filters.
          </div>
        ) : (
          filteredAttacks.map((atk) => {
            const isExpanded = expandedId === atk.id;
            return (
              <div
                key={atk.id}
                className="bg-[#0e1628] border border-slate-800 rounded-xl overflow-hidden shadow-md transition hover:border-slate-700"
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : atk.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-900/40 select-none"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-cyan-400 text-xs w-28 shrink-0">{atk.id}</span>
                    <div>
                      <h2 className="text-sm font-bold text-slate-100">{atk.name}</h2>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{atk.objective}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      atk.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                      atk.severity === 'HIGH' ? 'bg-orange-950 text-orange-300 border border-orange-800' :
                      atk.severity === 'MEDIUM' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {atk.severity}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {atk.category}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-6 py-5 border-t border-slate-800/80 bg-[#0a101d] space-y-4 font-mono text-xs">
                    {/* Injected Payload */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-slate-400 uppercase font-semibold">Adversarial Probe Payload:</span>
                        <button
                          onClick={() => copyPayload(atk.id, atk.payload)}
                          className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 cursor-pointer"
                        >
                          {copiedId === atk.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === atk.id ? 'Copied' : 'Copy Payload'}</span>
                        </button>
                      </div>
                      <pre className="p-3 rounded bg-slate-950 border border-slate-800 text-amber-200/90 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                        {atk.payload}
                      </pre>
                    </div>

                    {/* Expected Safe Behavior */}
                    <div>
                      <span className="text-slate-400 uppercase font-semibold block mb-1">Expected Safe Behavior:</span>
                      <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded border border-slate-800">
                        {atk.expected_safe_behavior}
                      </p>
                    </div>

                    {/* Indicators & Detection Rules */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-rose-950/20 border border-rose-900/60 p-3 rounded">
                        <span className="text-rose-400 font-bold block mb-1">Success (Breach) Indicators:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {atk.success_indicators.map((ind, i) => (
                            <code key={i} className="bg-rose-950 px-1.5 py-0.5 rounded text-rose-300 border border-rose-800 text-[11px]">
                              {ind}
                            </code>
                          ))}
                        </div>
                      </div>

                      <div className="bg-emerald-950/20 border border-emerald-900/60 p-3 rounded">
                        <span className="text-emerald-400 font-bold block mb-1">Defense (Resisted) Indicators:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {atk.failure_indicators.map((ind, i) => (
                            <code key={i} className="bg-emerald-950 px-1.5 py-0.5 rounded text-emerald-300 border border-emerald-800 text-[11px]">
                              {ind}
                            </code>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Remediation */}
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-cyan-400 font-bold uppercase">
                        <div className="flex items-center space-x-1.5">
                          <Code className="w-4 h-4" />
                          <span>Defensive Remediation Strategy</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {atk.remediation_advice.owasp_reference}
                        </span>
                      </div>
                      <p className="text-slate-300">{atk.remediation_advice.strategy}</p>
                      {atk.remediation_advice.code_example && (
                        <pre className="bg-slate-950 p-2.5 rounded border border-slate-800 text-emerald-400 text-[11px] overflow-x-auto whitespace-pre-wrap">
                          {atk.remediation_advice.code_example}
                        </pre>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
