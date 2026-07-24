import { useEffect, useMemo, useRef, useState } from 'react';
import type { IBadge, BadgeDefinition } from '@mathmagic/types';
import { fetchBadgeDefinitions, getCachedBadgeDefinitions } from '../../services/badgeService';
import { BadgeIcon } from './BadgeIcon';

interface BadgeListModalProps {
  open: boolean;
  onClose: () => void;
  earnedBadges: IBadge[];
}

/** Full badge catalogue — earned badges first, locked ones dimmed below. */
export function BadgeListModal({ open, onClose, earnedBadges }: BadgeListModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Trap focus in the dialog and restore it to the trigger on close.
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="My Badges"
        tabIndex={-1}
        className="w-full max-w-lg max-h-[80vh] overflow-y-auto scrollbar-hide rounded-3xl bg-white p-6 shadow-2xl outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fresh mount every open: fetch + list rendering live here so `loading`
            starts true on the very first painted frame of each open (cold cache). */}
        <BadgeListContent earnedBadges={earnedBadges} onClose={onClose} />
      </div>
    </div>
  );
}

interface BadgeListContentProps {
  earnedBadges: IBadge[];
  onClose: () => void;
}

/**
 * Owns the header row, the badge-definition fetch, and the earned/locked
 * list. Mounted fresh every time the modal opens (the parent returns null
 * while closed), so `loading`'s initial value is already correct on first
 * paint — no effect ever needs to turn it on, and a previous open's error
 * can't flash before the effect corrects it.
 */
function BadgeListContent({ earnedBadges, onClose }: BadgeListContentProps) {
  const [definitions, setDefinitions] = useState<BadgeDefinition[]>(
    () => getCachedBadgeDefinitions() ?? []
  );
  const [loading, setLoading] = useState(() => getCachedBadgeDefinitions() === null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    fetchBadgeDefinitions()
      .then((defs) => {
        if (active) setDefinitions(defs);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const earnedByType = useMemo(
    () => new Map(earnedBadges.map((b) => [b.badgeType, b])),
    [earnedBadges]
  );

  // Earned first, then locked; each group keeps definition order.
  const ordered = useMemo(() => {
    const earned = definitions.filter((d) => earnedByType.has(d.badgeType));
    const locked = definitions.filter((d) => !earnedByType.has(d.badgeType));
    return [...earned, ...locked];
  }, [definitions, earnedByType]);

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">🏅 My Badges</h2>
        <div className="flex items-center gap-3">
          {!loading && !error && (
            <span className="text-sm font-semibold text-gray-500">
              {earnedByType.size} of {definitions.length}
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close badge list"
            className="rounded-full px-2 text-2xl leading-none text-gray-400 hover:text-gray-700"
          >
            ×
          </button>
        </div>
      </div>

      {loading && <p className="py-8 text-center text-gray-400">Loading badges…</p>}
      {error && (
        <p className="py-8 text-center text-gray-400">
          Could not load badges. Please try again.
        </p>
      )}

      {!loading && !error && (
        <ul className="flex flex-col gap-3">
          {ordered.map((def) => {
            const earned = earnedByType.get(def.badgeType);
            return (
              <li
                key={def.id}
                aria-label={earned ? def.badgeName : `${def.badgeName} (locked)`}
                className="flex items-start gap-4 rounded-2xl border p-4"
                style={{
                  borderColor: earned ? 'rgba(139,92,246,0.25)' : 'rgba(0,0,0,0.06)',
                  background: earned ? 'rgba(139,92,246,0.04)' : 'transparent',
                }}
              >
                <BadgeIcon src={def.iconUrl} alt={def.badgeName} size={56} locked={!earned} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-800">{def.badgeName}</p>
                  <p className="mt-0.5 text-sm text-gray-600">{def.description}</p>
                  <p className="mt-1.5 text-xs font-medium text-gray-400">
                    {earned ? '🔓' : '🔒'} {def.unlockCondition}
                  </p>
                  {earned && (
                    <p className="mt-1 text-xs font-semibold text-violet-500">
                      Earned {new Date(earned.earnedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
