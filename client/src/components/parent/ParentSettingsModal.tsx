import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { X, Bell, Lock, Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { notificationService } from '../../services/notificationService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function WeeklyReportSetting() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    notificationService
      .get()
      .then((prefs) => setEnabled(prefs.weeklyReportOptIn))
      .catch(() => setEnabled(true));
  }, []);

  const handleToggle = async () => {
    if (enabled === null || isToggling) return;
    const next = !enabled;
    setEnabled(next);
    setIsToggling(true);
    try {
      await notificationService.update(next);
    } catch (err) {
      setEnabled(!next);
      toast.error(err instanceof Error ? err.message : 'Failed to update preference');
    } finally {
      setIsToggling(false);
    }
  };

  const handleSendNow = async () => {
    setIsSending(true);
    try {
      const result = await notificationService.sendWeeklyReportNow();
      if (result.sent) {
        toast.success('Report sent to your inbox!');
      } else if (result.reason === 'no-activity') {
        toast.error("No activity yet this week — there's nothing to report.");
      } else if (result.reason === 'resend-not-configured') {
        toast.error('Email sending is not configured yet.');
      } else {
        toast.error('Could not send the report. Please try again.');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send report');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">Weekly Progress Report</p>
          <p className="text-xs text-gray-400 mt-0.5">Weekly learning summary per child</p>
        </div>
        <button
          onClick={handleToggle}
          disabled={enabled === null}
          className="w-10 h-5 rounded-full relative transition-colors disabled:opacity-50"
          style={{ backgroundColor: enabled ? 'rgb(139,92,246)' : 'rgb(229,231,235)' }}
          aria-label="Toggle Weekly Progress Report"
        >
          <span
            className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all"
            style={{ left: enabled ? '22px' : '2px' }}
          />
        </button>
      </div>
      <button
        onClick={handleSendNow}
        disabled={isSending}
        className="mt-2 flex items-center gap-1.5 text-xs text-purple-wizzy hover:text-purple-wizzy/80 font-medium disabled:opacity-60"
      >
        <Send size={12} />
        {isSending ? 'Sending…' : 'Send Weekly Report Now'}
      </button>
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
                <WeeklyReportSetting />
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
