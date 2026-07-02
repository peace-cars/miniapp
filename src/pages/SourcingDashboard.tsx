import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { API_URL } from '../lib/apiClient';
import { ClientCache } from '../lib/cache';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Clock, CheckCircle, Search, ChevronRight, AlertCircle, ShieldAlert } from 'lucide-react';

interface SourcingMatch {
  id: string;
  make: string;
  model: string;
  year: number;
  match_score: number;
  status: string;
  expires_at: string;
  photos: string[];
}

interface SourcingRequest {
  id: string;
  make: string;
  model: string;
  status: string;
  created_at: string;
  matches: SourcingMatch[];
}

/* ─── Skeleton ────────────────────────────────────────────────────── */
function SourcingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-end justify-between border-b pb-4" style={{ borderColor: 'var(--color-border)' }}>
        <div className="space-y-2 animate-pulse">
          <div className="h-7 w-56 rounded-lg" style={{ background: 'var(--color-border)' }} />
          <div className="h-4 w-80 rounded" style={{ background: 'var(--color-border)' }} />
        </div>
        <div className="h-9 w-28 rounded-lg animate-pulse" style={{ background: 'var(--color-border)' }} />
      </div>
      <div className="space-y-6">
        {[1, 2].map(i => (
          <div key={i} className="rounded-2xl p-6 border animate-pulse" style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}>
            <div className="flex justify-between mb-6">
              <div className="space-y-2">
                <div className="h-6 w-40 rounded" style={{ background: 'var(--color-border)' }} />
                <div className="h-3 w-32 rounded" style={{ background: 'var(--color-border)' }} />
              </div>
            </div>
            <div className="flex justify-between items-center mb-8 px-6">
              {[1,2,3,4,5].map(j => (
                <div key={j} className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full" style={{ background: 'var(--color-border)' }} />
                  <div className="h-2 w-14 rounded" style={{ background: 'var(--color-border)' }} />
                </div>
              ))}
            </div>
            <div className="mt-10 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
              <div className="h-4 w-32 rounded mb-4" style={{ background: 'var(--color-border)' }} />
              <div className="grid grid-cols-2 gap-4">
                {[1,2].map(j => (
                  <div key={j} className="h-32 rounded-xl" style={{ background: 'var(--color-border)' }} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SourcingDashboard() {
  const { session } = useAuth();
  const navigate = useNavigate();
  // Pre-read cache synchronously — no skeleton on back-navigation
  const _cached = ClientCache.get<SourcingRequest[]>(`${API_URL}/sourcing-requests/me`);
  const [requests, setRequests] = useState<SourcingRequest[]>(_cached || []);
  const [loading, setLoading] = useState(!_cached);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      navigate('/login');
      return;
    }

    ClientCache.swr<SourcingRequest[]>(
      `${API_URL}/sourcing-requests/me`,
      (data) => {
        setRequests(Array.isArray(data) ? data : []);
        setLoading(false); // instant on cache hit
      },
      (err) => {
        console.error('[SourcingDashboard]', err);
        setError(err?.message || 'Failed to load sourcing requests.');
        setLoading(false);
      }
    );
  }, [session, navigate]);

  const getStatusStage = (status: string) => {
    const stages = ['SUBMITTED', 'SEARCHING', 'INSPECTING', 'NEGOTIATING', 'READY'];
    const idx = stages.indexOf(status);
    return idx === -1 ? 0 : idx;
  };

  if (loading) return <SourcingSkeleton />;

  if (error) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <ShieldAlert size={48} className="mx-auto mb-4 opacity-40" style={{ color: 'var(--color-text-muted)' }} />
      <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Could not load requests</h3>
      <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
      <button onClick={() => window.location.reload()} className="px-6 py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: 'var(--color-accent)' }}>
        Retry
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-end justify-between border-b pb-4" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <h1 className="text-2xl md:text-3xl font-black" style={{ color: 'var(--color-text-primary)' }}>My Sourcing Pipeline</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Track your active vehicle requests and curated matches.</p>
        </div>
        <Link to="/custom-sourcing" className="px-4 py-2 rounded-lg text-sm font-bold text-white shadow-md transition-transform hover:scale-105" style={{ background: 'var(--color-accent)' }}>
          + New Request
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-secondary)' }}>
          <Car size={48} className="mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>No active requests</h3>
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>Start a custom sourcing request and let us find your perfect car.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {requests.map(req => {
            const stage = getStatusStage(req.status);
            const pendingMatches = req.matches?.filter(m => m.status === 'PENDING') || [];

            return (
              <div key={req.id} className="rounded-2xl p-4 md:p-5 shadow-sm border" style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}>
                <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{req.make} {req.model}</h2>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Requested on {new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                  
                  {pendingMatches.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-50 border border-yellow-200">
                      <AlertCircle size={16} className="text-yellow-600" />
                      <span className="text-xs font-bold text-yellow-700">{pendingMatches.length} Match{pendingMatches.length > 1 ? 'es' : ''} Awaiting Review!</span>
                    </div>
                  )}
                </div>

                {/* Status Pipeline */}
                <div className="relative flex justify-between items-center mb-8 px-2 sm:px-6">
                  <div className="absolute left-6 right-6 top-1/2 h-1 -z-10 rounded-full" style={{ background: 'var(--color-bg-secondary)' }}></div>
                  <div className="absolute left-6 top-1/2 h-1 -z-10 rounded-full transition-all duration-700" style={{ background: 'var(--color-accent)', width: `calc(${stage * 25}% - 12px)` }}></div>

                  {['Submitted', 'Searching', 'Inspecting', 'Negotiating', 'Ready'].map((label, idx) => {
                    const isCompleted = stage >= idx;
                    const isCurrent = stage === idx;
                    return (
                      <div key={label} className="flex flex-col items-center gap-2 relative z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm`}
                             style={{ 
                               background: isCompleted ? 'var(--color-accent)' : 'var(--color-bg)', 
                               border: `2px solid ${isCompleted ? 'var(--color-accent)' : 'var(--color-border)'}`,
                               color: isCompleted ? 'white' : 'var(--color-text-muted)'
                             }}>
                          {isCompleted ? <CheckCircle size={16} /> : <div className="w-2 h-2 rounded-full" style={{ background: 'var(--color-border)' }} />}
                        </div>
                        <span className={`text-[10px] sm:text-xs font-bold absolute -bottom-6 whitespace-nowrap`} 
                              style={{ color: isCurrent ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Matches Section */}
                {req.matches && req.matches.length > 0 && (
                  <div className="mt-8 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
                    <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>Curated Matches</h3>
                    <div className="flex flex-col gap-3">
                      {req.matches.map(match => (
                        <Link key={match.id} to={`/sourcing/match/${match.id}`} className="group flex items-center gap-3 rounded-xl overflow-hidden border p-2 transition-all hover:shadow-md" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
                          <div className="w-24 h-20 sm:w-32 sm:h-24 bg-gray-200 relative rounded-lg overflow-hidden shrink-0">
                            {match.photos && match.photos.length > 0 ? (
                              <img src={match.photos[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Car size={24} className="opacity-20" /></div>
                            )}
                            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold backdrop-blur-sm">
                              {match.match_score}%
                            </div>
                            {match.status === 'PENDING' && (
                              <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-red-500 text-white text-[9px] font-bold shadow-md animate-pulse">
                                Review
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 flex items-center justify-between">
                            <div className="min-w-0 pr-2">
                              <p className="text-[13px] sm:text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>{match.year} {match.make} {match.model}</p>
                              <p className="text-[11px] font-medium mt-1" style={{ color: match.status === 'PENDING' ? 'var(--color-text-secondary)' : (match.status === 'LIKED' ? '#10b981' : '#ef4444') }}>
                                {match.status === 'PENDING' ? 'Awaiting your review' : `Status: ${match.status}`}
                              </p>
                            </div>
                            <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} className="group-hover:text-blue-500 shrink-0" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
