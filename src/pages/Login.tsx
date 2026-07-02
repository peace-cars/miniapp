import { useState } from 'react';
import { Mail, Lock, ArrowRight, User, Phone, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import authBg from '../assets/auth-bg.png';
import logo from '../assets/logo.png';

export default function Login() {
  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = isLogin 
      ? await login(email, password)
      : await register(email, password, fullName, phone);

    if (error) {
      setErrorMsg(error);
      setLoading(false);
      return;
    }

    navigate('/');
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-5 font-sans relative overflow-hidden"
      style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
    >
      {/* Background Graphic */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.07] dark:opacity-20">
        <img src={authBg} alt="" className="w-full h-full object-cover" />
      </div>

      <div className="w-full max-w-md space-y-8 z-10">
        {/* Branding */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="mx-auto relative inline-flex items-center justify-center w-22 h-22 rounded-[1.75rem] p-4.5 bg-gradient-to-b from-white/92 via-white/75 to-white/50 border border-white/75 shadow-[0_20px_45px_-18px_rgba(15,23,42,0.35)] backdrop-blur-xl"
          >
            <img src={logo} alt="PeaceCars" className="w-full h-full object-contain relative z-10" />
            <div className="absolute inset-0 rounded-[1.75rem] bg-gradient-to-tr from-[#EA580C]/22 via-transparent to-transparent blur-xl -z-10" />
          </motion.div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-text-secondary">
              PeaceCars Client
            </p>
            <h1 className="text-3xl md:text-[2.15rem] font-black tracking-tight text-text-primary">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-[13px] text-text-secondary font-medium tracking-wide max-w-[26ch] mx-auto">
              {isLogin
                ? 'Sign in to manage your vehicles and track activity.'
                : 'Create your account to start using PeaceCars.'}
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <motion.div 
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
          className="w-full relative"
        >
          <form onSubmit={handleAuth} className="space-y-5">
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-500 text-xs font-bold text-center">
                {errorMsg}
              </div>
            )}

            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-text-secondary uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative group">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors" />
                      <input 
                        type="text" 
                        placeholder="Ex: Dawit Abraham" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full neo-inset p-3.5 pl-11 rounded-xl text-[14px] font-medium outline-none transition-all focus:ring-4"
                        style={{ color: 'var(--color-text-primary)' }}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-text-secondary uppercase tracking-widest ml-1">Phone Number</label>
                    <div className="relative group">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors" />
                      <input 
                        type="tel" 
                        placeholder="+251 ..." 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full neo-inset p-3.5 pl-11 rounded-xl text-[14px] font-medium outline-none transition-all focus:ring-4"
                        style={{ color: 'var(--color-text-primary)' }}
                        required
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="button"
              onClick={loginWithGoogle}
              disabled={loading}
              className="w-full bg-white text-gray-800 border border-gray-200 p-3.5 rounded-xl text-[14px] font-bold flex items-center justify-center gap-3 shadow-sm hover:bg-gray-50 hover:shadow-md transition-all mb-6"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative bg-bg-secondary px-3 text-[10px] font-bold tracking-widest uppercase text-text-muted">
                Or sign in with email
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-secondary uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors" />
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full neo-inset p-3.5 pl-11 rounded-xl text-[14px] font-medium outline-none transition-all focus:ring-4"
                  style={{ color: 'var(--color-text-primary)' }}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-secondary uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors" />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full neo-inset p-3.5 pl-11 rounded-xl text-[14px] font-medium outline-none transition-all focus:ring-4"
                  style={{ color: 'var(--color-text-primary)' }}
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="peace-btn-primary w-full mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <button 
              type="button"
              onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }} 
              className="text-[12px] font-bold text-text-secondary hover:text-accent transition-all tracking-wide"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>
        </motion.div>

        <p className="text-center text-[10px] text-text-muted font-bold tracking-widest">
          © 2026 PeaceCars Global
        </p>
      </div>
    </div>
  );
}
