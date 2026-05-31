import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, RefreshCw, Check } from 'lucide-react';
import { ParentLoader } from '@/components/loaders';
import mathmagicLogo from '@/assets/mathmagic-logo.png';
import defaultAvatar from '@/assets/default_avatar.png';
import { childService } from '@/services/childService';
import type { IChild } from '@mathmagic/types';

const REJECTION_MESSAGES: Record<string, string> = {
  gibberish:
    "That doesn't sound like a description — try something like 'a dragon wearing sunglasses'!",
  unrelated:
    "That doesn't sound like a description — try something like 'a robot wearing a crown'!",
  unsafe: "Hmm, let's keep it friendly! Try describing a fun character instead.",
};

export default function EditAvatarPage() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const [child, setChild] = useState<IChild | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [awaitingReplace, setAwaitingReplace] = useState(false);

  useEffect(() => {
    if (!childId) return;
    childService
      .getOne(childId)
      .then(setChild)
      .catch(() => {
        toast.error('Profile not found');
        navigate('/profiles');
      })
      .finally(() => setIsLoading(false));
  }, [childId, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <ParentLoader message="Loading…" />
      </div>
    );
  }

  if (!child) return null;

  const quotaExhausted = child.weeklyGenerationsRemaining <= 0;
  // slots 1, 2, 3 are generated; slot 0 is always the default
  const generatedCount = child.avatars.length - 1;
  const allGenerated = generatedCount >= 3;

  const handleSetActive = async (index: number) => {
    if (index === child.activeAvatarIndex) return;
    try {
      const updated = await childService.setActiveAvatar(child._id, { avatarIndex: index });
      setChild(updated);
    } catch {
      toast.error('Failed to switch avatar. Please try again.');
    }
  };

  const handleGenerate = () => {
    if (!description.trim() || quotaExhausted) return;
    if (allGenerated) {
      setAwaitingReplace(true);
    } else {
      doGenerate(undefined);
    }
  };

  const doGenerate = async (replaceIndex: number | undefined) => {
    setAwaitingReplace(false);
    setIsGenerating(true);
    try {
      const updated = await childService.generateAvatar(child._id, {
        description: description.trim(),
        replaceIndex,
      });
      setChild(updated);
      setDescription('');
      toast.success('New avatar created!');
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      toast.error(
        REJECTION_MESSAGES[message] ?? (message || 'Failed to generate avatar. Please try again.')
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // 2x2 grid: position 0 = default (always slot 0), positions 1-3 = generated (slots 1-3)
  const gridItems = [
    { avatarIndex: 0, isDefault: true },
    { avatarIndex: 1, isDefault: false },
    { avatarIndex: 2, isDefault: false },
    { avatarIndex: 3, isDefault: false },
  ];

  return (
    <div className="min-h-screen bg-parchment flex flex-col items-center p-6">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-10">
        <Link
          to="/profiles"
          className="flex items-center gap-2 text-base text-gray-500 hover:text-purple-wizzy transition-colors px-4 py-2 rounded-full hover:bg-purple-wizzy/10 font-medium"
        >
          <ArrowLeft size={16} />
          Back to Profiles
        </Link>
        <img src={mathmagicLogo} alt="MathMagic" className="h-16 w-auto" />
      </div>

      <h1 className="text-3xl font-bold text-purple-wizzy mb-8">
        Describe your character and bring it to life!
      </h1>

      {/* Main content */}
      <div className="flex gap-6 items-start">
        {/* Left: child info card + generate form */}
        <div className="w-72 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-5">
            <p className="font-bold text-xl text-gray-800 text-center">{child.name}</p>

            {/* Quota */}
            {!quotaExhausted ? (
              <p className="text-sm text-gray-400 text-center">
                {child.weeklyGenerationsRemaining} generation
                {child.weeklyGenerationsRemaining !== 1 ? 's' : ''} left this week
              </p>
            ) : (
              <p className="text-sm text-amber-500 font-medium text-center">
                All generations used this week.
                {child.weeklyGenerationsDaysUntilReset > 0 &&
                  ` Resets in ${child.weeklyGenerationsDaysUntilReset} day${child.weeklyGenerationsDaysUntilReset !== 1 ? 's' : ''}.`}
              </p>
            )}

            {/* Generate form or replace picker */}
            {awaitingReplace ? (
              <div>
                <p className="text-sm text-gray-600 font-medium mb-3">Which avatar to replace?</p>
                <div className="flex gap-2 flex-wrap">
                  {child.avatars.slice(1).map((slot, i) => (
                    <button
                      key={i}
                      onClick={() => doGenerate(i + 1)}
                      className="w-14 h-14 rounded-xl overflow-hidden border-2 border-gray-200 hover:border-purple-wizzy transition-colors"
                    >
                      <img
                        src={slot.imageData || defaultAvatar}
                        alt={`Avatar ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setAwaitingReplace(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 mt-3"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 'a robot wearing a crown'"
                  maxLength={200}
                  rows={4}
                  disabled={isGenerating || quotaExhausted}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-wizzy/30 focus:border-purple-wizzy disabled:opacity-50"
                />
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !description.trim() || quotaExhausted}
                  className="flex items-center justify-center gap-2 w-full bg-purple-wizzy text-white rounded-xl py-3 text-sm font-semibold hover:bg-purple-wizzy/90 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
                  {isGenerating ? 'Generating…' : 'Generate Avatar'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: 2x2 avatar grid — fixed width so squares stay small */}
        <div className="w-[290px] flex-shrink-0">
          <div className="grid grid-cols-2 gap-3">
            {gridItems.map(({ avatarIndex, isDefault }) => {
              const slot = child.avatars[avatarIndex];
              const isActive = avatarIndex === child.activeAvatarIndex;
              const hasImage = isDefault || !!slot?.imageData;
              const imgSrc = isDefault ? defaultAvatar : slot?.imageData || null;

              return (
                <button
                  key={avatarIndex}
                  onClick={() => hasImage && !isGenerating && handleSetActive(avatarIndex)}
                  disabled={!hasImage || isGenerating}
                  className={`relative aspect-square rounded-2xl overflow-hidden border-4 transition-all duration-150 ${
                    isActive && hasImage
                      ? 'border-purple-wizzy shadow-lg scale-[1.02]'
                      : hasImage
                        ? 'border-gray-200 hover:border-purple-wizzy/50 cursor-pointer'
                        : 'border-dashed border-gray-200 cursor-default'
                  }`}
                >
                  {hasImage ? (
                    <>
                      <img
                        src={imgSrc!}
                        alt={isDefault ? 'Default avatar' : `Avatar ${avatarIndex}`}
                        className="w-full h-full object-cover mix-blend-multiply"
                      />
                      {isActive && (
                        <div className="absolute bottom-2 right-2 bg-purple-wizzy rounded-full p-1 shadow">
                          <Check size={10} className="text-white" />
                        </div>
                      )}
                      {isDefault && (
                        <div className="absolute top-2 left-2 bg-black/50 rounded-full px-2 py-0.5 text-[10px] text-white leading-tight">
                          Default
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center gap-1">
                      <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <span className="text-gray-300 text-xl leading-none">+</span>
                      </div>
                      <p className="text-xs text-gray-300">Empty</p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
