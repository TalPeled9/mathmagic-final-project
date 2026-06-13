import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { GradientRing } from '@/components/loaders';
import MagicBackground from '@/components/MagicBackground';
import wizzyImg from '@/assets/wizzy.png';
import { childService } from '../../services/childService';
import type { GradeLevel } from '@mathmagic/types';

const GRADES: GradeLevel[] = [1, 2, 3, 4, 5, 6];

export default function AddFirstChildPage() {
  const navigate = useNavigate();

  const [childName, setChildName] = useState('');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await childService.create({ name: childName, gradeLevel });
      toast.success("Child profile created! Let's get started ✨");
      navigate('/profiles');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create child profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen flex flex-col items-center p-4 py-8 overflow-hidden"
      style={{ background: 'linear-gradient(150deg, #fdf4ff 0%, #fef3c7 55%, #ede9fe 100%)' }}
    >
      <MagicBackground symbols="mixed" count={18} opacity={0.09} />

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo + Wizzy */}
        <div className="text-center mb-6">
          <Link to="/" className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="text-gold-magic" size={28} />
            <span className="text-3xl font-black text-purple-wizzy">MathMagic</span>
          </Link>

          <img
            src={wizzyImg}
            alt="Wizzy the Wizard"
            className="w-24 h-24 object-contain mx-auto mb-4 drop-shadow-xl"
            style={{ animation: 'mm-float 3s ease-in-out infinite' }}
          />

          <h2 className="text-2xl font-black gradient-text">One last step!</h2>
          <p className="text-gray-500 text-sm mt-2">
            Set up your child's profile to begin their learning adventure
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            className="rounded-2xl p-6 space-y-5"
            style={{
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(139,92,246,0.15)',
              boxShadow: '0 8px 32px rgba(139,92,246,0.12)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
              >
                ✨
              </div>
              <h3 className="font-bold text-purple-wizzy">Create Your Child's Profile</h3>
            </div>
            <p className="text-xs text-gray-400">
              Each child gets their own personalized learning experience with progress tracking and achievements. You can add more children later!
            </p>

            {/* Child name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Child's Name</label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="Enter child's first name"
                maxLength={50}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-wizzy/30 focus:border-purple-wizzy transition-shadow focus:shadow-[0_0_0_3px_rgba(139,92,246,0.10)]"
              />
            </div>

            {/* Grade level — button grid */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
              <div className="grid grid-cols-6 gap-2">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGradeLevel(g)}
                    className="py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
                    style={
                      gradeLevel === g
                        ? {
                            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(139,92,246,0.4)',
                          }
                        : {
                            background: 'rgba(139,92,246,0.06)',
                            color: '#6b7280',
                            border: '1px solid rgba(139,92,246,0.1)',
                          }
                    }
                  >
                    {g}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Grade {gradeLevel} selected
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 flex items-center justify-center gap-2 text-white rounded-xl py-3.5 font-bold disabled:opacity-60 transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
            style={{ background: 'linear-gradient(90deg, #8b5cf6 0%, #6d28d9 100%)' }}
          >
            {isLoading ? <GradientRing size={18} thickness={2.5} label="" /> : <Sparkles size={18} className="text-gold-magic" />}
            {isLoading ? 'Creating profile...' : "Create Child's Profile"}
            {!isLoading && <Sparkles size={18} className="text-gold-magic" />}
          </button>
        </form>
      </div>
    </div>
  );
}
