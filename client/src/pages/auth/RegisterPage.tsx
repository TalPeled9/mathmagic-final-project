import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User, Users, Sparkles, Lightbulb } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { childService } from '../../services/childService';
import type { GradeLevel } from '@mathmagic/types';

const GRADES: GradeLevel[] = [1, 2, 3, 4, 5, 6];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [childName, setChildName] = useState('');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(1);
  const [avatarDescription, setAvatarDescription] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register({ username, email, password });
      await childService.create({
        name: childName,
        gradeLevel,
        avatarDescription: avatarDescription.trim() || undefined,
      });
      toast.success('Account created! Welcome to MathMagic ✨');
      navigate('/profiles');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
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
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-purple-wizzy text-white text-sm font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <h3 className="font-semibold text-purple-wizzy">Your Details</h3>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Username</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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

            {/* ── Section 2: Child Profile ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-cyan-500 text-white text-sm font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <h3 className="font-semibold text-cyan-500">Create Your Child's Profile</h3>
              </div>
              <p className="text-xs text-gray-500">
                Each child gets their own personalized learning experience with progress tracking
                and achievements. You can add more children later!
              </p>

              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Child's Name</label>
                <div className="relative">
                  <Users size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="Enter child's first name"
                    maxLength={50}
                    required
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Grade Level</label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(Number(e.target.value) as GradeLevel)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
                >
                  {GRADES.map((g) => (
                    <option key={g} value={g}>
                      Grade {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1.5">
                  Describe Your Child's Avatar{' '}
                  <span className="text-gray-400">(Optional)</span>
                </label>
                <textarea
                  value={avatarDescription}
                  onChange={(e) => setAvatarDescription(e.target.value)}
                  placeholder="Example: A friendly astronaut with curly hair and a big smile, wearing an orange space suit..."
                  maxLength={200}
                  rows={3}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-400 mt-1">
                  <Lightbulb size={14} className="inline-block mr-1 text-gold-magic" />
                  Describe what you'd like the avatar to look like. We'll create a custom cartoon
                  character for your child!
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-purple-wizzy text-white rounded-xl py-3.5 font-semibold hover:bg-purple-wizzy/90 disabled:opacity-60 transition-colors"
          >
            <Sparkles size={18} className='text-gold-magic' />
            {isLoading ? 'Creating account...' : 'Create Account & Add Child'}
            <Sparkles size={18} className='text-gold-magic' />
          </button>

          <p className="text-center text-xs text-gray-400 mt-3">
            By creating an account, you agree to our{' '}
            <button type="button" className="text-purple-wizzy underline hover:text-purple-wizzy/80">Terms of Service</button>
            {' '}and{' '}
            <button type="button" className="text-purple-wizzy underline hover:text-purple-wizzy/80">Privacy Policy</button>
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
