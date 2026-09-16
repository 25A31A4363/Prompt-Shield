import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle2, Clock,
  Filter, Search, ArrowRight, ExternalLink, MessageSquare, Edit3,
  X, RefreshCw, Send, Check, Copy
} from 'lucide-react';
import { api } from '../services/api';
import { SecurityFinding, FindingStatus, FindingSeverity } from '../types';

interface SecurityFindingsProps {
  onNavigate?: (view: string, id?: string) => void;
}

export const SecurityFindings: React.FC<SecurityFindingsProps> = ({ onNavigate }) => {
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFinding, setSelectedFinding] = useState<SecurityFinding | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [editStatus, setEditStatus] = useState<FindingStatus>('NEW');
  const [editNotes, setEditNotes] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  useEffect(() => {
    loadFindings();
  }, []);

  const loadFindings = async () => {
    try {
      setLoading(true);
      const data = await api.getFindings();
      setFindings(data);
    } catch (err) {
      console.error('Failed to load security findings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFinding = (f: SecurityFinding) => {
    setSelectedFinding(f);
    setEditStatus(f.status);
    setEditNotes(f.review_notes || '');
    setSaveSuccessMsg(false);
  };

  const handleSaveStatus = async () => {
    if (!selectedFinding) return;
    setIsUpdating(true);
    try {
      const updated = await api.updateFindingStatus(selectedFinding.id, editStatus, editNotes);
      setSelectedFinding(updated);
      setFindings((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 2500);
    } catch (err) {
      alert('Failed to update status: ' + err);
    } finally {
      setIsUpdating(false);
    }
  };

  const copyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Filter findings
  const filteredFindings = findings.filter((f) => {
    if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
    if (severityFilter !== 'ALL' && f.severity !== severityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchPrompt = f.prompt.toLowerCase().includes(q);
      const matchCat = f.risk_category.toLowerCase().includes(q);
      const matchId = f.id.toLowerCase().includes(q);
      if (!matchPrompt && !matchCat && !matchId) return false;
    }
    return true;
  });

  // Metrics
  const countNew = findings.filter((f) => f.status === 'NEW').length;
  const countUnderReview = findings.filter((f) => f.status === 'UNDER REVIEW').length;
  const countConfirmed = findings.filter((f) => f.status === 'CONFIRMED').length;
  const countResolved = findings.filter((f) => f.status === 'RESOLVED' || f.status === 'FIXED').length;

  const getStatusBadge = (status: FindingStatus) => {
    switch (status) {
      case 'NEW':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
            NEW
          </span>
        );
      case 'UNDER REVIEW':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
            UNDER REVIEW
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
            CONFIRMED
          </span>
        );
      case 'FIXED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">
            FIXED
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
            RESOLVED
          </span>
        );
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-mono text-slate-400 bg-slate-800">{status}</span>;
    }
  };

  const getSeverityBadge = (severity: FindingSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">MEDIUM</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">LOW</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-slate-400 border border-slate-800">NONE</span>;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center space-x-3">
            <ShieldAlert className="w-6 h-6 text-cyan-400" />
            <span>Security Team Triage & Findings Hub</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Review, investigate, and rectify prompt injection risks submitted by testers and automated guards
          </p>
        </div>

        <button
          type="button"
          onClick={loadFindings}
          className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs px-3.5 py-2 rounded-lg cursor-pointer transition self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* KPI Triage Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase">Total Findings</span>
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-slate-100">{findings.length}</span>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">Logged in registry</p>
          </div>
        </div>

        <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase">New / Pending</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-cyan-400">{countNew}</span>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">Awaiting triage</p>
          </div>
        </div>

        <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase">Under Review</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-amber-400">{countUnderReview}</span>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">Active investigation</p>
          </div>
        </div>

        <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase">Resolved / Fixed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-emerald-400">{countResolved}</span>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">Remediated</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prompt, category, or ID..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-mono text-slate-500 mr-1 flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1" />
            <span>Status:</span>
          </span>
          {['ALL', 'NEW', 'UNDER REVIEW', 'CONFIRMED', 'FIXED', 'RESOLVED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-700 font-bold'
                  : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Findings Table */}
      <div className="bg-[#0e1628] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
            <p>Loading security findings registry...</p>
          </div>
        ) : filteredFindings.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-slate-400 space-y-3">
            <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-300 font-semibold text-sm">No security findings found</p>
            <p className="text-slate-500">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try adjusting your search query or status filter.'
                : 'Submit a prompt on the Dashboard scanner to create and triage a new finding.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-4">Finding ID</th>
                  <th className="p-4">Risk Category</th>
                  <th className="p-4">Severity</th>
                  <th className="p-4">Prompt Preview</th>
                  <th className="p-4">Date / Time</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredFindings.map((f) => (
                  <tr
                    key={f.id}
                    className="hover:bg-slate-900/40 transition cursor-pointer"
                    onClick={() => handleOpenFinding(f)}
                  >
                    <td className="p-4 font-bold text-cyan-400">
                      #{f.id.slice(0, 8)}
                    </td>
                    <td className="p-4 font-semibold text-slate-200">
                      {f.risk_category}
                    </td>
                    <td className="p-4">
                      {getSeverityBadge(f.severity)}
                    </td>
                    <td className="p-4 max-w-xs truncate text-slate-400" title={f.prompt}>
                      "{f.prompt}"
                    </td>
                    <td className="p-4 text-slate-500 text-[11px]">
                      {new Date(f.created_at).toLocaleString()}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(f.status)}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenFinding(f);
                        }}
                        className="inline-flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 font-bold text-[11px] cursor-pointer"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Finding Details Modal / Drawer */}
      {selectedFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0b1222] border border-cyan-800/80 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    Finding #{selectedFinding.id}
                  </span>
                  {getStatusBadge(selectedFinding.status)}
                  {getSeverityBadge(selectedFinding.severity)}
                </div>
                <h2 className="text-lg font-black text-slate-100">
                  {selectedFinding.risk_category}
                </h2>
                <p className="text-[11px] text-slate-500 font-mono">
                  Reported on {new Date(selectedFinding.created_at).toLocaleString()}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFinding(null)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Original Prompt */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Original Submitted Prompt
                </span>
                <button
                  type="button"
                  onClick={() => copyPrompt(selectedFinding.prompt)}
                  className="flex items-center space-x-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
                >
                  {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId ? 'Copied' : 'Copy Prompt'}</span>
                </button>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                {selectedFinding.prompt}
              </div>
            </div>

            {/* Why Flagged */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                Why PromptShield Flagged It
              </span>
              <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed">
                {selectedFinding.explanation}
              </div>
            </div>

            {/* Specific Indicators */}
            {selectedFinding.indicators_detected && selectedFinding.indicators_detected.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Matched Indicator Tokens
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedFinding.indicators_detected.map((ind, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded bg-rose-950/60 border border-rose-900 text-rose-300 font-mono text-xs"
                    >
                      "{ind}"
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Potential Impact & Remediation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1.5">
                <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  Potential Impact
                </span>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {selectedFinding.potential_impact || 'Context hijacking or guardrail bypass.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-900/50 space-y-1.5">
                <span className="text-cyan-400 uppercase tracking-wider text-[10px] font-bold">
                  Recommended Investigation & Action
                </span>
                <p className="text-cyan-200 text-xs leading-relaxed">
                  {selectedFinding.recommendation}
                </p>
              </div>
            </div>

            {/* Rectification Protocol */}
            {selectedFinding.investigation_steps && (
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Security Rectification Protocol
                </span>
                <pre className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {selectedFinding.investigation_steps}
                </pre>
              </div>
            )}

            {/* Security Team Status & Triage Notes Controls */}
            <div className="p-5 bg-slate-900/90 rounded-xl border border-cyan-900/60 space-y-4">
              <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 font-bold">
                <Edit3 className="w-4 h-4" />
                <span>Security Team Triage & Status Transition</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1.5 font-semibold">
                    Update Finding Lifecycle Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as FindingStatus)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="NEW">NEW (Awaiting review)</option>
                    <option value="UNDER REVIEW">UNDER REVIEW (Investigation ongoing)</option>
                    <option value="CONFIRMED">CONFIRMED (Vulnerability verified)</option>
                    <option value="FIXED">FIXED (Defensive guardrail applied)</option>
                    <option value="RESOLVED">RESOLVED (Closed / Verified safe)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1.5 font-semibold">
                    Analyst Triage & Rectification Notes
                  </label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="e.g., Added delimiter fencing; tested against model."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {saveSuccessMsg ? (
                  <span className="text-xs font-mono text-emerald-400 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Finding status & notes saved successfully!</span>
                  </span>
                ) : (
                  <span className="text-xs font-mono text-slate-500">
                    Changes will update the live findings registry
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleSaveStatus}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
                >
                  {isUpdating ? 'Saving...' : 'Update Status & Notes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
