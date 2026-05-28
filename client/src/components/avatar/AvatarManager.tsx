import { useState } from 'react';
import { RefreshCw, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { childService } from '../../services/childService';
import type { IChild, AvatarSlot } from '@mathmagic/types';
import defaultAvatar from '@/assets/default_avatar.png';

interface AvatarManagerProps {
  child: IChild;
  onChildUpdated: (child: IChild) => void;
}

const REJECTION_MESSAGES: Record<string, string> = {
  gibberish:
    "That doesn't sound like an avatar description — try something like 'a dragon wearing sunglasses'!",
  unrelated:
    "That doesn't sound like an avatar description — try something like 'a robot wearing a crown'!",
  unsafe: "Hmm, let's keep it friendly! Try describing a fun character instead.",
};

export function AvatarManager({ child, onChildUpdated }: AvatarManagerProps) {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [awaitingReplaceIndex, setAwaitingReplaceIndex] = useState(false);

  const activeSlot: AvatarSlot | undefined = child.avatars[child.activeAvatarIndex];
  const quotaExhausted = child.weeklyGenerationsRemaining <= 0;

  const handleGenerate = () => {
    if (!description.trim() || quotaExhausted) return;
    if (child.avatars.length >= 3) {
      setAwaitingReplaceIndex(true);
    } else {
      doGenerate(undefined);
    }
  };

  const doGenerate = async (replaceIndex: number | undefined) => {
    setAwaitingReplaceIndex(false);
    setIsGenerating(true);
    try {
      const updated = await childService.generateAvatar(child._id, {
        description: description.trim(),
        replaceIndex,
      });
      onChildUpdated(updated);
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

  const handleSetActive = async (index: number) => {
    if (index === child.activeAvatarIndex) return;
    try {
      const updated = await childService.setActiveAvatar(child._id, { avatarIndex: index });
      onChildUpdated(updated);
    } catch {
      toast.error('Failed to switch avatar. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Avatar slots */}
      <div className="flex gap-4">
        {[0, 1, 2].map((index) => {
          const slot = child.avatars[index];
          const isActive = index === child.activeAvatarIndex && !!slot;
          return (
            <button
              key={index}
              onClick={() => slot && handleSetActive(index)}
              disabled={!slot || isGenerating}
              className={`w-20 h-20 rounded-full overflow-hidden border-4 transition-all ${
                isActive
                  ? 'border-purple-wizzy shadow-lg scale-105'
                  : 'border-gray-200 hover:border-purple-wizzy/50'
              } ${!slot ? 'cursor-default' : 'cursor-pointer'}`}
            >
              {slot ? (
                <img
                  src={slot.imageData || defaultAvatar}
                  alt={`Avatar ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <Plus size={24} className="text-gray-300" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Active indicator */}
      {activeSlot && (
        <div className="flex items-center gap-1 text-xs text-purple-wizzy font-medium">
          <Check size={12} />
          Active avatar
        </div>
      )}

      {/* Replace slot picker (shown when all 3 slots full and Generate clicked) */}
      {awaitingReplaceIndex && (
        <div className="w-full bg-purple-wizzy/5 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-600 mb-3 font-medium">
            Which avatar do you want to replace?
          </p>
          <div className="flex gap-3 justify-center items-center">
            {child.avatars.map((slot, index) => (
              <button
                key={index}
                onClick={() => doGenerate(index)}
                className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-200 hover:border-purple-wizzy transition-colors"
              >
                <img
                  src={slot.imageData}
                  alt={`Avatar ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
            <button
              onClick={() => setAwaitingReplaceIndex(false)}
              className="text-xs text-gray-400 hover:text-gray-600 ml-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Quota indicator */}
      <div className="text-center">
        {!quotaExhausted ? (
          <p className="text-xs text-gray-400">
            {child.weeklyGenerationsRemaining} generation
            {child.weeklyGenerationsRemaining !== 1 ? 's' : ''} left this week
          </p>
        ) : (
          <p className="text-xs text-amber-500 font-medium">
            You've used all your generations this week!
            {child.weeklyGenerationsDaysUntilReset > 0 &&
              ` Come back in ${child.weeklyGenerationsDaysUntilReset} day${
                child.weeklyGenerationsDaysUntilReset !== 1 ? 's' : ''
              }.`}
          </p>
        )}
      </div>

      {/* Description input + generate button */}
      {!awaitingReplaceIndex && (
        <div className="w-full space-y-2">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your character… e.g. 'a robot wearing a crown'"
            maxLength={200}
            rows={2}
            disabled={isGenerating || quotaExhausted}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-wizzy/30 focus:border-purple-wizzy disabled:opacity-50"
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !description.trim() || quotaExhausted}
            className="flex items-center justify-center gap-2 w-full bg-purple-wizzy text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-purple-wizzy/90 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
            {isGenerating ? 'Generating…' : 'Generate Avatar'}
          </button>
        </div>
      )}
    </div>
  );
}
