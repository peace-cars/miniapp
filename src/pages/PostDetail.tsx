import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MessageCircle, ThumbsUp, Send, Loader2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../lib/auth';
import { ImageCarousel } from '../components/ui/ImageCarousel';

/* ─── Types ─────────────────────────────────────────────────────── */
interface Profile {
  full_name: string;
  avatar_url?: string;
  username?: string;
}

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
  tags?: string[];
  user_id?: string;
  profiles?: Profile;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  is_edited?: boolean;
  profiles?: Profile;
}

/* ─── YouTube helper ────────────────────────────────────────────── */
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

const timeAgo = (d: string) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

/* ─── Post Detail Component ─────────────────────────────────────── */
export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const user = session?.profile;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [commentContent, setCommentContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Comment edit/delete state
  const [commentMenuId, setCommentMenuId] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');

  useEffect(() => {
    if (id) {
      fetchPostAndComments();
    }
  }, [id]);

  const fetchPostAndComments = async () => {
    setIsLoading(true);
    try {
      const [postData, commentsData] = await Promise.all([
        apiClient.get<Post>(`/community/posts/${id}`),
        apiClient.get<Comment[]>(`/community/posts/${id}/comments`)
      ]);
      setPost(postData);
      setComments(commentsData || []);
    } catch (e) {
      console.error('Failed to fetch post details', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpvote = async () => {
    if (!post) return;
    setPost({ ...post, upvotes: post.upvotes + 1 });
    try {
      await apiClient.post(`/community/posts/${post.id}/upvote`, {});
    } catch {
      // Revert if it fails, or ignore
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!commentContent.trim() || !post) return;
    
    setIsPosting(true);
    try {
      const newComment = await apiClient.post<Comment>(`/community/posts/${post.id}/comments`, {
        content: commentContent
      });
      setComments(prev => [...prev, newComment]);
      setCommentContent('');
    } catch (e) {
      console.error('Failed to post comment', e);
    } finally {
      setIsPosting(false);
    }
  };

  const handleEditComment = async () => {
    if (!editingComment || !editCommentContent.trim()) return;
    try {
      const updated = await apiClient.patch<Comment>(`/community/comments/${editingComment.id}`, {
        content: editCommentContent,
      });
      setComments(comments.map(c => c.id === editingComment.id ? { ...c, ...updated } : c));
      setEditingComment(null);
    } catch (e) {
      console.error('Failed to edit comment', e);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await apiClient.delete(`/community/comments/${commentId}`);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (e) {
      console.error('Failed to delete comment', e);
    }
    setCommentMenuId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 px-4 flex justify-center" style={{ background: 'var(--color-bg)' }}>
        <Loader2 className="animate-spin text-text-muted" size={32} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen pt-24 text-center" style={{ background: 'var(--color-bg)' }}>
        <p className="text-text-secondary">Post not found.</p>
        <button onClick={() => navigate('/community')} className="mt-4 text-accent font-bold">Back to Community</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--color-bg)' }}>
      {/* ── Navbar Spacer ── */}
      <div className="h-4"></div>
      
      <div className="max-w-[800px] mx-auto px-4">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/community')}
          className="flex items-center gap-2 mb-4 text-sm font-bold transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft size={16} /> Back to Community
        </button>

        {/* ── Main Post ── */}
        <motion.article
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden shadow-sm mb-6"
          style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-3 px-4 pt-4 pb-3" onClick={() => post.user_id && navigate(`/u/${post.user_id}`)} style={{ cursor: post.user_id ? 'pointer' : 'default' }}>
            <UserAvatar name={post.profiles?.full_name} avatar_url={post.profiles?.avatar_url} size={40} />
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold truncate hover:underline" style={{ color: 'var(--color-text-primary)' }}>
                {post.profiles?.full_name || 'Anonymous'} {post.profiles?.username && <span className="text-xs font-normal" style={{color: 'var(--color-text-muted)'}}>@{post.profiles.username}</span>}
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {timeAgo(post.created_at)}{(post as any).is_edited && ' · edited'}
              </p>
            </div>
          </div>

          <div className="px-4 pb-3">
            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {post.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                    style={{ background: 'var(--color-accent-light, rgba(99,102,241,0.1))', color: 'var(--color-accent)' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <h1 className="text-xl font-bold mb-2 leading-snug" style={{ color: 'var(--color-text-primary)' }}>{post.title}</h1>
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text-primary)', opacity: 0.9 }}>
              {post.content}
            </p>
          </div>

          {post.images && post.images.length > 0 && (
            <div className="w-full">
              <ImageCarousel images={post.images} />
            </div>
          )}

          {post.youtube_url && (
            <div className="px-4 pb-3">
              <YouTubeEmbed url={post.youtube_url} />
            </div>
          )}

          <div className="flex items-center gap-4 px-4 py-3" style={{ borderTop: '1px solid var(--color-border)' }}>
            <button onClick={handleUpvote} className="flex items-center gap-1.5 text-sm font-bold transition-all active:scale-90" style={{ color: post.upvotes > 0 ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}>
              <ThumbsUp size={18} /> {post.upvotes > 0 ? post.upvotes : 'Like'}
            </button>
            <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: 'var(--color-text-secondary)' }}>
              <MessageCircle size={18} /> {comments.length} Comments
            </div>
          </div>
        </motion.article>

        {/* ── Comments Section ── */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Comments</h2>
          
          {/* Add Comment */}
          <div className="flex items-start gap-3">
            <UserAvatar name={user?.full_name} size={32} />
            <div className="flex-1 relative">
              <textarea
                value={commentContent}
                onChange={e => setCommentContent(e.target.value)}
                placeholder={user ? "Add a comment..." : "Log in to add a comment..."}
                disabled={!user || isPosting}
                rows={2}
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none resize-none"
                style={{ 
                  background: 'var(--color-bg-secondary)', 
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
              <button
                onClick={handleAddComment}
                disabled={!user || isPosting || !commentContent.trim()}
                className="absolute bottom-3 right-3 p-1.5 rounded-full transition-colors active:scale-90 disabled:opacity-30"
                style={{ background: 'var(--color-accent)', color: 'white' }}
              >
                {isPosting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="translate-x-[1px] translate-y-[1px]" />}
              </button>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-4 pt-4">
            {comments.map((comment, idx) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex gap-3 group"
              >
                <div onClick={() => comment.user_id && navigate(`/u/${comment.user_id}`)} className="cursor-pointer shrink-0 mt-1">
                  <UserAvatar name={comment.profiles?.full_name} avatar_url={comment.profiles?.avatar_url} size={32} />
                </div>
                <div className="flex-1">
                  {editingComment?.id === comment.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editCommentContent}
                        onChange={e => setEditCommentContent(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none resize-none"
                        style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => setEditingComment(null)} className="px-3 py-1 rounded-lg text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
                        <button onClick={handleEditComment} className="px-3 py-1 rounded-lg text-xs font-bold text-white" style={{ background: 'var(--color-accent)' }}>Save</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="inline-block px-4 py-2.5 rounded-2xl relative" style={{ background: 'var(--color-bg-secondary)' }}>
                        <p className="text-[13px] font-bold mb-0.5" style={{ color: 'var(--color-text-primary)' }}>
                          {comment.profiles?.full_name || 'Anonymous'}
                        </p>
                        <p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text-primary)' }}>
                          {comment.content}
                        </p>

                        {/* Comment author menu */}
                        {session?.user?.id === comment.user_id && (
                          <div className="absolute -top-1 -right-1">
                            <button
                              onClick={() => setCommentMenuId(commentMenuId === comment.id ? null : comment.id)}
                              className="w-6 h-6 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ background: 'var(--color-bg)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
                            >
                              <MoreHorizontal size={12} />
                            </button>
                            <AnimatePresence>
                              {commentMenuId === comment.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                  className="absolute right-0 top-8 z-50 w-36 rounded-xl shadow-xl overflow-hidden"
                                  style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
                                >
                                  <button
                                    onClick={() => { setEditingComment(comment); setEditCommentContent(comment.content); setCommentMenuId(null); }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-left hover:bg-surface-hover transition-colors"
                                    style={{ color: 'var(--color-text-primary)' }}
                                  >
                                    <Pencil size={12} /> Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-left hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-red-500"
                                  >
                                    <Trash2 size={12} /> Delete
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 px-2 text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                        <span>{timeAgo(comment.created_at)}{comment.is_edited && ' · edited'}</span>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
            
            {comments.length === 0 && (
              <p className="text-center text-sm py-8" style={{ color: 'var(--color-text-muted)' }}>
                No comments yet. Be the first to share your thoughts!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
