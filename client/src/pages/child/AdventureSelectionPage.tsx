import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Sparkles, ArrowLeft, Wand2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdventure } from '@/hooks/useAdventure';
import { adventureService } from '@/services/adventureService';
import type { MathTopicConfig, StoryWorldConfig } from '@mathmagic/types';

const WORLD_EMOJIS: Record<string, string> = {
  space: '🚀',
  fantasy: '🏰',
  dinosaur: '🦕',
  ocean: '🌊',
  jungle: '🌴',
  pirates: '🏴‍☠️',
  robots: '🤖',
  candy: '🍬',
  'magic-school': '🧙',
  'ancient-temple': '🏛️',
};

type Step = 'topic' | 'world';

export default function AdventureSelectionPage() {
  const { activeChild } = useAuth();
  const navigate = useNavigate();
  const { startAdventure, adventureId, isLoading, error } = useAdventure();

  const [topics, setTopics] = useState<MathTopicConfig[]>([]);
  const [worlds, setWorlds] = useState<StoryWorldConfig[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedWorld, setSelectedWorld] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('topic');
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!activeChild) return;
    adventureService
      .getAvailable(activeChild._id)
      .then((data) => {
        setTopics(data.topics);
        setWorlds(data.worlds);
      })
      .catch(() => toast.error('Failed to load adventures'))
      .finally(() => setIsFetching(false));
  }, [activeChild]);

  useEffect(() => {
    if (adventureId) {
      navigate(`/child/story/${adventureId}`);
    }
  }, [adventureId, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopic(topicId);
    setStep('world');
  };

  const handleStartAdventure = () => {
    if (!activeChild || !selectedTopic || !selectedWorld) return;
    startAdventure(activeChild._id, selectedTopic, selectedWorld);
  };

  return (
    <div className="min-h-screen bg-parchment flex flex-col items-center p-6">
      {/* Header */}
      <div className="w-full max-w-3xl flex items-center justify-between mb-8">
        <button
          onClick={() => navigate('/child/dashboard')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-wizzy transition-colors px-3 py-1.5 rounded-lg hover:bg-purple-wizzy/10"
        >
          <ArrowLeft size={15} />
          Dashboard
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="text-gold-magic" size={24} />
          <span className="text-xl font-bold text-purple-wizzy">MathMagic</span>
        </div>
        {/* Spacer to keep logo centred */}
        <div className="w-24" />
      </div>

      {/* Heading */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-purple-wizzy">
          {step === 'topic' ? 'Choose a Math Topic' : 'Choose a Story World'}
        </h1>
        <p className="text-gray-500 mt-1">
          {step === 'topic'
            ? `What would you like to practice today${activeChild ? `, ${activeChild.name}` : ''}?`
            : 'Where should your adventure take place?'}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8 text-sm font-medium">
        <span className={step === 'topic' ? 'text-purple-wizzy' : 'text-gray-400'}>
          1. Pick a Topic
        </span>
        <span className="text-gray-300">→</span>
        <span className={step === 'world' ? 'text-purple-wizzy' : 'text-gray-400'}>
          2. Pick a World
        </span>
      </div>

      {/* Loading */}
      {isFetching ? (
        <div className="flex items-center gap-2 text-gray-400 mt-16">
          <Sparkles size={20} className="animate-pulse" />
          <span>Loading adventures...</span>
        </div>
      ) : step === 'topic' ? (
        /* ── Step 1: Topic Grid ── */
        <div className="w-full max-w-3xl">
          {topics.length === 0 ? (
            <p className="text-center text-gray-400 mt-16">
              No topics available for your grade.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {topics.map((topic) => {
                const isSelected = selectedTopic === topic.id;
                return (
                  <button
                    key={topic.id}
                    onClick={() => handleTopicSelect(topic.id)}
                    aria-pressed={isSelected}
                    style={{ borderLeftColor: topic.color }}
                    className={`group flex flex-col items-start gap-2 bg-white rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all text-left border border-transparent border-l-4 ${
                      isSelected
                        ? 'ring-2 ring-purple-wizzy/30 bg-purple-wizzy/5'
                        : 'hover:border-purple-wizzy/30'
                    }`}
                  >
                    <span className="text-3xl">{topic.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-800 group-hover:text-purple-wizzy transition-colors">
                        {topic.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{topic.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ── Step 2: World Grid ── */
        <div className="w-full max-w-3xl">
          <button
            onClick={() => setStep('topic')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-wizzy transition-colors mb-5"
          >
            <ArrowLeft size={14} />
            Back to topics
          </button>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {worlds.map((world) => {
              const isSelected = selectedWorld === world.id;
              return (
                <button
                  key={world.id}
                  onClick={() => setSelectedWorld(world.id)}
                  aria-pressed={isSelected}
                  className={`group flex flex-col items-start gap-2 bg-white rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all text-left border-2 ${
                    isSelected
                      ? 'border-purple-wizzy ring-2 ring-purple-wizzy/30 bg-purple-wizzy/5'
                      : 'border-transparent hover:border-purple-wizzy/30'
                  }`}
                >
                  <span className="text-3xl">{WORLD_EMOJIS[world.id] ?? '✨'}</span>
                  <div>
                    <p className="font-semibold text-gray-800 group-hover:text-purple-wizzy transition-colors">
                      {world.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{world.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Start Adventure */}
          {selectedWorld && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleStartAdventure}
                disabled={isLoading}
                className="flex items-center gap-2 bg-purple-wizzy text-white rounded-xl px-8 py-3 font-bold hover:bg-purple-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Sparkles size={18} className="animate-pulse" />
                    Creating your story...
                  </>
                ) : (
                  <>
                    <Wand2 size={18} />
                    Start Adventure!
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
