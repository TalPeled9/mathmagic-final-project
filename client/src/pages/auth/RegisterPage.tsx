import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, Mail, User, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen bg-parchment flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="text-gold-magic" size={36} />
            <h1 className="text-4xl font-bold text-purple-wizzy">MathMagic</h1>
          </div>
          <h2 className="text-2xl font-bold text-purple-wizzy">Create an Account</h2>
          <p className="text-gray-500 mt-1">Start your child's learning adventure</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
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
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-wizzy/40 focus:border-purple-wizzy"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  minLength={8}
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
              <p className="text-xs text-gray-400 mt-1">At least 8 characters</p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-purple-wizzy text-white rounded-xl py-3 font-semibold hover:bg-purple-wizzy/90 disabled:opacity-60 transition-colors mt-2"
            >
              <Sparkles className="text-gold-magic" size={18} />
              {isLoading ? 'Creating account...' : 'Create Account'}
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
                text="signup_with"
                onSuccess={async (credentialResponse) => {
                  if (!credentialResponse.credential) {
                    toast.error('Google sign up did not return a credential');
                    return;
                  }
                  await handleGoogleRegister(credentialResponse.credential);
                }}
                onError={() => {
                  toast.error('Google sign up failed');
                }}
              />
            </div>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-purple-wizzy font-medium hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
