import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Image as ImageIcon, Video, X, Loader2, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { apiClient } from '../lib/apiClient';

function compressImage(file: File, maxWidth = 1280): Promise<File> {
  return new Promise<File>((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result !== 'string') { resolve(file); return; }
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
            blob ? resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), { type: 'image/webp' })) : resolve(file);
          }, 'image/webp', 0.82);
        } else resolve(file);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function CommunityCreate() {
  const { session } = useAuth();
  const user = session?.profile;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') === 'events' ? 'event' : 'post';
  const [type, setType] = useState<'post' | 'event'>(initialType);

  // Post State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Event State
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
  const [eventImagePreview, setEventImagePreview] = useState<string | null>(null);
  const eventFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!session) {
      navigate('/login');
    }
  }, [session, navigate]);

  /* ── Image Pickers ── */
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

  const handleEventImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const c = await compressImage(file);
    setEventImageFile(c);
    setEventImagePreview(URL.createObjectURL(c));
    if (eventFileRef.current) eventFileRef.current.value = '';
  };

  /* ── Submit Handlers ── */
  const handlePostSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setIsPosting(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject('Failed to read file');
          reader.readAsDataURL(file);
        });
        const base64 = await base64Promise;

        const res = await apiClient.post<{url: string}>('/upload/base64', {
          file: base64,
          bucket: 'community',
          folder: 'posts'
        });
        if (res?.url) {
          uploadedUrls.push(res.url);
        }
      }

      const payload: any = { title, content, post_type: 'discussion', tags };
      if (uploadedUrls.length > 0) payload.images = uploadedUrls;
      if (youtubeUrl.trim()) payload.youtube_url = youtubeUrl.trim();

      await apiClient.post('/community/posts', payload);
      navigate('/community');
    } catch (e) {
      console.error('Failed to post:', e);
    } finally {
      setIsPosting(false);
    }
  };

  const handleEventSubmit = async () => {
    if (!eventTitle.trim() || !eventDesc.trim() || !eventDate) return;
    setIsPosting(true);
    try {
      let coverUrl = '';
      if (eventImageFile) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject('Failed to read file');
          reader.readAsDataURL(eventImageFile);
        });
        const base64 = await base64Promise;

        const res = await apiClient.post<{url: string}>('/upload/base64', {
          file: base64,
          bucket: 'community',
          folder: 'events'
        });
        if (res?.url) {
          coverUrl = res.url;
        }
      }

      const payload = {
        title: eventTitle,
        description: eventDesc,
        event_date: new Date(eventDate).toISOString(),
        location: eventLocation,
        cover_image: coverUrl
      };

      await apiClient.post('/community/events', payload);
      navigate('/community?tab=events');
    } catch (e) {
      console.error('Failed to create event:', e);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text-primary">
      {/* ── STICKY TOP HEADER (Floating Pill) ─────────────────────────────────── */}
      <div className="sticky top-4 z-[100] px-3 md:px-8 max-w-[1400px] mx-auto pointer-events-none transition-all mb-4">
        <div 
          className="flex items-center justify-between h-14 md:h-16 px-5 rounded-full border shadow-lg pointer-events-auto"
          style={{ 
            background: 'rgba(var(--color-bg-rgb), 0.85)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderColor: 'var(--color-border)',
            boxShadow: 'var(--shadow-card-raised)'
          }}
        >
          <button onClick={() => navigate(-1)} className="text-text-secondary text-[13px] font-bold">Cancel</button>
          <p className="text-[15px] font-bold text-text-primary">New {type === 'post' ? 'Discussion' : 'Event'}</p>
          <button 
            onClick={type === 'post' ? handlePostSubmit : handleEventSubmit}
            disabled={isPosting || (type === 'post' ? (!title.trim() || !content.trim()) : (!eventTitle.trim() || !eventDesc.trim() || !eventDate))}
            className="px-4 py-1.5 rounded-full text-sm font-bold bg-accent text-white disabled:opacity-50 transition-opacity"
          >
            {isPosting ? <Loader2 size={16} className="animate-spin" /> : 'Publish'}
          </button>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto px-4 py-6 space-y-6">
        {/* Type Toggle */}
        <div className="flex bg-bg-secondary p-1 rounded-xl border border-border">
          <button
            className="flex-1 py-2 text-sm font-bold rounded-lg transition-colors"
            style={{ 
              background: type === 'post' ? 'var(--color-bg)' : 'transparent',
              color: type === 'post' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              boxShadow: type === 'post' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
            }}
            onClick={() => setType('post')}
          >
            Discussion Post
          </button>
          <button
            className="flex-1 py-2 text-sm font-bold rounded-lg transition-colors"
            style={{ 
              background: type === 'event' ? 'var(--color-bg)' : 'transparent',
              color: type === 'event' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              boxShadow: type === 'event' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
            }}
            onClick={() => setType('event')}
          >
            Meetup Event
          </button>
        </div>

        {/* Form Content */}
        {type === 'post' ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <input 
              type="text" 
              placeholder="Give your post a title..." 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              className="w-full bg-transparent text-2xl font-black outline-none placeholder:font-normal placeholder:text-text-muted" 
            />
            <textarea 
              placeholder="What do you want to talk about?" 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              rows={8} 
              className="w-full bg-transparent text-base outline-none resize-none leading-relaxed placeholder:text-text-muted" 
            />

            <AnimatePresence>
              {showYoutubeInput && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="flex items-center gap-2 p-3 rounded-xl border border-border bg-bg-secondary mt-2">
                    <Video size={16} className="shrink-0 text-red-500" />
                    <input type="url" placeholder="Paste YouTube link…" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" />
                    {youtubeUrl && <button onClick={() => { setYoutubeUrl(''); setShowYoutubeInput(false); }}><X size={14} className="text-text-muted" /></button>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-wrap gap-2 pt-2">
              {['#General', '#Advice', '#Showcase', '#Maintenance', '#Offroad', '#EVs'].map(tag => (
                <button
                  key={tag}
                  onClick={() => setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${tags.includes(tag) ? 'bg-accent text-white' : 'bg-surface-hover text-text-secondary border border-border'}`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {imagePreviews.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-border">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => removeImage(i)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-sm"><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 pt-4 border-t border-border">
              <button onClick={() => fileRef.current?.click()} className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-hover text-accent transition-colors">
                <ImageIcon size={20} />
              </button>
              <button onClick={() => setShowYoutubeInput(!showYoutubeInput)} className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-hover text-red-500 transition-colors">
                <Video size={20} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImagePick} className="hidden" />
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <input 
              type="text" 
              placeholder="Event Name" 
              value={eventTitle} 
              onChange={e => setEventTitle(e.target.value)} 
              className="w-full px-4 py-3 rounded-xl text-base font-bold outline-none border border-border bg-bg-secondary" 
            />
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Calendar size={18} className="absolute left-3 top-3.5 text-text-muted" />
                <input 
                  type="datetime-local" 
                  value={eventDate} 
                  onChange={e => setEventDate(e.target.value)} 
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none border border-border bg-bg-secondary" 
                />
              </div>
              <div className="flex-1 relative">
                <MapPin size={18} className="absolute left-3 top-3.5 text-text-muted" />
                <input 
                  type="text" 
                  placeholder="Location (optional)" 
                  value={eventLocation} 
                  onChange={e => setEventLocation(e.target.value)} 
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none border border-border bg-bg-secondary" 
                />
              </div>
            </div>

            <textarea 
              placeholder="Describe what the event is about..." 
              value={eventDesc} 
              onChange={e => setEventDesc(e.target.value)} 
              rows={5} 
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none border border-border bg-bg-secondary" 
            />
            
            <div className="pt-2">
              <button onClick={() => eventFileRef.current?.click()} className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border border-border bg-bg-secondary hover:bg-surface-hover transition-colors w-full sm:w-auto">
                <ImageIcon size={18} className="text-accent" /> Add Cover Image
              </button>
              <input ref={eventFileRef} type="file" accept="image/*" onChange={handleEventImagePick} className="hidden" />
              {eventImagePreview && (
                <div className="relative mt-4 w-full aspect-video rounded-xl overflow-hidden border border-border">
                  <img src={eventImagePreview} className="w-full h-full object-cover" alt="" />
                  <button onClick={() => {setEventImagePreview(null); setEventImageFile(null);}} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex justify-center items-center backdrop-blur-sm"><X size={16}/></button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
