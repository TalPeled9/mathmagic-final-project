// client/src/pages/child/AdventureSelectionPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, Sparkles, Wand2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdventure } from '@/hooks/useAdventure';
import { adventureService } from '@/services/adventureService';
import type { MathTopicConfig, StoryWorldConfig } from '@mathmagic/types';
import { TopicCard, WorldCard, StepIndicator } from '@/components/adventure';

type Step = 'topic' | 'world';
type GridAnim = 'slide-out-left' | 'slide-in-right' | 'slide-out-right' | 'slide-in-left' | null;

const PAGE_BG = 'linear-gradient(150deg, #fdf4ff 0%, #fef3c7 55%, #ede9fe 100%)';

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
  const [gridAnim, setGridAnim] = useState<GridAnim>(null);

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
    if (adventureId) navigate(`/child/story/${adventureId}`);
  }, [adventureId, navigate]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const goToWorlds = (topicId: string) => {
    setSelectedTopic(topicId);
    setGridAnim('slide-out-left');
    setTimeout(() => {
      setStep('world');
      setGridAnim('slide-in-right');
      setTimeout(() => setGridAnim(null), 380);
    }, 260);
  };

  const goBackToTopics = () => {
    setGridAnim('slide-out-right');
    setTimeout(() => {
      setStep('topic');
      setSelectedWorld(null);
      setGridAnim('slide-in-left');
      setTimeout(() => setGridAnim(null), 380);
    }, 260);
  };

  const handleStartAdventure = () => {
    if (!activeChild || !selectedTopic || !selectedWorld) return;
    startAdventure(activeChild._id, selectedTopic, selectedWorld);
  };

  const gridAnimClass = gridAnim ? `animate-${gridAnim}` : '';

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: PAGE_BG }}
      >
        <div className="w-16 h-16 border-4 border-purple-wizzy border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ background: PAGE_BG }}>
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4">
        <button
          onClick={step === 'world' ? goBackToTopics : () => navigate('/child/dashboard')}
          className="flex items-center gap-1.5 text-sm font-semibold text-purple-wizzy bg-purple-wizzy/10 hover:bg-purple-wizzy/20 transition-colors px-3 py-1.5 rounded-lg"
        >
          <ArrowLeft size={14} />
          {step === 'world' ? 'Back' : 'Dashboard'}
        </button>
        <Link to="/" className="flex items-center gap-2">
          <Sparkles className="text-gold-magic" size={22} />
          <span className="text-lg font-extrabold text-purple-wizzy">MathMagic</span>
        </Link>
        <div style={{ width: 90 }} />
      </div>

      {/* Hero */}
      <div className="text-center pt-4 px-8">
        <h1 className="text-4xl font-black tracking-tight" style={{ color: '#1a0050' }}>
          {step === 'topic' ? 'Choose a Math Topic' : 'Choose a Story World'}
        </h1>
        <p className="text-sm mt-1.5" style={{ color: '#7c3aed', opacity: 0.8 }}>
          {step === 'topic'
            ? `What would you like to practice today${activeChild ? `, ${activeChild.name}` : ''}?`
            : `Where should your adventure take place${activeChild ? `, ${activeChild.name}` : ''}?`}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex justify-center mt-5">
        <StepIndicator step={step} />
      </div>

      {/* Card grid */}
      <div className={`px-8 pb-12 mt-6 ${gridAnimClass}`}>
        {isFetching ? (
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-purple-wizzy/10 animate-pulse"
                style={{ aspectRatio: '3 / 4' }}
              />
            ))}
          </div>
        ) : step === 'topic' ? (
          <div className="grid grid-cols-4 gap-4">
            {topics.map((topic, i) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                isSelected={selectedTopic === topic.id}
                onClick={() => goToWorlds(topic.id)}
                animationDelay={i * 55}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {worlds.map((world, i) => (
              <WorldCard
                key={world.id}
                world={world}
                isSelected={selectedWorld === world.id}
                onClick={() => setSelectedWorld(world.id)}
                animationDelay={i * 55}
              />
            ))}
          </div>
        )}
      </div>

      {/* Start Adventure button — pops in when a world is selected */}
      {step === 'world' && selectedWorld && (
        <div className="flex justify-center pb-12 animate-pop-in">
          <button
            onClick={handleStartAdventure}
            disabled={isLoading}
            className="flex items-center gap-2 bg-purple-wizzy text-white rounded-xl px-10 py-3.5 font-bold text-base hover:bg-purple-700 transition-all shadow-lg hover:shadow-[0_8px_24px_rgba(139,92,246,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Wand2 size={18} />
            Start Adventure!
          </button>
        </div>
      )}
    </div>
  );
}
