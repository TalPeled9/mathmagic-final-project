import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Sparkles, Plus, Settings, LogOut, Star, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { childService } from '../../services/childService';
import type { IChild } from '@mathmagic/types';

export default function ProfileSelectionPage() {
  const { user, setActiveChild, logout } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState<IChild[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    childService
      .getAll()
      .then(setChildren)
      .catch(() => toast.error('Failed to load profiles'))
      .finally(() => setIsLoading(false));
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
      {/* Header */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Sparkles className="text-gold-magic" size={24} />
          <span className="text-xl font-bold text-purple-wizzy">MathMagic</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/parent')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-wizzy transition-colors px-3 py-1.5 rounded-lg hover:bg-purple-wizzy/10"
          >
            <Settings size={15} />
            Manage
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Greeting */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-purple-wizzy">
          Welcome back{user?.name ? `, ${user.name}` : ''}!
        </h1>
        <p className="text-gray-500 mt-1">Who's ready for a math adventure today?</p>
      </div>

      {/* Profiles grid */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-400 mt-16">
          <Sparkles size={20} className="animate-pulse" />
          <span>Loading profiles...</span>
        </div>
      ) : (
        <div className="w-full max-w-2xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {children.map((child) => (
              <button
                key={child._id}
                onClick={() => handleSelect(child)}
                className="group flex flex-col items-center gap-3 bg-white rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all border-2 border-transparent hover:border-purple-wizzy/30"
              >
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-purple-wizzy/20 group-hover:border-purple-wizzy/50 transition-colors">
                  {child.avatarUrl ? (
                    <img
                      src={child.avatarUrl}
                      alt={child.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-purple-wizzy/10 flex items-center justify-center">
                      <span className="text-2xl font-bold text-purple-wizzy">
                        {child.name[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <p className="font-semibold text-gray-800 group-hover:text-purple-wizzy transition-colors">
                    {child.name}
                  </p>
                  <p className="text-xs text-gray-400">Grade {child.gradeLevel}</p>
                </div>

                {/* Mini stats */}
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-0.5">
                    <Zap size={11} className="text-gold-magic" />
                    {child.totalXP}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Star size={11} className="text-yellow-400" />
                    {child.totalStars}
                  </span>
                </div>
              </button>
            ))}

            {/* Add child card */}
            <button
              onClick={() => navigate('/parent')}
              className="flex flex-col items-center justify-center gap-3 bg-white/60 rounded-2xl p-5 border-2 border-dashed border-gray-200 hover:border-purple-wizzy/40 hover:bg-purple-wizzy/5 transition-all group"
            >
              <div className="w-20 h-20 rounded-full bg-gray-100 group-hover:bg-purple-wizzy/10 flex items-center justify-center transition-colors">
                <Plus size={28} className="text-gray-300 group-hover:text-purple-wizzy transition-colors" />
              </div>
              <p className="text-sm text-gray-400 group-hover:text-purple-wizzy transition-colors font-medium">
                Add Child
              </p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
