import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { toast } from 'sonner';
import { Lock, LogOut, Plus, Pencil } from 'lucide-react';
import mathmagicLogo from '@/assets/mathmagic-logo.png';
import { ParentLoader } from '@/components/loaders';
import { ProfileCard } from '@/components/profiles';
import MagicBackground from '@/components/MagicBackground';
import { useAuth } from '@/hooks/useAuth';
import { childService } from '@/services/childService';
import type { IChild } from '@mathmagic/types';

const PAGE_BG = 'linear-gradient(150deg, #fdf4ff 0%, #fef3c7 55%, #ede9fe 100%)';

export default function ProfileSelectionPage() {
  const { user, setActiveChild, logout } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState<IChild[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const firstName = (user as { name?: string } | null)?.name?.split(' ')[0] ?? null;

  useEffect(() => {
    let active = true;
    childService
      .getAll()
      .then((data) => { if (active) setChildren(data); })
      .catch(() => { if (active) toast.error('Failed to load profiles'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const handleSelect = (child: IChild) => {
    setActiveChild(child);
    navigate('/child/dashboard');
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch {
      toast.error('Logout failed');
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center p-6 overflow-hidden" style={{ background: PAGE_BG }}>
      <MagicBackground symbols="stars" count={20} opacity={0.09} />

      {/* Header */}
      <div className="relative z-10 w-full flex items-center justify-between mb-10">
        <img src={mathmagicLogo} alt="MathMagic" className="h-14 w-auto" />
        <div className="flex items-center gap-3">
          <Link
            to="/parent"
            className="flex items-center gap-1.5 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-md transition-all hover:scale-105 hover:shadow-lg"
            style={{ background: 'linear-gradient(90deg, #8b5cf6, #6d28d9)' }}
          >
            <Lock size={13} />
            Parent Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors px-3 py-2 rounded-full hover:bg-red-50"
          >
            <LogOut size={13} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Hero heading */}
      <div className="relative z-10 text-center mb-10">
        {firstName && (
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold text-purple-wizzy mb-3"
            style={{ background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.2)' }}
          >
            👋 Welcome back, {firstName}!
          </div>
        )}
        <h1 className="text-4xl font-black gradient-text">Who is learning today?</h1>
        <p className="text-gray-500 mt-2 text-base">Choose a profile to continue the adventure</p>

        {/* Decorative stars */}
        <span className="absolute -top-4 -left-8 text-3xl opacity-30 animate-float select-none">✦</span>
        <span className="absolute -top-2 -right-10 text-2xl opacity-20 select-none" style={{ animation: 'particle-float-b 5s ease-in-out 1s infinite' }}>★</span>
      </div>

      {/* Profile grid */}
      {isLoading ? (
        <div className="relative z-10">
          <ParentLoader message="Loading profiles…" />
        </div>
      ) : (
        <div className="relative z-10 flex flex-wrap justify-center gap-8 max-w-[960px]">
          {children.map((child) => (
            <div key={child._id} className="relative group">
              <ProfileCard child={child} onSelect={handleSelect} />
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/profiles/avatar/${child._id}`); }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-purple-wizzy/10 text-gray-400 hover:text-purple-wizzy transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                title="Edit avatar"
              >
                <Pencil size={12} />
              </button>
            </div>
          ))}

          {/* Add child card */}
          <button
            onClick={() => navigate('/parent')}
            className="group relative w-44 h-60 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-200 hover:scale-105"
            style={{
              borderColor: 'rgba(139,92,246,0.25)',
              background: 'rgba(255,255,255,0.5)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(139,92,246,0.55)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(139,92,246,0.25)'; }}
          >
            <div className="relative w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-200 group-hover:scale-110"
              style={{ background: 'rgba(139,92,246,0.08)' }}>
              <Plus size={28} className="text-purple-wizzy/50 group-hover:text-purple-wizzy transition-colors" />
              {/* Pulse ring */}
              <div className="absolute inset-0 rounded-full border-2 border-purple-wizzy/20 group-hover:border-purple-wizzy/40 transition-colors" />
            </div>
            <p className="text-sm text-gray-400 group-hover:text-purple-wizzy transition-colors font-semibold">
              Add Child
            </p>
            <p className="text-xs text-gray-300 mt-1 group-hover:text-purple-wizzy/60 transition-colors text-center px-4">
              Start a new adventure
            </p>
          </button>
        </div>
      )}

      {/* Manage profiles link */}
      <div className="relative z-10 mt-12">
        <Link
          to="/parent"
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-purple-wizzy transition-colors px-4 py-2 rounded-full hover:bg-purple-wizzy/5"
        >
          <Lock size={13} />
          Manage Profiles
        </Link>
      </div>
    </div>
  );
}
