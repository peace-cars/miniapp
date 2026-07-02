import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  MessageSquare,
  Search,
  Send,
  ShieldCheck,
  User,
  Inbox,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { API_URL, unwrapApiResponse } from '../lib/apiClient';
import { supabase } from '../lib/supabase';

interface Conversation {
  id: string;
  last_message?: string;
  updated_at?: string;
  status?: string;
  vehicles?: { make?: string; model?: string; year?: string | number };
  profiles?: { full_name?: string };
  assigned_staff?: { full_name?: string };
}

interface MessageItem {
  id: string;
  text: string;
  created_at: string;
  sender_id?: string;
  sender_name?: string;
  profiles?: { full_name?: string; role?: string };
}

export default function Messages() {
  const { session } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [mobileMode, setMobileMode] = useState<'list' | 'thread'>(
    searchParams.get('vehicleId') ? 'thread' : 'list',
  );
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false,
  );
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const token = session?.access_token || '';
  const userId = session?.user?.id || '';
  const vehicleId = searchParams.get('vehicleId');

  useEffect(() => {
    if (!isMobile) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobile]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!session) {
      setLoadingConversations(false);
      return;
    }

    fetchConversations();

    const channel = supabase
      .channel('client_messages_conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, vehicleId, isMobile, selectedConvId]);

  useEffect(() => {
    if (!selectedConvId || !session) return;

    fetchMessages(selectedConvId);

    const channel = supabase
      .channel(`client_messages_${selectedConvId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConvId}`,
        },
        () => fetchMessages(selectedConvId),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConvId, session]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      const res = await fetch(`${API_URL}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to load conversations');

      const data = unwrapApiResponse(await res.json());
      const list = Array.isArray(data) ? data : [];
      setConversations(list);

      if (vehicleId) {
        const matching = list.find((conv: any) => String(conv.vehicle_id) === vehicleId);
        if (matching) {
          setSelectedConvId(matching.id);
          setMobileMode('thread');
          return;
        }
      }

      if (!selectedConvId && list[0] && !isMobile) {
        setSelectedConvId(list[0].id);
      }
    } catch (error) {
      console.error(error);
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      setLoadingMessages(true);
      const res = await fetch(`${API_URL}/messages/${convId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to load messages');

      const data = unwrapApiResponse(await res.json());
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConvId || !session) return;

    const textToSend = inputText.trim();
    setInputText('');

    try {
      const res = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: selectedConvId,
          text: textToSend,
        }),
      });

      const data = unwrapApiResponse(await res.json());
      if (!res.ok) throw new Error(data?.message || 'Failed to send message');

      setMessages((prev) => [...prev, data]);
      fetchConversations();
    } catch (error: any) {
      console.error('Message send failed:', error);
      setInputText(textToSend);
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchTerm.trim()) return true;

    const customerName = conv.profiles?.full_name || '';
    const vehicleName = [conv.vehicles?.year, conv.vehicles?.make, conv.vehicles?.model]
      .filter(Boolean)
      .join(' ');
    return (
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.last_message || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const selectedConversation = conversations.find((conv) => conv.id === selectedConvId) || null;

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-bg px-4 sm:px-6 pt-20 sm:pt-24 pb-10">
        <div className="max-w-3xl mx-auto rounded-[2rem] border border-border/60 bg-bg-secondary/90 p-8 sm:p-10 text-center shadow-[0_20px_45px_-35px_rgba(15,23,42,0.35)]">
          <div className="w-16 h-16 rounded-2xl bg-bg border border-border/60 mx-auto mb-6 flex items-center justify-center">
            <ShieldCheck size={34} className="text-text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-text-primary tracking-tight">
            Messages
          </h1>
          <p className="mt-3 text-text-secondary max-w-md mx-auto">
            Sign in to view your conversations and continue with PeaceCars support.
          </p>
          <div className="mt-8 flex justify-center">
            <Link to="/login" className="peace-btn-primary px-8 py-3">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div
        className="fixed inset-x-0 bg-bg overflow-hidden px-4 py-4"
        style={{
          top: 60,
          bottom: 'calc(env(safe-area-inset-bottom, 8px) + 96px)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.12] bg-[radial-gradient(circle_at_top,rgba(234,88,12,0.14),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.05),transparent_32%)]" />
        <div className="relative z-10 h-full">
          {mobileMode === 'list' ? (
            <section className="h-full rounded-[2rem] border border-border/60 bg-bg-secondary/90 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.35)] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-border/60 space-y-4 shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-text-secondary">
                      Inbox
                    </p>
                    <h2 className="text-lg font-bold text-text-primary">Conversations</h2>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-bg border border-border/60 flex items-center justify-center text-text-secondary">
                    <Inbox size={18} />
                  </div>
                </div>

                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search conversations"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border/60 bg-bg text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-border/80 transition-colors"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar">
                {loadingConversations ? (
                  <div className="p-6 space-y-3">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="h-20 rounded-2xl bg-bg animate-pulse" />
                    ))}
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-8 text-center space-y-3">
                    <MessageSquare size={30} className="mx-auto text-text-muted/40" />
                    <h3 className="text-base font-semibold text-text-primary">No conversations yet</h3>
                    <p className="text-sm text-text-secondary max-w-xs mx-auto">
                      Conversations will appear here after you contact the team from a vehicle page.
                    </p>
                    <Link to="/inventory" className="inline-flex mt-2 text-sm font-medium text-text-primary hover:text-text-secondary transition-colors">
                      Browse vehicles
                    </Link>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const vehicleName = [conv.vehicles?.year, conv.vehicles?.make, conv.vehicles?.model]
                      .filter(Boolean)
                      .join(' ');
                    const isActive = conv.id === selectedConvId;

                    return (
                      <button
                        key={conv.id}
                        onClick={() => {
                          setSelectedConvId(conv.id);
                          setMobileMode('thread');
                        }}
                        className={`w-full text-left px-4 py-4 border-b border-border/40 transition-colors ${
                          isActive ? 'bg-bg' : 'hover:bg-bg/70'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${isActive ? 'bg-text-primary text-bg border-text-primary' : 'bg-bg text-text-secondary border-border/60'}`}>
                            <User size={16} />
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="text-sm font-bold text-text-primary truncate">
                                  {conv.profiles?.full_name || 'Customer'}
                                </h3>
                                <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted truncate">
                                  {vehicleName || 'Conversation'}
                                </p>
                              </div>
                              <span className="text-[10px] font-semibold text-text-muted whitespace-nowrap">
                                {conv.updated_at ? timeAgo(conv.updated_at) : ''}
                              </span>
                            </div>
                            <p className="text-[13px] text-text-secondary line-clamp-2">
                              {conv.last_message || 'No messages yet'}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </section>
          ) : (
            <section className="h-full rounded-[2rem] border border-border/60 bg-bg-secondary/90 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.35)] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-border/60 flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setMobileMode('list')}
                  className="w-10 h-10 rounded-2xl bg-bg border border-border/60 flex items-center justify-center text-text-secondary"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-text-secondary">
                    Active thread
                  </p>
                  <h2 className="text-lg font-bold text-text-primary truncate">
                    {[selectedConversation?.vehicles?.year, selectedConversation?.vehicles?.make, selectedConversation?.vehicles?.model]
                      .filter(Boolean)
                      .join(' ') || selectedConversation?.profiles?.full_name || 'Conversation'}
                  </h2>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-bg/35">
                <AnimatePresence initial={false}>
                  {loadingMessages ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((item) => (
                        <div key={item} className={`max-w-[72%] ${item % 2 ? 'ml-auto' : ''}`}>
                          <div className="h-12 rounded-2xl bg-bg animate-pulse" />
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center px-6">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-bg border border-border/60 flex items-center justify-center mb-4">
                        <MessageSquare size={26} className="text-text-muted" />
                      </div>
                      <h3 className="text-xl font-semibold text-text-primary">Start the conversation</h3>
                      <p className="text-sm text-text-secondary max-w-md mt-2">
                        Your replies will appear here. This page keeps the conversation open like a dedicated inbox.
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isMine = message.sender_id === userId;
                      const senderName = isMine ? 'You' : message.profiles?.full_name || 'Advisor';

                      return (
                        <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[82%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted px-1 mb-1">
                              {senderName}
                            </span>
                            <div
                              className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                isMine
                                  ? 'bg-text-primary text-bg rounded-br-md'
                                  : 'bg-bg text-text-primary border border-border/60 rounded-bl-md'
                              }`}
                            >
                              {message.text}
                            </div>
                            <p className="text-[10px] font-medium text-text-muted px-1 mt-1">
                              {new Date(message.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </AnimatePresence>
                <div ref={scrollRef} />
              </div>

              <div className="p-4 border-t border-border/60 bg-bg/70 shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="sr-only" htmlFor="mobile-message-input">
                      Message
                    </label>
                    <input
                      id="mobile-message-input"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Write a message..."
                      className="w-full rounded-2xl border border-border/60 bg-bg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-border/80 transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-text-primary text-bg transition-opacity disabled:opacity-40"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg px-4 sm:px-6 pb-10 pt-20 sm:pt-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.12] bg-[radial-gradient(circle_at_top,rgba(234,88,12,0.14),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.05),transparent_32%)]" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-6">
        <section className="space-y-3 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-bg-secondary/80 text-[10px] font-bold uppercase tracking-[0.28em] text-text-secondary mx-auto sm:mx-0">
            Dedicated inbox
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-semibold text-text-primary tracking-tight">
              Messages
            </h1>
            <p className="text-sm sm:text-base text-text-secondary max-w-2xl">
              Keep every conversation in one place with a full-page inbox built for desktop and mobile.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-5 lg:gap-6 h-[calc(100vh-14rem)] min-h-[500px]">
          <aside className="rounded-[2rem] border border-border/60 bg-bg-secondary/90 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.35)] overflow-hidden flex flex-col h-full">
            <div className="p-4 sm:p-5 border-b border-border/60 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-text-secondary">
                    Inbox
                  </p>
                  <h2 className="text-lg font-bold text-text-primary">Conversations</h2>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-bg border border-border/60 flex items-center justify-center text-text-secondary">
                  <Inbox size={18} />
                </div>
              </div>

              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search conversations"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border/60 bg-bg text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-border/80 transition-colors"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
              {loadingConversations ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-20 rounded-2xl bg-bg animate-pulse" />
                  ))}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <MessageSquare size={30} className="mx-auto text-text-muted/40" />
                  <h3 className="text-base font-semibold text-text-primary">No conversations yet</h3>
                  <p className="text-sm text-text-secondary max-w-xs mx-auto">
                    Conversations will appear here after you contact the team from a vehicle page.
                  </p>
                  <Link to="/inventory" className="inline-flex mt-2 text-sm font-medium text-text-primary hover:text-text-secondary transition-colors">
                    Browse vehicles
                  </Link>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const vehicleName = [conv.vehicles?.year, conv.vehicles?.make, conv.vehicles?.model]
                    .filter(Boolean)
                    .join(' ');
                  const isActive = conv.id === selectedConvId;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConvId(conv.id)}
                      className={`w-full text-left px-4 py-4 border-b border-border/40 transition-colors ${
                        isActive ? 'bg-bg' : 'hover:bg-bg/70'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${isActive ? 'bg-text-primary text-bg border-text-primary' : 'bg-bg text-text-secondary border-border/60'}`}>
                          <User size={16} />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-text-primary truncate">
                                {conv.profiles?.full_name || 'Customer'}
                              </h3>
                              <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted truncate">
                                {vehicleName || 'Conversation'}
                              </p>
                            </div>
                            <span className="text-[10px] font-semibold text-text-muted whitespace-nowrap">
                              {conv.updated_at ? timeAgo(conv.updated_at) : ''}
                            </span>
                          </div>
                          <p className="text-[13px] text-text-secondary line-clamp-2">
                            {conv.last_message || 'No messages yet'}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="rounded-[2rem] border border-border/60 bg-bg-secondary/90 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.35)] overflow-hidden flex flex-col h-full">
            {selectedConversation ? (
              <>
                <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-text-secondary">
                      Active thread
                    </p>
                    <h2 className="text-lg sm:text-xl font-bold text-text-primary truncate">
                      {[selectedConversation.vehicles?.year, selectedConversation.vehicles?.make, selectedConversation.vehicles?.model]
                        .filter(Boolean)
                        .join(' ') || selectedConversation.profiles?.full_name || 'Conversation'}
                    </h2>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-2xl bg-bg border border-border/60 text-[11px] font-semibold text-text-secondary">
                    <Clock size={13} />
                    Live inbox
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 no-scrollbar bg-bg/35">
                  <AnimatePresence initial={false}>
                    {loadingMessages ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((item) => (
                          <div key={item} className={`max-w-[72%] ${item % 2 ? 'ml-auto' : ''}`}>
                            <div className="h-12 rounded-2xl bg-bg animate-pulse" />
                          </div>
                        ))}
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center px-6">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-bg border border-border/60 flex items-center justify-center mb-4">
                          <MessageSquare size={26} className="text-text-muted" />
                        </div>
                        <h3 className="text-xl font-semibold text-text-primary">Start the conversation</h3>
                        <p className="text-sm text-text-secondary max-w-md mt-2">
                          Your replies will appear here. This page keeps the conversation open like a dedicated inbox.
                        </p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isMine = message.sender_id === userId;
                        const senderName = isMine ? 'You' : message.profiles?.full_name || 'Advisor';

                        return (
                          <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[82%] sm:max-w-[70%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted px-1 mb-1">
                                {senderName}
                              </span>
                              <div
                                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                  isMine
                                    ? 'bg-text-primary text-bg rounded-br-md'
                                    : 'bg-bg text-text-primary border border-border/60 rounded-bl-md'
                                }`}
                              >
                                {message.text}
                              </div>
                              <p className="text-[10px] font-medium text-text-muted px-1 mt-1">
                                {new Date(message.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </AnimatePresence>
                  <div ref={scrollRef} />
                </div>

                <div className="p-4 sm:p-5 border-t border-border/60 bg-bg/70">
                  <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="sr-only" htmlFor="message-input">
                        Message
                      </label>
                      <input
                        id="message-input"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Write a message..."
                        className="w-full rounded-2xl border border-border/60 bg-bg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-border/80 transition-colors"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!inputText.trim()}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-text-primary text-bg transition-opacity disabled:opacity-40"
                    >
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
                <div className="w-16 h-16 rounded-[1.5rem] bg-bg border border-border/60 flex items-center justify-center mb-4">
                </div>
                <h3 className="text-xl font-semibold text-text-primary">Pick a conversation</h3>
                <p className="text-sm text-text-secondary max-w-md mt-2">
                  Select a thread from the inbox to view messages in a dedicated page layout.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}