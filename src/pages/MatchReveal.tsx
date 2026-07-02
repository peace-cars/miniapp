import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { apiClient, API_URL } from '../lib/apiClient';
import { ClientCache } from '../lib/cache';
import { motion } from 'framer-motion';
import { ChevronLeft, Check, X, ShieldAlert, BadgeCheck, AlertTriangle, Play, Banknote, HelpCircle, Clock } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export default function MatchReveal() {
  const { matchId } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [match, setMatch] = useState<any>(null);
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);
  const [voting, setVoting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    if (!session) {
      navigate('/login');
      return;
    }
    
    const fetchMatch = async () => {
      try {
        await ClientCache.swr<any[]>(
          `${API_URL}/sourcing-requests/me`,
          (requests) => {
            if (!requests) return;
            let foundMatch = null;
            let parentRequest = null;
            for (const req of requests) {
              const m = req.matches?.find((m: any) => m.id === matchId);
              if (m) {
                foundMatch = m;
                parentRequest = req;
                break;
              }
            }
            if (foundMatch) {
              setMatch(foundMatch);
              setRequest(parentRequest);
              setLoading(false); // Instantly stop loading on cache hit
            } else {
              if (requests.length > 0) navigate('/sourcing'); // Not found only if we have data
            }
          }
        );
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchMatch();
  }, [session, matchId, navigate]);

  const handleVote = async (action: 'LIKE' | 'REJECT') => {
    if (action === 'REJECT' && !rejectReason && !showRejectModal) {
      setShowRejectModal(true);
      return;
    }
    
    setVoting(true);
    try {
      await apiClient.patch(`/sourcing-requests/matches/${matchId}/vote`, {
        action,
        rejectReason: action === 'REJECT' ? rejectReason : null
      });
      setMatch({ ...match, status: action === 'LIKE' ? 'LIKED' : 'REJECTED' });
      setShowRejectModal(false);
    } catch (err) {
      alert('Failed to submit vote. Please try again.');
    } finally {
      setVoting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* ── LOADING SKELETON HEADER ───────────────────────────────────────── */}
      <div className="sticky top-[64px] z-[100] px-3 max-w-[1400px] mx-auto mt-3 mb-4">
        <div className="h-14 md:h-16 rounded-full border shadow-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>
      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 animate-pulse">
          <div className="h-10 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="aspect-[16/9] w-full bg-gray-200 dark:bg-gray-800 rounded-2xl" />
          <div className="h-64 w-full bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        </div>
        <div className="space-y-6 animate-pulse">
          <div className="h-48 w-full bg-gray-200 dark:bg-gray-800 rounded-2xl" />
          <div className="h-64 w-full bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        </div>
      </div>
    </div>
  );
  if (!match) return null;

  const hoursLeft = Math.max(0, Math.floor((new Date(match.expires_at).getTime() - Date.now()) / (1000 * 60 * 60)));

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>

      {/* ── STICKY HEADER ─────────────────────────────────────────── */}
      <div className="sticky top-[64px] z-[100] px-3 max-w-[1400px] mx-auto mt-3 mb-4">
        <div className="h-14 md:h-16 rounded-full border shadow-lg flex items-center justify-between px-4 md:px-6"
          style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
          <button
            onClick={() => navigate('/sourcing')}
            className="flex items-center gap-2 text-sm font-bold"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <ChevronLeft size={18} /> Back
          </button>
          {match.expires_at && hoursLeft > 0 && hoursLeft < 48 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200">
              <Clock size={13} className="text-red-600" />
              <span className="text-xs font-bold text-red-700 animate-pulse">{hoursLeft}h remaining to secure</span>
            </div>
          )}
          <ShieldAlert size={20} style={{ color: 'var(--color-text-muted)', opacity: 0.4 }} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Photos & Condition Report */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header */}
          <div>
            <h1 className="text-3xl font-black" style={{ color: 'var(--color-text-primary)' }}>{match.year} {match.make} {match.model}</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Curated Match for your {request.make} {request.model} request
            </p>
          </div>

          {/* Media Gallery */}
          <div className="space-y-3">
            <div className="rounded-2xl overflow-hidden border bg-black relative" style={{ borderColor: 'var(--color-border)' }}>
              {match.photos && match.photos.length > 0 ? (
                <div className="aspect-[16/9] w-full">
                  <img src={match.photos[selectedPhotoIdx]} alt="Vehicle" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-[16/9] w-full flex items-center justify-center">
                  <span className="text-white/50">No photos available</span>
                </div>
              )}
              
              {match.video_url && (
                <a href={match.video_url} target="_blank" rel="noreferrer" className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 text-black hover:bg-white transition-colors shadow-lg">
                  <Play size={16} fill="currentColor" /> Watch Walkaround
                </a>
              )}
            </div>

            {/* Thumbnails */}
            {match.photos && match.photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {match.photos.map((photo: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPhotoIdx(idx)}
                    className={`w-20 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === selectedPhotoIdx ? 'border-[var(--color-accent)] opacity-100' : 'border-transparent opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={photo} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Block B: Condition Report (Brutal Honesty) */}
          <div className="rounded-2xl p-6 border shadow-sm" style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <BadgeCheck className="text-blue-500" /> Inspection & Condition
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              We've fully inspected this vehicle. Here is the unvarnished truth.
            </p>

            {/* Diagnostic Checklist */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {Object.entries(match.diagnostic_checklist || {}).map(([key, value]) => (
                <div key={key} className="p-3 rounded-xl border" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
                  <span className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>{key}</span>
                  <span className="text-sm font-bold" style={{ color: value === 'Passed' ? '#10b981' : (value === 'Failed' ? '#ef4444' : 'var(--color-text-primary)') }}>
                    {value as string}
                  </span>
                </div>
              ))}
            </div>

            {/* Imperfections (The "Flaws") */}
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <AlertTriangle size={16} className="text-yellow-500" /> Known Imperfections
            </h3>
            {(!match.imperfections || match.imperfections.length === 0) ? (
              <p className="text-sm italic" style={{ color: 'var(--color-text-muted)' }}>No notable imperfections found. Extremely clean condition.</p>
            ) : (
              <div className="space-y-3">
                {match.imperfections.map((imp: any, i: number) => (
                  <div key={i} className="flex gap-4 p-3 rounded-xl border bg-yellow-50/30" style={{ borderColor: 'var(--color-border)' }}>
                    {imp.photo && (
                      <img src={imp.photo} alt="Flaw" className="w-16 h-16 object-cover rounded-lg shrink-0 border border-yellow-200" />
                    )}
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{imp.desc}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>Our team noted this during the physical inspection. It does not affect mechanical safety.</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Score, Financials & CTA */}
        <div className="space-y-6">
          
          {/* Block A: Match Score & Agent Notes */}
          <div className="rounded-2xl p-6 border shadow-sm relative overflow-hidden" style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black" style={{ color: 'var(--color-text-primary)' }}>Match Score</h2>
              <div className="w-14 h-14 rounded-full flex items-center justify-center border-4" style={{ borderColor: match.match_score >= 90 ? '#10b981' : '#f59e0b', color: match.match_score >= 90 ? '#10b981' : '#f59e0b' }}>
                <span className="text-xl font-bold">{match.match_score}</span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {[
                { label: 'Budget', note: match.budget_note },
                { label: 'Mileage', note: match.mileage_note },
                { label: 'Color', note: match.color_note }
              ].map(item => item.note && (
                <div key={item.label} className="flex items-start gap-2">
                  <Check size={16} className="mt-0.5" style={{ color: 'var(--color-accent)' }} />
                  <div>
                    <span className="text-xs font-bold block" style={{ color: 'var(--color-text-secondary)' }}>{item.label}</span>
                    <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{item.note}</span>
                  </div>
                </div>
              ))}
            </div>

            {match.agent_note && (
              <div className="p-3 rounded-xl border relative" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
                <div className="absolute -top-3 left-4 px-2 text-[10px] font-bold tracking-wider uppercase bg-blue-100 text-blue-700 rounded">Agent Note</div>
                <p className="text-sm italic pt-1" style={{ color: 'var(--color-text-secondary)' }}>"{match.agent_note}"</p>
              </div>
            )}
          </div>

          {/* Block C: Transparent Financials */}
          <div className="rounded-2xl p-6 border shadow-sm" style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-lg font-black mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <Banknote className="text-green-500" /> Out-the-Door Price
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Negotiated Vehicle Price</span>
                <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(match.purchase_price)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Logistics & Transport</span>
                <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(match.logistics_cost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
                  PeaceCars Sourcing Fee
                  <HelpCircle size={12} className="opacity-50" />
                </span>
                <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(match.sourcing_fee)}</span>
              </div>
              <div className="h-px w-full my-2" style={{ background: 'var(--color-border)' }} />
              <div className="flex justify-between text-lg font-black">
                <span style={{ color: 'var(--color-text-primary)' }}>Total Cost</span>
                <span style={{ color: 'var(--color-accent)' }}>{formatCurrency(match.total_otd_cost)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-2xl p-6 border shadow-sm text-center" style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}>
            {match.status === 'PENDING' ? (
              <>
                <p className="text-sm mb-4 font-bold" style={{ color: 'var(--color-text-primary)' }}>Does this vehicle work for you?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleVote('REJECT')}
                    disabled={voting}
                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all hover:bg-red-50 hover:border-red-200"
                    style={{ borderColor: 'var(--color-border)' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100 text-red-600"><X size={20} /></div>
                    <span className="text-sm font-bold text-red-600">Pass</span>
                  </button>
                  <button 
                    onClick={() => handleVote('LIKE')}
                    disabled={voting}
                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all hover:bg-green-50 hover:border-green-200"
                    style={{ borderColor: 'var(--color-accent)' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100 text-green-600"><Check size={20} /></div>
                    <span className="text-sm font-bold text-green-600">I Love It</span>
                  </button>
                </div>
                <p className="text-xs mt-4" style={{ color: 'var(--color-text-muted)' }}>
                  If you pass, we'll keep searching. If you love it, we'll assign a dedicated agent to finalize paperwork.
                </p>
              </>
            ) : (
              <div>
                <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3" style={{ background: match.status === 'LIKED' ? '#d1fae5' : '#fee2e2' }}>
                  {match.status === 'LIKED' ? <Check size={32} className="text-green-600" /> : <X size={32} className="text-red-600" />}
                </div>
                <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  {match.status === 'LIKED' ? 'You secured this match!' : 'You passed on this match.'}
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {match.status === 'LIKED' 
                    ? 'Our team will contact you shortly to finalize the paperwork.' 
                    : 'We noted your feedback and are continuing the search.'}
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-2xl" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Why are you passing?</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>Help us refine our search for you.</p>
            <textarea 
              autoFocus
              className="w-full p-3 rounded-xl text-sm border outline-none resize-none mb-4"
              rows={3}
              placeholder="e.g. Mileage is too high, don't like the color..."
              style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowRejectModal(false)} className="flex-1 py-2 rounded-lg text-sm font-bold border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>Cancel</button>
              <button onClick={() => handleVote('REJECT')} disabled={!rejectReason || voting} className="flex-1 py-2 rounded-lg text-sm font-bold bg-red-600 text-white disabled:opacity-50">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
