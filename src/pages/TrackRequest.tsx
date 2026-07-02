import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  Clock,
  User,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  FileText,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { cn } from '../lib/utils';
import { API_URL, apiFetch } from '../lib/apiClient';
import { ClientCache } from '../lib/cache';
import { EvaluationReport } from '../components/EvaluationReport';

const stages = [
  { key: 'NEW_LEAD', label: 'Registered', icon: CheckCircle2 },
  { key: 'INSPECTION_PENDING', label: 'Audit Assigned', icon: User },
  { key: 'MANAGER_REVIEW', label: 'Regional Review', icon: Clock },
  { key: 'OFFER_MADE', label: 'Delta Offer', icon: ArrowRight },
  { key: 'ACCEPTED', label: 'Finalized', icon: ShieldCheck },
  { key: 'REJECTED', label: 'Rejected', icon: ShieldAlert },
];

/* ─── Skeleton ────────────────────────────────────────────────────── */
function TrackSkeleton() {
  return (
    <div className="min-h-screen bg-bg pb-24 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.12] bg-[radial-gradient(circle_at_top,rgba(234,88,12,0.18),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.08),transparent_34%)]" />
      <section className="pt-20 sm:pt-24 md:pt-32 pb-8 sm:pb-10 text-center space-y-4 relative z-10">
        <div className="h-11 sm:h-12 w-52 sm:w-56 bg-bg-secondary border border-border/60 rounded-2xl mx-auto animate-pulse" />
        <div className="h-4 w-64 sm:w-72 bg-bg-secondary border border-border/60 rounded-full mx-auto animate-pulse" />
      </section>
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 relative z-10">
        {[1, 2].map(i => (
          <div
            key={i}
            className="rounded-[1.75rem] p-6 sm:p-8 neo-card animate-pulse space-y-6"
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:justify-between">
              <div className="space-y-3">
                <div className="h-3 w-32 bg-border/70 rounded-full" />
                <div className="h-8 w-56 sm:w-64 bg-border/70 rounded-2xl" />
              </div>
              <div className="h-16 w-full sm:w-40 bg-border/70 rounded-2xl" />
            </div>
            <div className="flex justify-between items-center pt-5 border-t border-border/60">
              {[1,2,3,4,5].map(j => (
                <div key={j} className="flex flex-col items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-border/70" />
                  <div className="h-2 w-12 bg-border/70 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TrackRequest() {
  const { session, loading } = useAuth();
  const [results, setResults] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [counterInput, setCounterInput] = useState<Record<string, string>>({});
  const [showCounter, setShowCounter] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  const loadResults = useCallback(() => {
    if (!session) return;
    const url = `${API_URL}/trade-in-requests/customer/${session.user.id}`;
    ClientCache.swr<any>(
      url,
      (data) => {
        const arr = Array.isArray(data) ? data : (data?.data ?? []);
        setResults(arr);
        setFetching(false);
      },
      (err) => {
        console.error('[TrackRequest] Failed to fetch:', err);
        setError(err?.message || 'Unable to load tracked requests.');
        setFetching(false);
      }
    );
  }, [session]);

  useEffect(() => { loadResults(); }, [loadResults]);

  const respondToOffer = async (leadId: string, decision: 'ACCEPT' | 'REJECT' | 'COUNTER') => {
    if (!session) return;
    setSubmitting(p => ({ ...p, [leadId]: true }));
    try {
      const body: any = { decision };
      if (decision === 'COUNTER') {
        const cp = Number(counterInput[leadId]?.replace(/,/g, ''));
        if (!cp || cp <= 0) { alert('Please enter a valid counter-offer price.'); return; }
        body.counterPrice = cp;
      }
      await apiFetch(`/trade-in-requests/${leadId}/respond`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      // Bust cache and reload
      ClientCache.clear();
      setShowCounter(p => ({ ...p, [leadId]: false }));
      loadResults();
    } catch (e: any) {
      alert(e?.message || 'Failed to submit response.');
    } finally {
      setSubmitting(p => ({ ...p, [leadId]: false }));
    }
  };


  if (loading || fetching) return <TrackSkeleton />;

  if (!session) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center space-y-10 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.12] bg-[radial-gradient(circle_at_top,rgba(234,88,12,0.16),transparent_40%)]" />
        <div className="relative z-10 w-full max-w-lg rounded-[2rem] border border-border/60 bg-bg-secondary/90 p-8 sm:p-10 shadow-[0_24px_60px_-35px_rgba(15,23,42,0.35)] space-y-8">
          <div className="w-16 h-16 rounded-2xl mx-auto bg-bg border border-border/60 flex items-center justify-center shadow-sm">
            <ShieldAlert size={34} className="text-text-primary" strokeWidth={1.5} />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-text-primary tracking-tight">
            Authorization Required.
            </h1>
            <p className="text-text-secondary text-base sm:text-lg max-w-sm mx-auto">
              Please sign in to track the status of your vehicle valuations.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
            <Link to="/login">
              <button className="peace-btn-primary w-full py-4 text-[15px]">Sign In</button>
            </Link>
            <Link to="/" className="text-text-secondary text-sm font-medium hover:text-text-primary transition-colors">
              Return to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-28 px-4 sm:px-6 relative overflow-hidden max-md:h-[calc(100vh-120px)] max-md:pb-0 max-md:flex max-md:flex-col max-md:px-0">
      <div className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.12] bg-[radial-gradient(circle_at_top,rgba(234,88,12,0.12),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.05),transparent_30%)]" />
      <section className="pt-20 sm:pt-24 md:pt-32 pb-8 md:pb-14 text-center space-y-4 max-md:pt-4 max-md:pb-3 max-md:shrink-0 max-md:space-y-2 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full neo-inset text-[10px] font-bold uppercase tracking-[0.28em] text-text-secondary mx-auto">
          Track updates
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-text-primary tracking-tight max-md:text-3xl">
          Your Orders.
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-text-secondary max-w-2xl mx-auto max-md:hidden">
          Real-time status of your vehicle valuations and trade-in requests.
        </p>
      </section>

      <div className="max-md:flex-1 max-md:overflow-y-auto max-md:px-4 sm:max-md:px-6 max-md:pb-16 max-md:w-full relative z-10">
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
          {error ? (
            <div className="py-20 sm:py-28 text-center rounded-[1.75rem] space-y-8 neo-card">
              <ShieldAlert size={48} className="mx-auto text-text-muted" strokeWidth={1.5} />
              <div className="space-y-2 px-4">
                <h3 className="text-2xl sm:text-3xl font-semibold text-text-primary tracking-tight">
                  Unable to load your request.
                </h3>
                <p className="text-text-secondary max-w-xs mx-auto">{error}</p>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4">
                <Link to="/login" className="inline-block">
                  <button className="peace-btn-primary px-8">Reauthenticate</button>
                </Link>
                <Link to="/sell" className="inline-block">
                  <button className="peace-btn-secondary px-8">Create a new request</button>
                </Link>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="py-20 sm:py-28 text-center rounded-[1.75rem] space-y-8 neo-card">
              <Clock size={48} className="mx-auto text-text-muted" strokeWidth={1.5} />
              <div className="space-y-2 px-4">
                <h3 className="text-2xl sm:text-3xl font-semibold text-text-primary tracking-tight">
                  No requests found.
                </h3>
                <p className="text-text-secondary max-w-xs mx-auto">
                  When you request a valuation, it will appear here.
                </p>
              </div>
              <Link to="/sell" className="inline-block">
                <button className="peace-btn-primary px-10">Start a Valuation</button>
              </Link>
            </div>
          ) : (
            results.map((result) => {
              const currentStageIdx = stages.findIndex((s) => s.key === result.status);
              const isRejected = result.status === 'REJECTED';

              return (
                <div
                  key={result.id}
                  className="rounded-[1.75rem] p-6 sm:p-8 md:p-10 space-y-8 sm:space-y-10 neo-card transition-transform hover:-translate-y-1 duration-300"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-text-secondary">
                        <span className="px-3 py-1.5 rounded-full neo-inset">
                          ORDER #{result.id.substring(0, 8)}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(result.created_at)
                            .toLocaleDateString('en-US', {
                              month: 'short',
                              day: '2-digit',
                              year: 'numeric',
                            })
                            .toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-text-primary tracking-tight">
                        {result.vehicle_make_model}
                      </h3>
                    </div>
                    {!isRejected && (
                      <div className="text-left md:text-right px-6 py-5 rounded-2xl neo-inset">
                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1">
                          Asking Price
                        </p>
                        <p className="text-2xl md:text-3xl font-black text-accent tracking-tighter">
                          {(result.user_asking_price_etb / 1000000).toFixed(1)}M{' '}
                          <span className="text-base text-text-primary">ETB</span>
                        </p>
                      </div>
                    )}
                    {isRejected && (
                      <div className="text-right">
                        <div className="bg-red-500 text-white font-black text-xs uppercase tracking-widest px-4 py-2 rounded-full shadow-md">
                          REJECTED
                        </div>
                      </div>
                    )}
                  </div>

                  {!isRejected && (
                    <div className="space-y-5 pt-4 border-t border-border/60">
                      <div className="relative px-1">
                        <div className="absolute top-1/2 left-0 w-full h-1.5 bg-bg rounded-full -translate-y-1/2" />
                        <div
                          className="absolute top-1/2 left-0 h-1.5 bg-accent rounded-full -translate-y-1/2 transition-all duration-1000 ease-out shadow-[0_0_10px_var(--color-accent)]"
                          style={{ width: `${(currentStageIdx / (stages.length - 1)) * 100}%` }}
                        />
                        <div className="relative flex justify-between">
                          {stages
                            .filter((s) => s.key !== 'REJECTED')
                            .map((stage, idx) => {
                              const isCompleted = idx <= currentStageIdx;
                              const isCurrent = idx === currentStageIdx;
                              return (
                                <div
                                  key={idx}
                                  className={cn(
                                    'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-500 z-10',
                                    isCompleted ? 'border-border/60 bg-accent' : 'border-border/60 bg-bg',
                                    isCurrent ? 'scale-125 shadow-lg shadow-accent/30' : '',
                                  )}
                                >
                                  {isCompleted && (
                                    <CheckCircle2 size={10} className="text-white" strokeWidth={4} />
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {stages
                          .filter((s) => s.key !== 'REJECTED')
                          .map((stage, idx) => (
                            <div key={idx} className="text-center space-y-2">
                              <p
                                className={cn(
                                  'text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-colors',
                                  idx <= currentStageIdx
                                    ? 'text-text-primary'
                                    : 'text-text-secondary opacity-50',
                                )}
                              >
                                {stage.label}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* ── Offer Response Panel ── */}
                    {['OFFER_MADE', 'NEGOTIATING'].includes(result.status) && result.final_dealer_offer_etb && (
                      <div className="rounded-2xl border border-accent/30 bg-accent/5 overflow-hidden shadow-lg">
                        {/* Header */}
                        <div className="px-6 py-4 bg-accent text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">
                              {result.status === 'NEGOTIATING' ? '⚡ Counter-Offer In Progress' : '🎯 Official Offer Received'}
                            </p>
                            <p className="text-2xl font-black tracking-tight mt-0.5">
                              {Number(result.final_dealer_offer_etb).toLocaleString()} ETB
                            </p>
                          </div>
                          {result.status === 'NEGOTIATING' && (
                            <div className="bg-white/15 rounded-xl px-4 py-2 text-right">
                              <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Your Counter</p>
                              <p className="text-lg font-black">
                                {Number(result.user_asking_price_etb).toLocaleString()} ETB
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="px-6 py-5 space-y-4">
                          {result.status === 'OFFER_MADE' && (
                            <p className="text-sm text-text-secondary">
                              PeaceCars has made a formal offer for your vehicle. Please review and respond.
                            </p>
                          )}
                          {result.status === 'NEGOTIATING' && (
                            <p className="text-sm text-text-secondary">
                              Your counter-offer is under review. You may revise or accept the dealer's price.
                            </p>
                          )}

                          {/* Counter input */}
                          {showCounter[result.id] && (
                            <div className="flex gap-2">
                                <input
                                  type="number"
                                  placeholder="Your counter price (ETB)"
                                  value={counterInput[result.id] || ''}
                                  onChange={e => setCounterInput(p => ({ ...p, [result.id]: e.target.value }))}
                                  className="flex-1 neo-inset rounded-xl px-4 py-3 text-text-primary text-sm font-bold focus:outline-none focus:border-accent"
                                />
                              <button
                                disabled={submitting[result.id]}
                                onClick={() => respondToOffer(result.id, 'COUNTER')}
                                className="px-5 py-3 bg-accent text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-accent-dark transition-all disabled:opacity-50"
                              >
                                {submitting[result.id] ? <Loader2 size={16} className="animate-spin" /> : 'Submit'}
                              </button>
                              <button
                                onClick={() => setShowCounter(p => ({ ...p, [result.id]: false }))}
                                className="px-4 py-3 bg-bg border border-border/60 rounded-xl font-black text-xs text-text-secondary hover:text-text-primary transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          )}

                          {/* Main action row */}
                          {!showCounter[result.id] && (
                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                disabled={submitting[result.id]}
                                onClick={() => respondToOffer(result.id, 'ACCEPT')}
                                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                                style={{ background: 'var(--color-text-primary)', color: 'var(--color-bg)', boxShadow: 'var(--shadow-neo)' }}
                              >
                                {submitting[result.id] ? <Loader2 size={16} className="animate-spin" /> : <ThumbsUp size={16} />}
                                Accept Offer
                              </button>
                              <button
                                disabled={submitting[result.id]}
                                onClick={() => setShowCounter(p => ({ ...p, [result.id]: true }))}
                                className="flex-1 flex items-center justify-center gap-2 py-4 neo-button text-text-primary rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-widest transition-all active:scale-95"
                              >
                                <MessageSquare size={16} />
                                Counter Offer
                              </button>
                              <button
                                disabled={submitting[result.id]}
                                onClick={() => respondToOffer(result.id, 'REJECT')}
                                className="flex-1 flex items-center justify-center gap-2 py-4 neo-button text-red-500 rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                              >
                                <ThumbsDown size={16} />
                                Decline
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── Accepted Banner ── */}
                    {result.status === 'ACCEPTED' && (
                      <div className="flex items-center gap-4 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                        <ShieldCheck size={28} className="text-emerald-500 shrink-0" />
                        <div>
                          <p className="font-black text-emerald-600 tracking-tight">Deal Confirmed!</p>
                          <p className="text-sm text-text-secondary mt-0.5">
                            You accepted the offer of{' '}
                            <strong>{Number(result.final_dealer_offer_etb).toLocaleString()} ETB</strong>.
                            Our team will contact you shortly to finalize paperwork.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ── Appraisal Report ── */}
                    {(result.status === 'OFFER_MADE' || result.status === 'ACCEPTED' || result.status === 'NEGOTIATING') &&
                      result.inspections?.length > 0 && (
                        <div className="flex flex-col md:flex-row items-center justify-between p-5 sm:p-6 bg-text-primary rounded-2xl text-bg gap-6 shadow-xl">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-bg text-text-primary rounded-2xl flex items-center justify-center shadow-inner">
                              <FileText size={28} strokeWidth={2.5} />
                            </div>
                            <div className="space-y-1">
                              <p className="text-lg font-black tracking-tight">Certified Appraisal Receipt</p>
                              <p className="text-[10px] text-bg/70 font-black uppercase tracking-[0.2em]">Official PCS diagnostic dossier</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedLead(result)}
                            className="w-full md:w-auto bg-accent text-white px-8 h-14 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent-dark transition-all shadow-md active:scale-95"
                          >
                            Open Dossier
                          </button>
                        </div>
                      )}

                    {result.dm_notes && (
                      <div className={cn('p-5 sm:p-6 rounded-2xl space-y-3 shadow-sm border', isRejected ? 'bg-red-500 text-white border-red-500/20' : 'bg-bg border-border/60')}>
                        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest opacity-80">
                          {isRejected ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                          Regional Verdict
                        </div>
                        <p className="text-sm leading-relaxed font-medium">{result.dm_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-24 text-center max-md:mt-10">
          <Link to="/inventory">
            <button className="text-accent font-medium hover:underline text-sm">
              ← Return to Showroom
            </button>
          </Link>
        </div>
      </div>

      {selectedLead && (
        <EvaluationReport lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}
    </div>
  );
}
