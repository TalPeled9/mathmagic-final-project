import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, Mail, User, Sparkles, BookOpen, Star, Shield } from 'lucide-react';
import { GradientRing } from '@/components/loaders';
import MagicBackground from '@/components/MagicBackground';
import wizzyImg from '@/assets/wizzy.png';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const { register, googleAuth } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register({ username, email, password });
      toast.success('Account created! Welcome to MathMagic ✨');
      navigate('/onboarding/add-child');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async (credential: string) => {
    setIsLoading(true);
    try {
      await googleAuth(credential);
      toast.success('Account created with Google! Welcome to MathMagic ✨');
      navigate('/onboarding/add-child');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Google registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #fffbeb 50%, #ede9fe 100%)' }}
    >
      <MagicBackground symbols="stars" count={22} opacity={0.09} />

      <div className="relative z-10 w-full max-w-5xl flex rounded-3xl overflow-hidden shadow-2xl" style={{ minHeight: 620 }}>
        {/* ── Decorative left panel (desktop only) ── */}
        <div
          className="hidden md:flex flex-col items-center justify-center w-5/12 p-10 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #7c3aed 0%, #8b5cf6 50%, #6d28d9 100%)' }}
        >
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className="absolute text-white/20 select-none"
              style={{
                left: `${10 + i * 11}%`,
                top: `${8 + ((i * 17) % 80)}%`,
                fontSize: `${14 + (i % 3) * 8}px`,
                animation: `particle-float-${['a', 'b', 'c'][i % 3]} ${5 + i}s ease-in-out ${i * 0.4}s infinite`,
              }}
            >
              {['★', '✦', '✧', '✨'][i % 4]}
            </span>
          ))}

          <img
            src={wizzyImg}
            alt="Wizzy the wizard"
            className="w-36 h-36 object-contain mb-6 drop-shadow-xl"
            style={{ animation: 'mm-float 3s ease-in-out infinite' }}
          />
          <h2 className="text-2xl font-black text-center leading-tight mb-3">
            Begin the Magic! ✨
          </h2>
          <p className="text-white/80 text-sm text-center mb-8">
            Join thousands of families who have transformed math into an exciting adventure with Wizzy.
          </p>
          <div className="flex flex-col gap-3 w-full">
            {[
              { icon: BookOpen, text: 'Personalized AI story quests' },
              { icon: Star, text: 'Progress tracking & achievements' },
              { icon: Shield, text: 'Parent-controlled & safe for kids' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-2.5">
                <Icon size={16} className="text-gold-magic flex-shrink-0" />
                <span className="text-sm text-white/90">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Form panel ── */}
        <div className="flex-1 flex flex-col justify-center p-8 md:p-10 glass-card">
          <div className="mb-6">
            <Link to="/" className="flex items-center gap-2 mb-5">
              <Sparkles className="text-gold-magic" size={22} />
              <span className="text-lg font-bold text-purple-wizzy">MathMagic</span>
            </Link>
            <h1 className="text-3xl font-black gradient-text mb-1">Create an Account</h1>
            <p className="text-gray-500 text-sm">Start your child's learning adventure today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="letters, numbers, underscores"
                  minLength={3}
                  maxLength={50}
                  required
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-wizzy/30 focus:border-purple-wizzy transition-shadow focus:shadow-[0_0_0_3px_rgba(139,92,246,0.12)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-wizzy/30 focus:border-purple-wizzy transition-shadow focus:shadow-[0_0_0_3px_rgba(139,92,246,0.12)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  minLength={8}
                  required
                  className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-wizzy/30 focus:border-purple-wizzy transition-shadow focus:shadow-[0_0_0_3px_rgba(139,92,246,0.12)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">At least 8 characters</p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 text-white rounded-xl py-3 font-semibold disabled:opacity-60 transition-all mt-1 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
              style={{ background: 'linear-gradient(90deg, #8b5cf6 0%, #6d28d9 100%)' }}
            >
              {isLoading ? <GradientRing size={18} thickness={2.5} label="" /> : <Sparkles className="text-gold-magic" size={18} />}
              {isLoading ? 'Creating account...' : 'Create Account'}
              {!isLoading && <Sparkles className="text-gold-magic" size={18} />}
            </button>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-gray-400">or continue with</span>
              </div>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                text="signup_with"
                onSuccess={async (credentialResponse) => {
                  if (!credentialResponse.credential) {
                    toast.error('Google sign up did not return a credential');
                    return;
                  }
                  await handleGoogleRegister(credentialResponse.credential);
                }}
                onError={() => toast.error('Google sign up failed')}
              />
            </div>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-wizzy font-semibold hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
