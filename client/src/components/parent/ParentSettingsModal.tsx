import { useEffect } from 'react';
import { X, Bell, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function PlaceholderToggle({ label, description }: { label: string; description?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Soon</span>
        <button
          disabled
          className="w-10 h-5 bg-gray-100 rounded-full relative cursor-not-allowed"
          aria-label={`Toggle ${label}`}
        >
          <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
        </button>
      </div>
    </div>
  );
}

export function ParentSettingsModal({ isOpen, onClose }: Props) {
  const { user } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        style={{ backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto"
          style={{ animation: 'pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-wizzy to-violet-700 px-5 py-4 flex items-center justify-between">
            <h2 className="font-bold text-white text-base">Account Settings</h2>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors rounded-lg p-1 hover:bg-white/10"
              aria-label="Close settings"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto max-h-[70vh] p-5 space-y-5">
            {/* Notifications */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Bell size={15} className="text-purple-wizzy" />
                <h3 className="font-semibold text-gray-700 text-sm">Notifications</h3>
              </div>
              <div className="bg-gray-50 rounded-xl px-4">
                <PlaceholderToggle
                  label="Weekly Progress Report"
                  description="Weekly learning summary per child"
                />
                <PlaceholderToggle
                  label="Milestone Alerts"
                  description="Badges, level-ups and streaks"
                />
                <PlaceholderToggle
                  label="Streak Reminders"
                  description="Daily nudges to keep the streak going"
                />
              </div>
            </div>

            {/* Account */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lock size={15} className="text-purple-wizzy" />
                <h3 className="font-semibold text-gray-700 text-sm">Your Account</h3>
              </div>
              <div className="bg-gray-50 rounded-xl px-4">
                <div className="py-3 border-b border-gray-100">
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm font-medium text-gray-700 mt-0.5 truncate">
                    {user?.email ?? '—'}
                  </p>
                </div>
                <div className="py-3 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Password</p>
                    <p className="text-xs text-gray-400 mt-0.5">Change your account password</p>
                  </div>
                  <button
                    disabled
                    className="text-xs text-gray-400 bg-gray-200 px-3 py-1.5 rounded-lg cursor-not-allowed"
                  >
                    Coming soon
                  </button>
                </div>
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Google Account</p>
                    <p className="text-xs text-gray-400 mt-0.5">Authentication provider</p>
                  </div>
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-medium">
                    ✓ Linked
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-100">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-purple-wizzy text-white text-sm font-semibold hover:bg-purple-wizzy/90 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
