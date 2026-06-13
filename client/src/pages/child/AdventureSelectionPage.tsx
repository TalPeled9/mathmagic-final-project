import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, Wand2 } from 'lucide-react';
import mathmagicLogo from '@/assets/mathmagic-logo.png';
import MagicBackground from '@/components/MagicBackground';
import { AILoader } from '@/components/loaders';
import { useAuth } from '@/hooks/useAuth';
import { useAdventure } from '@/hooks/useAdventure';
import { adventureService } from '@/services/adventureService';
import type { MathTopicConfig, StoryWorldConfig } from '@mathmagic/types';
import { TopicCard, WorldCard, StepIndicator } from '@/components/adventure';

type Step = 'topic' | 'world';
type GridAnim = 'slide-out-left' | 'slide-in-right' | 'slide-out-right' | 'slide-in-left' | null;

const PAGE_BG = 'linear-gradient(150deg, #fdf4ff 0%, #fef3c7 55%, #ede9fe 100%)';

const GRID_ANIM_CLASSES: Record<NonNullable<GridAnim>, string> = {
  'slide-out-left': 'animate-slide-out-left',
  'slide-in-right': 'animate-slide-in-right',
  'slide-out-right': 'animate-slide-out-right',
  'slide-in-left': 'animate-slide-in-left',
};

const TOPIC_NAMES: Record<string, string> = {
  addition: 'Addition', subtraction: 'Subtraction', multiplication: 'Multiplication',
  division: 'Division', fractions: 'Fractions', patterns: 'Patterns',
  time: 'Time', money: 'Money', measurement: 'Measurement', shapes: 'Shapes',
};

const TOPIC_ICONS: Record<string, string> = {
  addition: '➕', subtraction: '➖', multiplication: '✖️', division: '➗',
  fractions: '½', patterns: '🔷', time: '⏰', money: '💰', measurement: '📏', shapes: '🔺',
};

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

  const transitionTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTransitionTimers = () => {
    transitionTimers.current.forEach(clearTimeout);
    transitionTimers.current = [];
  };

  useEffect(() => clearTransitionTimers, []);

  useEffect(() => {
    if (!activeChild) return;
    adventureService
      .getAvailable(activeChild._id)
      .then((data) => { setTopics(data.topics); setWorlds(data.worlds); })
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
    clearTransitionTimers();
    setSelectedTopic(topicId);
    setGridAnim('slide-out-left');
    const t1 = setTimeout(() => {
      setStep('world');
      setGridAnim('slide-in-right');
      const t2 = setTimeout(() => setGridAnim(null), 380);
      transitionTimers.current.push(t2);
    }, 260);
    transitionTimers.current.push(t1);
  };

  const goBackToTopics = () => {
    clearTransitionTimers();
    setGridAnim('slide-out-right');
    const t1 = setTimeout(() => {
      setStep('topic');
      setSelectedWorld(null);
      setGridAnim('slide-in-left');
      const t2 = setTimeout(() => setGridAnim(null), 380);
      transitionTimers.current.push(t2);
    }, 260);
    transitionTimers.current.push(t1);
  };

  const handleStartAdventure = () => {
    if (!activeChild || !selectedTopic || !selectedWorld) return;
    startAdventure(activeChild._id, selectedTopic, selectedWorld);
  };

  const gridAnimClass = gridAnim ? GRID_ANIM_CLASSES[gridAnim] : '';

  if (isLoading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden" style={{ background: PAGE_BG }}>
        <MagicBackground symbols="math" count={12} opacity={0.07} />
        <div className="relative z-10 w-full max-w-md">
          <AILoader />
        </div>
      </div>
    );
  }

  const selectedTopicConfig = topics.find((t) => t.id === selectedTopic);

  return (
    <div className="relative min-h-screen w-full overflow-hidden" style={{ background: PAGE_BG }}>
      <MagicBackground symbols="math" count={16} opacity={0.06} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-8 py-4">
        <button
          onClick={step === 'world' ? goBackToTopics : () => navigate('/child/dashboard')}
          className="flex items-center gap-1.5 text-sm font-semibold text-purple-wizzy bg-white/70 hover:bg-white/90 backdrop-blur-sm transition-all px-4 py-2 rounded-xl shadow-sm hover:shadow-md"
        >
          <ArrowLeft size={14} />
          {step === 'world' ? 'Back' : 'Dashboard'}
        </button>
        <Link to="/" className="flex items-center justify-center">
          <img src={mathmagicLogo} alt="MathMagic" className="h-12 w-auto" />
        </Link>
        <div style={{ width: 100 }} />
      </div>

      {/* Hero */}
      <div className="relative z-10 text-center pt-2 pb-2 px-8">
        {/* Step chip */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3"
          style={{
            background: step === 'topic' ? 'rgba(139,92,246,0.12)' : 'rgba(245,158,11,0.12)',
            color: step === 'topic' ? '#7c3aed' : '#d97706',
            border: `1px solid ${step === 'topic' ? 'rgba(139,92,246,0.25)' : 'rgba(245,158,11,0.3)'}`,
          }}
        >
          {step === 'topic' ? '⭐ Step 1 of 2' : '🌍 Step 2 of 2'}
        </div>

        <h1
          className="text-4xl font-black tracking-tight gradient-text"
        >
          {step === 'topic' ? 'Choose a Math Topic' : 'Choose a Story World'}
        </h1>
        <p className="text-sm mt-1.5 text-purple-wizzy/70 font-medium">
          {step === 'topic'
            ? `What would you like to practice today${activeChild ? `, ${activeChild.name}` : ''}?`
            : `Where should your adventure take place${activeChild ? `, ${activeChild.name}` : ''}?`}
        </p>

        {/* Selected topic chip (shows in step 2) */}
        {step === 'world' && selectedTopicConfig && (
          <div
            className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full text-sm font-semibold"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#6d28d9' }}
          >
            <span>{TOPIC_ICONS[selectedTopicConfig.id] ?? '📚'}</span>
            <span>Topic: {TOPIC_NAMES[selectedTopicConfig.id] ?? selectedTopicConfig.name}</span>
          </div>
        )}
      </div>

      {/* Step indicator */}
      <div className="relative z-10 flex justify-center mt-4">
        <StepIndicator step={step} />
      </div>

      {/* Card grid */}
      <div className={`relative z-10 px-8 pb-12 mt-6 ${gridAnimClass}`}>
        {isFetching ? (
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-purple-wizzy/10 animate-pulse" style={{ aspectRatio: '3 / 4' }} />
            ))}
          </div>
        ) : step === 'topic' ? (
          <div className="grid grid-cols-4 gap-4">
            {topics.map((topic, i) => (
              <TopicCard key={topic.id} topic={topic} isSelected={selectedTopic === topic.id} onClick={() => goToWorlds(topic.id)} animationDelay={i * 55} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {worlds.map((world, i) => (
              <WorldCard key={world.id} world={world} isSelected={selectedWorld === world.id} onClick={() => setSelectedWorld(world.id)} animationDelay={i * 55} />
            ))}
          </div>
        )}
      </div>

      {/* Start Adventure button */}
      {step === 'world' && selectedWorld && (
        <div className="relative z-10 flex justify-center pb-12 animate-pop-in">
          <button
            onClick={handleStartAdventure}
            disabled={isLoading}
            className="flex items-center gap-2.5 text-white rounded-2xl px-12 py-4 font-bold text-base transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(90deg, #8b5cf6 0%, #6d28d9 100%)',
              boxShadow: '0 8px 30px rgba(139,92,246,0.45)',
              animation: 'glow-pulse 2s ease-in-out infinite',
            }}
          >
            <Wand2 size={20} />
            Start Adventure!
          </button>
        </div>
      )}
    </div>
  );
}
