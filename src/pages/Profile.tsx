import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, Camera, Car, Plus, X, Loader2, MessageCircle, ThumbsUp, Users, Search, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { apiClient, API_URL } from '../lib/apiClient';
import { ClientCache } from '../lib/cache';
import { supabase } from '../lib/supabase';
import { ProgressiveImage } from '../components/ui/ProgressiveImage';
import { useFeatureFlags } from '../lib/featureFlags';
/* ─── Types ─────────────────────────────────────────────────────── */
interface Profile {
  id: string;
  full_name: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface GarageCar {
  id: string;
  make: string;
  model: string;
  year: number;
  description: string | null;
  images: string[];
  is_public: boolean;
}

interface Post {
  id: string;
  title: string;
  content: string;
  upvotes: number;
  created_at: string;
  images?: string[];
  youtube_url?: string;
}

export const Profile: React.FC = () => {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const flags = useFeatureFlags();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [garage, setGarage] = useState<GarageCar[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [followStats, setFollowStats] = useState({ followers: 0, following: 0 });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');

  const [showAddCar, setShowAddCar] = useState(false);
  const [carMake, setCarMake] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carYear, setCarYear] = useState(new Date().getFullYear());
  const [carDesc, setCarDesc] = useState('');
  const [carImageFiles, setCarImageFiles] = useState<File[]>([]);
  const [carImagePreviews, setCarImagePreviews] = useState<string[]>([]);
  const [isAddingCar, setIsAddingCar] = useState(false);
  
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const [displayCountGarage, setDisplayCountGarage] = useState(10);
  const [displayCountPosts, setDisplayCountPosts] = useState(10);

  const observerGarageRef = useRef<IntersectionObserver | null>(null);
  const observerPostsRef = useRef<IntersectionObserver | null>(null);

  const garageBottomRef = React.useCallback((node: HTMLDivElement | null) => {
    if (observerGarageRef.current) observerGarageRef.current.disconnect();
    observerGarageRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setDisplayCountGarage(prev => prev + 10);
    });
    if (node) observerGarageRef.current.observe(node);
  }, []);

  const postsBottomRef = React.useCallback((node: HTMLDivElement | null) => {
    if (observerPostsRef.current) observerPostsRef.current.disconnect();
    observerPostsRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setDisplayCountPosts(prev => prev + 10);
    });
    if (node) observerPostsRef.current.observe(node);
  }, []);

  useEffect(() => {
    if (!session) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [session, navigate]);

  const fetchData = async () => {
    try {
      // Fetch stats in background, not critical for initial render caching
      const fetchStats = session?.user?.id 
        ? apiClient.get<any>(`/community/users/${session.user.id}/follow-stats`).catch(() => ({ followers: 0, following: 0 }))
        : Promise.resolve({ followers: 0, following: 0 });

      fetchStats.then(stats => setFollowStats(stats));

      // Use SWR for instant perceived performance
      await ClientCache.swr<any>(
        `${API_URL}/profiles/me`,
        (data) => {
          if (data) {
            setProfile({
              id: data.id,
              full_name: data.full_name,
              username: data.username,
              bio: data.bio,
              avatar_url: data.avatar_url,
              created_at: data.created_at
            });
            setEditUsername(data.username || '');
            setEditBio(data.bio || '');
            setGarage(data.garage || []);
            setPosts(data.posts || []);
            setIsLoading(false); // Hide skeleton instantly on cache hit
          }
        }
      );
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const data = await apiClient.patch('/profiles/me', {
        username: editUsername,
        bio: editBio
      });
      setProfile(data as Profile);
      setIsEditing(false);
    } catch (e) {
      console.error('Failed to update profile', e);
    }
  };

  const handleAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Upload avatar via backend proxy to bypass RLS
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = (ev) => resolve(ev.target?.result as string);
      reader.onerror = () => reject('Failed to read file');
      reader.readAsDataURL(file);
    });
    const base64 = await base64Promise;
    
    try {
      const res = await apiClient.post<{url: string}>('/upload/base64', {
        file: base64,
        bucket: 'community',
        folder: 'avatars'
      });
      if (res?.url) {
        await apiClient.patch('/profiles/me', { avatar_url: res.url });
        setProfile(prev => prev ? { ...prev, avatar_url: res.url } : null);
      }
    } catch (error) {
      console.error('Failed to upload avatar', error);
    }
  };

  const handleCarImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setCarImageFiles(prev => [...prev, ...files]);
    setCarImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeCarImage = (idx: number) => {
    setCarImageFiles(prev => prev.filter((_, i) => i !== idx));
    setCarImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddCar = async () => {
    if (!carMake || !carModel) return;
    setIsAddingCar(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of carImageFiles) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.onerror = () => reject('Failed to read file');
          reader.readAsDataURL(file);
        });
        const base64 = await base64Promise;

        const res = await apiClient.post<{url: string}>('/upload/base64', {
          file: base64,
          bucket: 'community',
          folder: 'garage'
        });
        if (res?.url) {
          uploadedUrls.push(res.url);
        }
      }

      const newCar = await apiClient.post<GarageCar>('/profiles/garage', {
        make: carMake,
        model: carModel,
        year: carYear,
        description: carDesc,
        images: uploadedUrls
      });

      setGarage([newCar, ...garage]);
      setShowAddCar(false);
      setCarMake('');
      setCarModel('');
      setCarDesc('');
      setCarImageFiles([]);
      setCarImagePreviews([]);
    } catch (e) {
      console.error('Failed to add car', e);
    } finally {
      setIsAddingCar(false);
    }
  };

  const handleRemoveCar = async (id: string) => {
    try {
      await apiClient.delete(`/profiles/garage/${id}`);
      setGarage(garage.filter(c => c.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--color-bg)' }}>
      <div className="h-32 md:h-48 relative overflow-hidden bg-gray-200 animate-pulse dark:bg-gray-800" />
      <div className="max-w-[800px] mx-auto px-4 -mt-12 md:-mt-16 relative z-10">
        <div className="rounded-2xl p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gray-300 dark:bg-gray-700 border-4 border-gray-50 dark:border-gray-900" />
              <div className="pb-2 space-y-2">
                <div className="h-6 w-32 bg-gray-300 dark:bg-gray-700 rounded" />
                <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded" />
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-8 border-t border-gray-200 dark:border-gray-800 pt-6">
            <div className="h-8 w-16 bg-gray-300 dark:bg-gray-700 rounded" />
            <div className="h-8 w-16 bg-gray-300 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
  if (!profile) return null;

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--color-bg-secondary)' }}>
      {/* Header Cover */}
      <div className="h-32 md:h-48 relative overflow-hidden" style={{ background: 'var(--color-text-primary)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, var(--color-accent) 0%, transparent 50%)' }} />
      </div>

      <div className="max-w-[800px] mx-auto px-4 -mt-12 md:-mt-16 relative z-10">
        {/* Profile Info */}
        <div className="rounded-2xl p-6 neo-card">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="relative">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden neo-card">
                  {profile.avatar_url ? (
                    <ProgressiveImage src={profile.avatar_url} alt="" className="w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-black text-4xl text-white" style={{ background: 'var(--color-accent)' }}>
                      {profile.full_name.charAt(0)}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => avatarRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg transition-transform active:scale-95"
                  style={{ background: 'var(--color-accent)', color: 'white' }}
                >
                  <Camera size={14} />
                </button>
                <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
              </div>
              
              <div className="pb-2">
                <h1 className="text-2xl font-black leading-none" style={{ color: 'var(--color-text-primary)' }}>{profile.full_name}</h1>
                <p className="text-sm font-bold mt-1 mb-2" style={{ color: 'var(--color-accent)' }}>
                  @{profile.username || `user_${profile.id.substring(0,6)}`}
                </p>
                {flags.community && (
                  <div className="flex items-center gap-4 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    <span className="flex items-center gap-1.5"><Users size={14} /> {followStats.followers} Followers</span>
                    <span>{followStats.following} Following</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pb-2">
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-xl text-sm font-bold neo-button"
              >
                Edit Profile
              </button>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="w-10 h-10 flex items-center justify-center rounded-xl neo-button text-text-secondary"
              >
                <Settings size={18} />
              </button>
            </div>
          </div>

          <p className="mt-6 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {profile.bio || 'No bio provided. Update your profile to tell the community about yourself!'}
          </p>
        </div>

        {/* Edit Modal */}
        <AnimatePresence>
          {isEditing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl p-6 neo-card">
                <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Edit Profile</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Username</label>
                    <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none neo-inset" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Bio</label>
                    <textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none neo-inset" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setIsEditing(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold neo-button text-text-primary">Cancel</button>
                    <button onClick={handleSaveProfile} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: 'var(--color-accent)' }}>Save</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tracking Links */}
        <div className="mt-8 mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/sourcing" className="block w-full rounded-2xl p-5 relative overflow-hidden transition-all active:scale-[0.99] group neo-card">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition-all group-hover:bg-blue-500/20" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md shrink-0" style={{ background: 'var(--color-accent)' }}>
                  <Search size={18} />
                </div>
                <div>
                  <h2 className="text-base font-black leading-tight" style={{ color: 'var(--color-text-primary)' }}>My Sourcing</h2>
                  <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Track custom requests</p>
                </div>
              </div>
              <ChevronRight size={18} style={{ color: 'var(--color-text-muted)' }} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link to="/track" className="block w-full rounded-2xl p-5 relative overflow-hidden transition-all active:scale-[0.99] group neo-card">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition-all group-hover:bg-green-500/20" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md shrink-0 bg-emerald-500">
                  <Car size={18} />
                </div>
                <div>
                  <h2 className="text-base font-black leading-tight" style={{ color: 'var(--color-text-primary)' }}>Trade-Ins & Sell</h2>
                  <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Track your appraisals</p>
                </div>
              </div>
              <ChevronRight size={18} style={{ color: 'var(--color-text-muted)' }} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Garage Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <Car size={20} style={{ color: 'var(--color-accent)' }} /> My Garage
            </h2>
            <button
              onClick={() => setShowAddCar(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold neo-button transition-transform active:scale-95"
            >
              <Plus size={16} /> Add Car
            </button>
          </div>

          <AnimatePresence>
            {showAddCar && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 rounded-2xl p-5 neo-card">
                <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>Add Vehicle to Garage</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input type="text" placeholder="Make (e.g. Toyota)" value={carMake} onChange={e => setCarMake(e.target.value)} className="px-4 py-2 rounded-xl text-sm outline-none neo-inset" />
                  <input type="text" placeholder="Model (e.g. Vitz)" value={carModel} onChange={e => setCarModel(e.target.value)} className="px-4 py-2 rounded-xl text-sm outline-none neo-inset" />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input type="number" placeholder="Year" value={carYear} onChange={e => setCarYear(parseInt(e.target.value))} className="px-4 py-2 rounded-xl text-sm outline-none neo-inset" />
                  <button onClick={() => fileRef.current?.click()} className="px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 neo-button text-text-secondary">
                    <Camera size={16} /> Add Photos
                  </button>
                  <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleCarImagePick} />
                </div>
                
                {carImagePreviews.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
                    {carImagePreviews.map((src, i) => (
                      <div key={i} className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden">
                        <ProgressiveImage src={src} className="w-full h-full" alt="" />
                        <button onClick={() => removeCarImage(i)} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full text-white flex items-center justify-center"><X size={10} /></button>
                      </div>
                    ))}
                  </div>
                )}

                <textarea placeholder="Tell us about your ride..." value={carDesc} onChange={e => setCarDesc(e.target.value)} rows={2} className="w-full px-4 py-2 rounded-xl text-sm outline-none mb-3 resize-none neo-inset" />
                
                <div className="flex gap-2">
                  <button onClick={() => setShowAddCar(false)} className="flex-1 py-2 rounded-xl text-sm font-bold neo-button text-text-primary">Cancel</button>
                  <button onClick={handleAddCar} disabled={isAddingCar} className="flex-1 py-2 rounded-xl text-sm font-bold text-white flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
                    {isAddingCar ? <Loader2 size={16} className="animate-spin" /> : 'Add to Garage'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {garage.length === 0 && !showAddCar ? (
            <div className="text-center py-10 rounded-2xl neo-inset">
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Your garage is empty. Add a car to show it off!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {garage.slice(0, displayCountGarage).map(car => (
                <div key={car.id} className="rounded-2xl overflow-hidden neo-card">
                  {car.images && car.images.length > 0 ? (
                    <div className="aspect-video relative bg-black">
                      <ProgressiveImage src={car.images[0]} alt="" className="w-full h-full" />
                      <button onClick={() => handleRemoveCar(car.id)} className="absolute top-2 right-2 w-8 h-8 bg-black/50 backdrop-blur rounded-lg text-white flex items-center justify-center"><X size={14}/></button>
                    </div>
                  ) : (
                    <div className="aspect-video flex items-center justify-center bg-black/5 relative">
                      <Car size={32} style={{ opacity: 0.2 }} />
                      <button onClick={() => handleRemoveCar(car.id)} className="absolute top-2 right-2 w-8 h-8 bg-white shadow rounded-lg text-black flex items-center justify-center"><X size={14}/></button>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>{car.year} {car.make} {car.model}</h3>
                    {car.description && <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{car.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {displayCountGarage < garage.length && <div ref={garageBottomRef} className="h-4" />}
        </div>

        {/* Activity Section */}
        {flags.community && (
          <div className="mt-8 pb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black" style={{ color: 'var(--color-text-primary)' }}>Recent Posts</h2>
              <Link
                to="/community/create"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold neo-button transition-transform active:scale-95"
              >
                <Plus size={16} /> Create Post
              </Link>
            </div>
            {posts.length === 0 ? (
               <div className="text-center py-10 rounded-2xl neo-inset">
                 <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No posts yet.</p>
               </div>
            ) : (
              <div className="space-y-3">
                {posts.slice(0, displayCountPosts).map(post => (
                  <div key={post.id} className="p-4 rounded-2xl flex gap-4 neo-card">
                    {post.images && post.images.length > 0 && (
                      <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-black/10">
                        <ProgressiveImage src={post.images[0]} alt="" className="w-full h-full" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[15px] truncate" style={{ color: 'var(--color-text-primary)' }}>{post.title}</h3>
                      <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>{post.content}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="flex items-center gap-1 text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                          <ThumbsUp size={13} /> {post.upvotes}
                        </span>
                        <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {displayCountPosts < posts.length && <div ref={postsBottomRef} className="h-4" />}
          </div>
        )}

      </div>
    </div>
  );
};
