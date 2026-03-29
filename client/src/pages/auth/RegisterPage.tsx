import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen bg-parchment flex flex-col items-center p-4 py-8">
      <div className="w-full max-w-lg">
        {/* Back to Home */}
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-purple-wizzy hover:text-purple-wizzy/80 transition-colors font-medium mb-6"
        >
          <ArrowLeft size={15} />
          Back to Home
        </Link>

        {/* Logo + heading */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="text-gold-magic" size={32} />
            <span className="text-4xl font-bold text-purple-wizzy">MathMagic</span>
          </div>
          <h2 className="text-xl font-bold text-purple-wizzy">Welcome to MathMagic</h2>
          <p className="text-gray-500 text-sm mt-1">
            Create your family account and set up your child's learning journey
          </p>
        </div>

        {/* Single unified card */}
        <form onSubmit={handleSubmit}>
          <div className="bg-violet-50 rounded-2xl p-6 space-y-6">
            {/* ── Section 1: Your Details ── */}
            <div className="space-y-4">
              <h3 className="font-semibold text-purple-wizzy">Your Details</h3>

              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Username</label>
                <div className="relative">
                  <User
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="letters, numbers, underscores"
                    minLength={3}
                    maxLength={50}
                    required
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-wizzy/30 focus:border-purple-wizzy placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-wizzy/30 focus:border-purple-wizzy placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Password</label>
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a secure password"
                    minLength={8}
                    required
                    className="w-full pl-9 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-wizzy/30 focus:border-purple-wizzy placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">At least 8 characters</p>
              </div>
            </div>

          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-purple-wizzy text-white rounded-xl py-3.5 font-semibold hover:bg-purple-wizzy/90 disabled:opacity-60 transition-colors"
          >
            <Sparkles size={18} className="text-gold-magic" />
            {isLoading ? 'Creating account...' : 'Create Account'}
            <Sparkles size={18} className="text-gold-magic" />
          </button>

          <div className="relative py-3">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <span className="relative bg-parchment px-2 text-xs text-gray-400">or</span>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              locale="en_US"
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

          <p className="text-center text-xs text-gray-400 mt-3">
            By creating an account, you agree to our{' '}
            <button
              type="button"
              className="text-purple-wizzy underline hover:text-purple-wizzy/80"
            >
              Terms of Service
            </button>{' '}
            and{' '}
            <button
              type="button"
              className="text-purple-wizzy underline hover:text-purple-wizzy/80"
            >
              Privacy Policy
            </button>
          </p>

          <p className="text-center text-sm text-gray-500 mt-3">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-wizzy font-medium hover:underline">
              Sign in here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
