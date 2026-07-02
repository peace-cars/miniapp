import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, ThumbsUp, Send, Users, Zap, Image as ImageIcon,
  Video, X, Plus, Loader2, ChevronDown, TrendingUp, Clock, Calendar, MapPin,
  MoreHorizontal, Pencil, Trash2, Tag, Hash
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { apiClient, API_URL } from '../lib/apiClient';
import { ClientCache } from '../lib/cache';
import { ImageCarousel } from '../components/ui/ImageCarousel';
import { ProgressiveImage } from '../components/ui/ProgressiveImage';
import { supabase } from '../lib/supabase';

/* ─── Types ─────────────────────────────────────────────────────── */
interface Post {
  id: string;
  title: string;
  content: string;
  upvotes: number;
  created_at: string;
  updated_at?: string;
  is_edited?: boolean;
  images?: string[];
  youtube_url?: string;
  post_type?: string;
  tags?: string[];
  user_id?: string;
  profiles?: { full_name: string; avatar_url?: string; username?: string };
  community_comments?: [{ count: number }];
}

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location?: string;
  cover_image?: string;
  event_type?: string;
  rsvp_count: number;
  created_at: string;
  user_id?: string;
  profiles?: { full_name: string; avatar_url?: string; username?: string };
}

type MainTab = 'feed' | 'events';
type FilterTab = 'latest' | 'trending';

/* ─── YouTube helpers ───────────────────────────────────────────── */
function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function YouTubeEmbed({ url }: { url: string }) {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return (
    <div className="aspect-video rounded-xl overflow-hidden bg-black mt-3">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        title="YouTube"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full border-0"
      />
    </div>
  );
}

/* ─── Image compressor (client-side, reuse pattern) ─────────────── */
function compressImage(file: File, maxWidth = 1280): Promise<File> {
  return new Promise<File>((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result !== 'string') {
        resolve(file);
        return;
      }
      const img = new window.Image();
      img.src = result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = maxWidth / img.width;
        const w = scale < 1 ? maxWidth : img.width;
        const h = scale < 1 ? img.height * scale : img.height;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob((blob) => {
            blob
              ? resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), { type: 'image/webp' }))
              : resolve(file);
          }, 'image/webp', 0.82);
        } else {
          resolve(file);
        }
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

/* ─── Main Component ────────────────────────────────────────────── */
export const Community: React.FC = () => {
  const { session } = useAuth();
  const user = session?.profile;
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<MainTab>('feed');

  // Feed State — pre-populate from cache to avoid skeleton on back-navigation
  const rawCachedPosts = ClientCache.get<any>(`${API_URL}/community/posts`);
  const _cachedPosts = Array.isArray(rawCachedPosts) ? rawCachedPosts : (rawCachedPosts?.data ?? []);
  const [posts, setPosts] = useState<Post[]>(_cachedPosts);
  const [isFeedLoading, setIsFeedLoading] = useState(_cachedPosts.length === 0);
  const [filter, setFilter] = useState<FilterTab>('latest');
  const [displayCount, setDisplayCount] = useState(10);

  // Events State — pre-populate from cache
  const rawCachedEvents = ClientCache.get<any>(`${API_URL}/community/events`);
  const _cachedEvents = Array.isArray(rawCachedEvents) ? rawCachedEvents : (rawCachedEvents?.data ?? []);
  const [events, setEvents] = useState<Event[]>(_cachedEvents);
  const [isEventsLoading, setIsEventsLoading] = useState(_cachedEvents.length === 0);

  // Post Compose State
  const [showCompose, setShowCompose] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // Tag filter
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

  // Edit/Delete state
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Event Compose State
  const [showEventCompose, setShowEventCompose] = useState(false);
  const [isEventPosting, setIsEventPosting] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
  const [eventImagePreview, setEventImagePreview] = useState<string | null>(null);
  const eventFileRef = useRef<HTMLInputElement>(null);

  // Infinite Scroll Ref
  const observerRef = useRef<IntersectionObserver | null>(null);
  const bottomRef = useCallback((node: HTMLDivElement | null) => {
    if (isFeedLoading) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setDisplayCount(prev => prev + 10);
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [isFeedLoading]);

  useEffect(() => { 
    if (activeTab === 'feed') fetchPosts();
    if (activeTab === 'events') fetchEvents();

    const unsubPosts = ClientCache.subscribe<any>(`${API_URL}/community/posts`, (data) => {
      const arr = Array.isArray(data) ? data : (data?.data ?? []);
      setPosts(arr);
    });
    return () => unsubPosts();
  }, [activeTab]);

  const fetchPosts = async () => {
    setIsFeedLoading(true);
    try {
      await ClientCache.swr<any>(
        `${API_URL}/community/posts`,
        (data) => {
          const arr = Array.isArray(data) ? data : (data?.data ?? []);
          setPosts(arr);
          if (arr.length > 0) setIsFeedLoading(false);
        }
      );
    } catch (e) {
      console.error('Failed to fetch posts:', e);
    } finally {
      setIsFeedLoading(false);
    }
  };

  const fetchEvents = async () => {
    setIsEventsLoading(true);
    try {
      await ClientCache.swr<any>(
        `${API_URL}/community/events`,
        (data) => {
          const arr = Array.isArray(data) ? data : (data?.data ?? []);
          setEvents(arr);
          if (arr.length > 0) setIsEventsLoading(false);
        }
      );
    } catch (e) {
      console.error('Failed to fetch events:', e);
    } finally {
      setIsEventsLoading(false);
    }
  };

  const sortedPosts = (() => {
    let list = filter === 'trending'
      ? [...posts].sort((a, b) => b.upvotes - a.upvotes)
      : posts;
    if (activeTagFilter) {
      list = list.filter(p => p.tags?.includes(activeTagFilter));
    }
    return list;
  })();

  // Collect all tags from posts for filter bar
  const allTags = Array.from(new Set(posts.flatMap(p => p.tags || [])));

  /* ── Post Image picker ── */
  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (imageFiles.length + files.length > 4) return;
    const compressed: File[] = [];
    const previews: string[] = [];
    for (const f of files) {
      const c = await compressImage(f);
      compressed.push(c);
      previews.push(URL.createObjectURL(c));
    }
    setImageFiles(prev => [...prev, ...compressed]);
    setImagePreviews(prev => [...prev, ...previews]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeImage = (idx: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  /* ── Event Image picker ── */
  const handleEventImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const c = await compressImage(file);
    setEventImageFile(c);
    setEventImagePreview(URL.createObjectURL(c));
    if (eventFileRef.current) eventFileRef.current.value = '';
  };

  /* ── Submit Post ── */
  const handlePostSubmit = async () => {
    if (!user) { navigate('/login'); return; }
    if (!title.trim() || !content.trim()) return;
    setIsPosting(true);

    try {
      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'webp';
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${ext}`;
        const filePath = `posts/${fileName}`;
        const arrayBuffer = await file.arrayBuffer();
        const { error: uploadError } = await supabase.storage
          .from('community')
          .upload(filePath, arrayBuffer, { contentType: file.type || 'image/webp' });
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('community').getPublicUrl(filePath);
          uploadedUrls.push(publicUrl);
        }
      }

      const payload: any = { title, content, post_type: 'discussion' };
      if (uploadedUrls.length > 0) payload.images = uploadedUrls;
      if (youtubeUrl.trim()) payload.youtube_url = youtubeUrl.trim();

      const data = await apiClient.post<Post>('/community/posts', payload);
      // Wait to merge complete info because data contains full profiles
      setPosts([data, ...posts]);

      setShowCompose(false);
      setTitle('');
      setContent('');
      setYoutubeUrl('');
      setImageFiles([]);
      setImagePreviews([]);
      setShowYoutubeInput(false);
    } catch (e) {
      console.error('Failed to post:', e);
    } finally {
      setIsPosting(false);
    }
  };

  /* ── Submit Event ── */
  const handleEventSubmit = async () => {
    if (!user) { navigate('/login'); return; }
    if (!eventTitle.trim() || !eventDesc.trim() || !eventDate) return;
    setIsEventPosting(true);

    try {
      let coverUrl = '';
      if (eventImageFile) {
        const ext = eventImageFile.name.split('.').pop()?.toLowerCase() || 'webp';
        const fileName = `events/${Math.random().toString(36).substring(2)}-${Date.now()}.${ext}`;
        const arrayBuffer = await eventImageFile.arrayBuffer();
        const { error } = await supabase.storage
          .from('community')
          .upload(fileName, arrayBuffer, { contentType: eventImageFile.type || 'image/webp' });
        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from('community').getPublicUrl(fileName);
          coverUrl = publicUrl;
        }
      }

      const payload = {
        title: eventTitle,
        description: eventDesc,
        event_date: new Date(eventDate).toISOString(),
        location: eventLocation,
        cover_image: coverUrl
      };

      const data = await apiClient.post<Event>('/community/events', payload);
      setEvents(prev => [...prev, data].sort((a,b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()));

      setShowEventCompose(false);
      setEventTitle('');
      setEventDesc('');
      setEventDate('');
      setEventLocation('');
      setEventImageFile(null);
      setEventImagePreview(null);
    } catch (e) {
      console.error('Failed to create event:', e);
    } finally {
      setIsEventPosting(false);
    }
  };

  /* ── Post Upvote ── */
  const handleUpvote = async (id: string) => {
    setPosts(posts.map(p => p.id === id ? { ...p, upvotes: p.upvotes + 1 } : p));
    try {
      await apiClient.post(`/community/posts/${id}/upvote`, {});
    } catch {
      fetchPosts();
    }
  };

  /* ── Event RSVP ── */
  const handleRSVP = async (id: string) => {
    if (!user) { navigate('/login'); return; }
    setEvents(events.map(e => e.id === id ? { ...e, rsvp_count: e.rsvp_count + 1 } : e));
    try {
      await apiClient.post(`/community/events/${id}/rsvp`, {});
    } catch {
      fetchEvents();
    }
  };

  const timeAgo = (d: string) => {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  /* ── Edit Post ── */
  const handleEditPost = async () => {
    if (!editingPost) return;
    try {
      const updated = await apiClient.patch<Post>(`/community/posts/${editingPost.id}`, {
        title: editTitle,
        content: editContent,
      });
      setPosts(posts.map(p => p.id === editingPost.id ? { ...p, ...updated } : p));
      setEditingPost(null);
    } catch (e) {
      console.error('Failed to edit post:', e);
    }
  };

  /* ── Delete Post ── */
  const handleDeletePost = async (id: string) => {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    try {
      await apiClient.delete(`/community/posts/${id}`);
      setPosts(posts.filter(p => p.id !== id));
    } catch (e) {
      console.error('Failed to delete post:', e);
    }
    setMenuOpenId(null);
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--color-bg)' }}>

      {/* ── STICKY TOP HEADER (Floating Pill) ─────────────────────────────────── */}
      <div className="sticky top-4 z-[100] px-3 md:px-8 max-w-[1400px] mx-auto pointer-events-none transition-all mb-4">
        <div
          className="mx-auto flex items-center justify-between px-2 py-1.5 rounded-full pointer-events-auto transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] border"
          style={{
            background: 'var(--color-bg-secondary)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderColor: 'var(--color-border)',
          }}
        >
          <button
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95 shrink-0"
            style={{ color: 'var(--color-text-primary)' }}
            aria-label="Go back"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <div className="flex flex-1 items-center justify-center gap-1 min-w-0 px-2">
            <button
              onClick={() => setActiveTab('feed')}
              className="px-4 py-2 rounded-full text-[13px] font-bold transition-all shrink-0"
              style={{
                background: activeTab === 'feed' ? 'var(--color-accent)' : 'transparent',
                color: activeTab === 'feed' ? '#fff' : 'var(--color-text-secondary)',
              }}
            >
              Feed
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className="px-4 py-2 rounded-full text-[13px] font-bold transition-all shrink-0"
              style={{
                background: activeTab === 'events' ? 'var(--color-accent)' : 'transparent',
                color: activeTab === 'events' ? '#fff' : 'var(--color-text-secondary)',
              }}
            >
              Events
            </button>
          </div>

          <button
            onClick={() => user ? navigate('/profile') : navigate('/login')}
            className="w-10 h-10 rounded-full overflow-hidden shrink-0 transition-transform active:scale-95 border-2 flex items-center justify-center"
            style={{ borderColor: 'transparent', background: 'var(--color-bg)' }}
            aria-label={user ? 'Open profile' : 'Sign in'}
          >
            {user ? (
              <UserAvatar name={user?.full_name} avatar_url={user?.avatar_url} size={36} />
            ) : (
              <Users size={16} className="text-gray-500" />
            )}
          </button>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto px-4">
        {activeTab === 'feed' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>

            {/* ── Tag Filter Bar ── */}
            {allTags.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-4 -mx-1 px-1 scrollbar-hide">
                <button
                  onClick={() => setActiveTagFilter(null)}
                  className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-colors ${!activeTagFilter ? 'bg-accent text-white' : 'bg-surface-hover text-text-secondary border border-border'}`}
                >
                  All
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
                    className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-colors ${activeTagFilter === tag ? 'bg-accent text-white' : 'bg-surface-hover text-text-secondary border border-border'}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {/* ── Edit Post Modal ── */}
            <AnimatePresence>
              {editingPost && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                  onClick={() => setEditingPost(null)}
                >
                  <motion.div
                    initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                    onClick={e => e.stopPropagation()}
                    className="w-full max-w-lg rounded-2xl p-6"
                    style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
                  >
                    <h2 className="text-xl font-black mb-4" style={{ color: 'var(--color-text-primary)' }}>Edit Post</h2>
                    <input
                      type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-base font-bold outline-none mb-3"
                      style={{ background: 'var(--color-bg)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                    />
                    <textarea
                      value={editContent} onChange={e => setEditContent(e.target.value)} rows={5}
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                      style={{ background: 'var(--color-bg)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                    />
                    <div className="flex gap-2 pt-4">
                      <button onClick={() => setEditingPost(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}>Cancel</button>
                      <button onClick={handleEditPost} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: 'var(--color-accent)' }}>Save Changes</button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Feed List ── */}
            {isFeedLoading ? (
              <div className="space-y-5 pb-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="rounded-2xl overflow-hidden shadow-sm" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                    <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                      <div className="w-10 h-10 rounded-full animate-pulse" style={{ background: 'var(--color-border)' }} />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-1/3 rounded animate-pulse" style={{ background: 'var(--color-border)' }} />
                        <div className="h-2.5 w-1/4 rounded animate-pulse" style={{ background: 'var(--color-border)' }} />
                      </div>
                    </div>
                    <div className="px-4 pb-3 space-y-2.5 mt-1">
                      <div className="h-4 w-3/4 rounded animate-pulse" style={{ background: 'var(--color-border)' }} />
                      <div className="h-3 w-full rounded animate-pulse" style={{ background: 'var(--color-border)' }} />
                      <div className="h-3 w-5/6 rounded animate-pulse" style={{ background: 'var(--color-border)' }} />
                    </div>
                    {i === 1 && (
                       <div className="w-full aspect-[4/5] animate-pulse" style={{ background: 'var(--color-border)', opacity: 0.5 }} />
                    )}
                    <div className="flex items-center gap-4 px-4 py-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                      <div className="h-4 w-16 rounded animate-pulse" style={{ background: 'var(--color-border)' }} />
                      <div className="h-4 w-24 rounded animate-pulse" style={{ background: 'var(--color-border)' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedPosts.length === 0 ? (
              <div className="text-center py-20 rounded-2xl" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                <MessageCircle size={40} className="mx-auto mb-3" style={{ color: 'var(--color-text-muted)', opacity: 0.4 }} />
                <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>No discussions yet</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Be the first to start a conversation.</p>
              </div>
            ) : (
              <div className="space-y-4 md:space-y-6">
                <AnimatePresence mode="popLayout">
                  {sortedPosts.slice(0, displayCount).map((post, idx) => (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.04, 0.3) }}
                    className="rounded-3xl overflow-hidden shadow-[0_18px_45px_-32px_rgba(15,23,42,0.32)]"
                    style={{ background: 'var(--color-bg-secondary)' }}
                  >
                    <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                      <div className="flex-1 flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => post.user_id && navigate(`/u/${post.user_id}`)}>
                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-border bg-bg-tertiary">
                          {post.profiles?.avatar_url ? (
                            <ProgressiveImage src={post.profiles.avatar_url} alt="" className="w-full h-full" />
                          ) : (
                            <div className="w-full h-full neo-card flex items-center justify-center text-text-secondary text-sm font-bold">
                              {post.profiles?.full_name?.charAt(0) || post.profiles?.username?.charAt(0) || '?'}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[15px] font-bold truncate hover:underline" style={{ color: 'var(--color-text-primary)' }}>
                            {post.profiles?.full_name || 'Anonymous'} {post.profiles?.username && <span className="text-xs font-normal" style={{color: 'var(--color-text-muted)'}}>@{post.profiles.username}</span>}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            {timeAgo(post.created_at)}{post.is_edited && ' · edited'}
                          </p>
                        </div>
                      </div>

                      {/* Author Actions Menu */}
                      {user && post.user_id === session?.user?.id && (
                        <div className="relative">
                          <button
                            onClick={() => setMenuOpenId(menuOpenId === post.id ? null : post.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-surface-hover"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            <MoreHorizontal size={18} />
                          </button>
                          <AnimatePresence>
                            {menuOpenId === post.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute right-0 top-10 z-50 w-40 rounded-xl shadow-xl overflow-hidden"
                                style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
                              >
                                <button
                                  onClick={() => { setEditingPost(post); setEditTitle(post.title); setEditContent(post.content); setMenuOpenId(null); }}
                                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-left hover:bg-surface-hover transition-colors"
                                  style={{ color: 'var(--color-text-primary)' }}
                                >
                                  <Pencil size={14} /> Edit Post
                                </button>
                                <button
                                  onClick={() => handleDeletePost(post.id)}
                                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-left hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-red-500"
                                >
                                  <Trash2 size={14} /> Delete Post
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>

                    <div className="cursor-pointer" onClick={() => navigate(`/community/post/${post.id}`)}>
                      <div className="px-4 pb-3">
                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {post.tags.map(tag => (
                              <span
                                key={tag}
                                onClick={(e) => { e.stopPropagation(); setActiveTagFilter(tag); }}
                                className="px-2 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-colors"
                                style={{ background: 'var(--color-accent-light, rgba(99,102,241,0.1))', color: 'var(--color-accent)' }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <h3 className="text-base font-bold mb-1.5 leading-snug" style={{ color: 'var(--color-text-primary)' }}>{post.title}</h3>
                        <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text-primary)', opacity: 0.85 }}>
                          {post.content}
                        </p>
                      </div>

                      {post.images && post.images.length > 0 && (
                        <ImageCarousel images={post.images} />
                      )}

                      {post.youtube_url && (
                        <div className="px-4 pb-3 mt-2">
                          <YouTubeEmbed url={post.youtube_url} />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 px-4 py-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                      <button onClick={() => handleUpvote(post.id)} className="flex items-center gap-1.5 text-sm font-bold transition-all active:scale-90" style={{ color: post.upvotes > 0 ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}>
                        <ThumbsUp size={18} /> {post.upvotes > 0 ? post.upvotes : 'Like'}
                      </button>
                      <button onClick={() => navigate(`/community/post/${post.id}`)} className="flex items-center gap-1.5 text-sm font-bold transition-all" style={{ color: 'var(--color-text-secondary)' }}>
                        <MessageCircle size={18} /> {post.community_comments?.[0]?.count || 0} Comments
                      </button>
                    </div>
                  </motion.article>
                ))}
                </AnimatePresence>
                {displayCount < sortedPosts.length && (
                  <div ref={bottomRef} className="h-20 w-full flex items-center justify-center">
                    <Loader2 className="animate-spin text-text-secondary" size={24} />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'events' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            <div className="flex items-center justify-between py-2 mb-4">
              <h2 className="text-lg font-black" style={{ color: 'var(--color-text-primary)' }}>Upcoming Events</h2>
            </div>

            {/* ── Events List ── */}
            {isEventsLoading ? (
              <div className="grid sm:grid-cols-2 gap-4 pb-8">
                {[1, 2].map(i => (
                  <div key={i} className="rounded-2xl overflow-hidden flex flex-col shadow-sm" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                    <div className="aspect-video relative animate-pulse" style={{ background: 'var(--color-border)', opacity: 0.5 }}>
                      <div className="absolute top-3 left-3 w-12 h-14 rounded-xl bg-white/20 backdrop-blur" />
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex-1 space-y-3">
                        <div className="h-5 w-3/4 rounded animate-pulse" style={{ background: 'var(--color-border)' }} />
                        <div className="h-3 w-1/2 rounded animate-pulse" style={{ background: 'var(--color-border)' }} />
                        <div className="space-y-2 mt-4">
                          <div className="h-3 w-full rounded animate-pulse" style={{ background: 'var(--color-border)' }} />
                          <div className="h-3 w-4/5 rounded animate-pulse" style={{ background: 'var(--color-border)' }} />
                        </div>
                      </div>
                      <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--color-border)' }}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full animate-pulse" style={{ background: 'var(--color-border)' }} />
                          <div className="h-2.5 w-20 rounded animate-pulse" style={{ background: 'var(--color-border)' }} />
                        </div>
                        <div className="h-8 w-20 rounded-lg animate-pulse" style={{ background: 'var(--color-border)' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-20 rounded-3xl" style={{ background: 'var(--color-bg-secondary)' }}>
                <Calendar size={40} className="mx-auto mb-3" style={{ color: 'var(--color-text-muted)', opacity: 0.4 }} />
                <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>No upcoming events</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Check back later or host your own.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4 pb-8">
                {events.map((ev, idx) => {
                  const dateObj = new Date(ev.event_date);
                  const isPast = dateObj.getTime() < Date.now();
                  return (
                    <motion.div
                      key={ev.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group rounded-3xl overflow-hidden flex flex-col shadow-[0_18px_45px_-32px_rgba(15,23,42,0.32)]"
                      style={{ background: 'var(--color-bg-secondary)', opacity: isPast ? 0.72 : 1 }}
                    >
                      {/* Cover */}
                      <div className="relative w-full h-48 sm:h-56 overflow-hidden bg-bg-tertiary">
                        {ev.cover_image ? (
                          <ProgressiveImage src={ev.cover_image} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                            <Calendar size={40} style={{ opacity: 0.2 }} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
                        <div className="absolute top-3 left-3 bg-white/92 backdrop-blur rounded-2xl px-3 py-2 text-center shadow-lg">
                          <p className="text-[10px] font-black uppercase text-red-600 leading-none mb-0.5">{dateObj.toLocaleString('en-US', { month: 'short' })}</p>
                          <p className="text-lg font-black text-black leading-none">{dateObj.getDate()}</p>
                        </div>
                        {isPast && (
                          <div className="absolute top-3 right-3 bg-black/70 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full backdrop-blur">
                            Ended
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-4 sm:p-5 flex-1 flex flex-col">
                        <div className="flex-1">
                          <h3 className="text-lg sm:text-xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>{ev.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 mb-3 text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-bg border border-border/60"><Clock size={12} /> {dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                            {ev.location && <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-bg border border-border/60"><MapPin size={12} /> {ev.location}</span>}
                          </div>
                          <p className="text-sm line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>{ev.description}</p>
                        </div>

                        <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--color-border)' }}>
                          <div className="flex items-center gap-2">
                            <UserAvatar name={ev.profiles?.full_name} avatar_url={ev.profiles?.avatar_url} size={24} />
                            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Hosted by {ev.profiles?.full_name || 'Anonymous'}</span>
                          </div>
                          
                          <button
                            onClick={() => !isPast && handleRSVP(ev.id)}
                            disabled={isPast}
                            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                            style={{ 
                              background: isPast ? 'var(--color-bg)' : 'var(--color-accent)', 
                              color: isPast ? 'var(--color-text-muted)' : '#fff' 
                            }}
                          >
                            {isPast ? 'Ended' : `RSVP (${ev.rsvp_count})`}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

/* ─── Avatar Component ──────────────────────────────────────────── */
function UserAvatar({ name, avatar_url, size = 32 }: { name?: string; avatar_url?: string; size?: number }) {
  if (avatar_url) {
    return (
      <div className="rounded-full overflow-hidden shrink-0" style={{ width: size, height: size }}>
        <img src={avatar_url} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }
  const initial = name ? name.charAt(0).toUpperCase() : 'A';
  const colors = ['#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];
  const color = colors[initial.charCodeAt(0) % colors.length];
  return (
    <div
      className="rounded-full flex items-center justify-center font-black text-white shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4, background: color }}
    >
      {initial}
    </div>
  );
}
