import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { toast } from 'sonner';
import { Lock, LogOut, Plus, Pencil } from 'lucide-react';
import mathmagicLogo from '@/assets/mathmagic-logo.png';
import { ParentLoader } from '@/components/loaders';
import { ProfileCard } from '@/components/profiles';
import { useAuth } from '@/hooks/useAuth';
import { childService } from '@/services/childService';
import type { IChild } from '@mathmagic/types';

export default function ProfileSelectionPage() {
  const { setActiveChild, logout } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState<IChild[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    <div className="min-h-screen bg-parchment flex flex-col items-center p-6">
      <div className="w-full flex items-center justify-between mb-12">
        <img src={mathmagicLogo} alt="MathMagic" className="h-16 w-auto" />
        <div className="flex items-center gap-3">
          <Link
            to="/parent"
            className="flex items-center gap-1.5 bg-purple-wizzy text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-purple-wizzy/90 transition-colors"
          >
            <Lock size={14} />
            Parent Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors px-3 py-2 rounded-full hover:bg-red-50"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </div>

      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-purple-wizzy">Who is learning today?</h1>
        <p className="text-gray-500 mt-2">Choose a profile to continue the adventure</p>
      </div>

      {isLoading ? (
        <ParentLoader message="Loading profiles…" />
      ) : (
        <div className="flex flex-wrap justify-center gap-10 max-w-[900px]">
          {children.length === 0 ? (
            <button
              onClick={() => navigate('/parent')}
              className="group w-40 flex flex-col items-center justify-center bg-white/60 rounded-2xl border-2 border-dashed border-gray-200 hover:border-purple-wizzy/40 hover:bg-purple-wizzy/5 transition-all h-52"
            >
              <div className="w-16 h-16 rounded-full bg-gray-100 group-hover:bg-purple-wizzy/10 flex items-center justify-center transition-colors mb-3">
                <Plus size={28} className="text-gray-300 group-hover:text-purple-wizzy transition-colors" />
              </div>
              <p className="text-sm text-gray-400 group-hover:text-purple-wizzy transition-colors font-medium">
                Add Child
              </p>
            </button>
          ) : (
            children.map((child) => (
              <div key={child._id} className="relative group">
                <ProfileCard child={child} onSelect={handleSelect} />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/profiles/avatar/${child._id}`);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-purple-wizzy/10 text-gray-400 hover:text-purple-wizzy transition-colors opacity-0 group-hover:opacity-100"
                  title="Edit avatar"
                >
                  <Pencil size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-10">
        <Link
          to="/parent"
          className="text-sm text-gray-400 hover:text-purple-wizzy underline transition-colors"
        >
          Manage Profiles
        </Link>
      </div>
    </div>
  );
}
