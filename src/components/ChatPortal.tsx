import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, MessageCircle, ShieldCheck, Clock, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { API_URL, unwrapApiResponse } from '../lib/apiClient';
import { Link } from 'react-router-dom';

interface ChatPortalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: any;
  userId: string;
}

export default function ChatPortal({ isOpen, onClose, vehicle, userId }: ChatPortalProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  );
  const { session } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (isOpen && session) {
      fetchConversation();
    }
  }, [isOpen, session]);

  useEffect(() => {
    if (conversationId && isOpen) {
      const channel = supabase
        .channel(`portal_messages_${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          () => {
            fetchMessages(conversationId);
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [conversationId, isOpen]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversation = async () => {
    try {
      // Reset state on fetch to avoid stale data between user logins
      setConversationId(null);
      setMessages([]);

      const res = await fetch(`${API_URL}/messages/conversations`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Unauthorized');
      const convs = unwrapApiResponse(await res.json());
      if (Array.isArray(convs)) {
        const existing = convs.find((c: any) => c.vehicle_id === vehicle.id);
        if (existing) {
          setConversationId(existing.id);
          fetchMessages(existing.id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMessages = async (convId: string) => {
    const res = await fetch(`${API_URL}/messages/${convId}`, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = unwrapApiResponse(await res.json());
      setMessages(Array.isArray(data) ? data : []);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !session || isSending) return;

    setIsSending(true);
    const textToSend = inputText;
    setInputText(''); // Optimistically clear input

    try {
      const res = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          conversationId: conversationId,
          vehicleId: vehicle.id,
          text: textToSend,
        }),
      });

      const data = unwrapApiResponse(await res.json());

      if (!res.ok) {
        throw new Error(data?.message || 'Failed to send message');
      }

      setMessages(prev => [...prev, data]);
      if (!conversationId) setConversationId(data.conversation_id);
    } catch (e: any) {
      console.error('Message Send Error:', e);
      setInputText(textToSend); // Restore on failure
      alert(`Failed to send message: ${e.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[240]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 35, stiffness: 300 }}
            className="fixed right-0 w-full bg-white shadow-2xl z-[250] flex flex-col"
            style={isMobile ? {
              top: 60,
              bottom: 0,
              maxWidth: '100%',
            } : {
              top: 0,
              height: '100%',
              maxWidth: '28rem',
            }}
          >
            {/* Header */}
            <div className="p-4 sm:p-6 md:p-8 border-b border-border space-y-4 bg-bg-secondary shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-bg p-2.5 rounded-xl text-text-primary shadow-sm border border-border">
                    <MessageCircle size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary tracking-tight">Support</h3>
                    <p className="text-[10px] text-accent font-bold uppercase tracking-wide flex items-center gap-1">
                      <ShieldCheck size={12} /> Secure Chat
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-bg-secondary rounded-xl text-text-secondary transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <Link
                to={`/messages?vehicleId=${vehicle.id}`}
                onClick={onClose}
                className="inline-flex items-center justify-between gap-2 rounded-2xl border border-border bg-bg px-4 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-secondary"
              >
                <span>Open dedicated page</span>
                <ArrowUpRight size={16} className="text-text-secondary" />
              </Link>

              <div className="bg-bg p-3 rounded-xl flex items-center gap-4 shadow-sm border border-border">
                <img
                  src={
                    vehicle.images?.[0] ||
                    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2070'
                  }
                  className="w-12 h-12 rounded-lg object-cover"
                  alt="Vehicle thumbnail"
                />
                <div className="flex-1">
                  <p className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">
                    Regarding
                  </p>
                  <p className="text-sm font-bold text-text-primary tracking-tight">
                    {vehicle.make} {vehicle.model}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            {!session ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white text-center space-y-6">
                <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center">
                  <ShieldCheck size={32} className="text-accent" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-text-primary tracking-tight">
                    Secure Messaging
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Please sign in to start a secure conversation with our advisors.
                  </p>
                </div>
                <Link
                  to="/login"
                  onClick={onClose}
                  className="bg-accent text-white px-8 py-3.5 rounded-xl font-bold hover:bg-accent/90 transition-all shadow-md w-full"
                >
                  Sign In to Chat
                </Link>
                <p className="text-xs text-text-muted mt-4 flex items-center justify-center gap-1.5">
                  <Clock size={12} /> Typical response: 15 mins
                </p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 no-scrollbar bg-bg">
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-60">
                      <MessageCircle size={32} className="text-accent" />
                      <p className="text-sm font-medium text-text-primary max-w-[12rem]">
                        Connect directly with a PeaceCars advisor
                      </p>
                    </div>
                  )}
                  {messages.map((msg, i) => {
                    const isCustomer = msg.sender_id === userId;
                    const senderName = isCustomer ? 'You' : msg.profiles?.full_name || 'Advisor';
                    return (
                      <div
                        key={i}
                        className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
                        >
                          <span className="text-[11px] font-semibold text-text-secondary mb-1 px-1">
                            {senderName}
                          </span>
                          <div
                            className={`px-4 py-3 rounded-xl text-sm font-medium ${isCustomer ? 'bg-accent text-white rounded-tr-sm' : 'bg-bg-secondary text-text-primary border border-border rounded-tl-sm'}`}
                          >
                            {msg.text}
                          </div>
                          <p className="text-[10px] font-medium text-text-secondary px-1 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 sm:p-6 md:p-8 border-t border-border bg-bg shrink-0 pb-[calc(env(safe-area-inset-bottom,8px)+16px)]">
                  <form onSubmit={handleSendMessage} className="relative">
                    <input
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={isSending ? 'Sending...' : 'Message advisor...'}
                      disabled={isSending}
                      className="w-full bg-bg-secondary border border-border rounded-xl py-3.5 pl-6 pr-14 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all font-medium shadow-sm disabled:opacity-60"
                    />
                    <button
                      type="submit"
                      disabled={isSending || !inputText.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-accent text-white rounded-xl hover:bg-accent/90 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      title={isSending ? 'Sending...' : 'Send'}
                    >
                      {isSending
                        ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <Send size={16} />}
                    </button>
                  </form>
                  <p className="text-[10px] text-center text-text-secondary font-medium mt-4 flex items-center justify-center gap-1.5">
                    <Clock size={12} /> Typical response: 15 mins
                  </p>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
