import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { login, googleAuth } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/profiles');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="text-gold-magic" size={36} />
            <h1 className="text-4xl font-bold text-purple-wizzy">MathMagic</h1>
          </div>
          <h2 className="text-2xl font-bold text-purple-wizzy">Welcome Back!</h2>
          <p className="text-gray-500 mt-1">Sign in to continue your child's learning adventure</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-wizzy/40 focus:border-purple-wizzy"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-wizzy/40 focus:border-purple-wizzy"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="text-right mt-1">
                <button type="button" className="text-xs text-purple-wizzy hover:underline">
                  Forgot Password?
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-purple-wizzy text-white rounded-xl py-3 font-semibold hover:bg-purple-wizzy/90 disabled:opacity-60 transition-colors mt-2"
            >
              <Sparkles className="text-gold-magic" size={18} />
              {isLoading ? 'Signing in...' : 'Sign In'}
              <Sparkles className="text-gold-magic" size={18} />
            </button>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <span className="relative bg-white px-2 text-xs text-gray-400">or</span>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                locale="en_US"
                text="signin_with"
                onSuccess={async (credentialResponse) => {
                  if (!credentialResponse.credential) {
                    toast.error('Google sign in did not return a credential');
                    return;
                  }

                  setIsLoading(true);
                  try {
                    await googleAuth(credentialResponse.credential);
                    navigate('/profiles');
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Google sign in failed');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                onError={() => {
                  toast.error('Google sign in failed');
                }}
              />
            </div>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Don't have an account?{' '}
          <Link to="/register" className="text-purple-wizzy font-medium hover:underline">
            Create one here
          </Link>
        </p>
      </div>
    </div>
  );
}
