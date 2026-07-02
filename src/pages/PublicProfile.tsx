import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Car, ThumbsUp, ArrowLeft, Users, Loader2 } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../lib/auth';

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
  images?: string[];
  created_at: string;
}

export const PublicProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [garage, setGarage] = useState<GarageCar[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { session } = useAuth();
  const [followStats, setFollowStats] = useState({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    if (id) fetchData(id);
  }, [id]);

  const fetchData = async (userId: string) => {
    try {
      const data = await apiClient.get<any>(`/profiles/${userId}`);
      setProfile({
        id: data.id,
        full_name: data.full_name,
        username: data.username,
        bio: data.bio,
        avatar_url: data.avatar_url,
        created_at: data.created_at
      });
      setGarage(data.garage?.filter((c: any) => c.is_public) || []);
      setPosts(data.posts || []);

      // Fetch follow stats
      const stats = await apiClient.get<any>(`/community/users/${userId}/follow-stats`);
      setFollowStats(stats);

      if (session?.user?.id && session.user.id !== userId) {
        const status = await apiClient.get<any>(`/community/users/${userId}/follow-status`);
        setIsFollowing(status.isFollowing);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!session?.user?.id || !profile) return;
    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await apiClient.delete(`/community/users/${profile.id}/follow`);
        setFollowStats(prev => ({ ...prev, followers: prev.followers - 1 }));
      } else {
        await apiClient.post(`/community/users/${profile.id}/follow`, {});
        setFollowStats(prev => ({ ...prev, followers: prev.followers + 1 }));
      }
      setIsFollowing(!isFollowing);
    } catch (e) {
      console.error('Failed to toggle follow', e);
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (isLoading) return <div className="min-h-screen pt-24 text-center">Loading...</div>;
  if (!profile) return <div className="min-h-screen pt-24 text-center">Profile not found</div>;

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--color-bg)' }}>
      {/* Header Cover */}
      <div className="h-32 md:h-48 relative overflow-hidden" style={{ background: 'var(--color-text-primary)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, var(--color-accent) 0%, transparent 50%)' }} />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-xl shadow-md flex items-center justify-center transition-transform active:scale-95"
          style={{ background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="max-w-[800px] mx-auto px-4 -mt-12 md:-mt-16 relative z-10">
        {/* Profile Info */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden shadow-xl" style={{ border: '4px solid var(--color-bg-secondary)', background: 'var(--color-bg)' }}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-4xl text-white" style={{ background: 'var(--color-accent)' }}>
                    {profile.full_name.charAt(0)}
                  </div>
                )}
              </div>
              
              <div className="pb-2">
                <h1 className="text-2xl font-black leading-none" style={{ color: 'var(--color-text-primary)' }}>{profile.full_name}</h1>
                <p className="text-sm font-bold mt-1 mb-2" style={{ color: 'var(--color-accent)' }}>
                  @{profile.username || `user_${profile.id.substring(0,6)}`}
                </p>
                <div className="flex items-center gap-4 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  <span className="flex items-center gap-1.5"><Users size={14} /> {followStats.followers} Followers</span>
                  <span>{followStats.following} Following</span>
                </div>
              </div>
            </div>

            {session?.user?.id && session.user.id !== profile.id && (
              <button
                onClick={handleFollowToggle}
                disabled={isFollowLoading}
                className="px-6 py-2.5 rounded-full text-sm font-bold transition-all disabled:opacity-50 mt-4 sm:mt-0"
                style={{
                  background: isFollowing ? 'var(--color-surface-hover)' : 'var(--color-accent)',
                  color: isFollowing ? 'var(--color-text-primary)' : 'white',
                  border: isFollowing ? '1px solid var(--color-border)' : 'none'
                }}
              >
                {isFollowLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : (isFollowing ? 'Following' : 'Follow')}
              </button>
            )}
          </div>

          <p className="mt-6 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {profile.bio || 'This user has not added a bio yet.'}
          </p>
        </div>

        {/* Garage Section */}
        <div className="mt-8">
          <h2 className="text-lg font-black mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <Car size={20} style={{ color: 'var(--color-accent)' }} /> Garage
          </h2>
          
          {garage.length === 0 ? (
            <div className="text-center py-10 rounded-2xl" style={{ background: 'var(--color-bg-secondary)', border: '1px dashed var(--color-border)' }}>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Garage is empty or private.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {garage.map(car => (
                <div key={car.id} className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                  {car.images && car.images.length > 0 ? (
                    <div className="aspect-video bg-black">
                      <img src={car.images[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="aspect-video flex items-center justify-center bg-black/5">
                      <Car size={32} style={{ opacity: 0.2 }} />
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
        </div>

        {/* Activity Section */}
        <div className="mt-8 pb-12">
          <h2 className="text-lg font-black mb-4" style={{ color: 'var(--color-text-primary)' }}>Posts</h2>
          {posts.length === 0 ? (
             <div className="text-center py-10 rounded-2xl" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
               <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No public posts.</p>
             </div>
          ) : (
            <div className="space-y-3">
              {posts.map(post => (
                <div key={post.id} className="p-4 rounded-2xl flex gap-4" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                  {post.images && post.images.length > 0 && (
                    <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-black/10">
                      <img src={post.images[0]} alt="" className="w-full h-full object-cover" />
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
        </div>

      </div>
    </div>
  );
};
