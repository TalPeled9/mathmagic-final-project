import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  ArrowLeft,
  BookOpen,
  Lightbulb,
  Sparkles,
  Star,
  Zap,
  Trophy,
  Wand2,
  Volume2,
  VolumeX,
  Play,
  Maximize2,
  X,
} from 'lucide-react';
import { useTTS, DEFAULT_TTS_VOICE_ID } from '@/hooks/useTTS';
import { AnalogClock } from '@/components/AnalogClock';
import MathText from '@/components/MathText';
import { ParentLoader } from '@/components/loaders';
import { useAuth } from '@/hooks/useAuth';
import defaultAvatar from '@/assets/default_avatar.png';
import wizzyImg from '@/assets/wizzy.png';
import mathmagicLogo from '@/assets/mathmagic-logo.png';
import { adventureService } from '@/services/adventureService';
import { WORLD_NAMES } from '@/lib/adventureLabels';
import { WORLD_EMOJIS } from '@mathmagic/types';
import type {
  ICurrentChallenge,
  CompleteAdventureResponse,
  AnswerChallengeResponse,
  HintResponse,
  StorySegment,
  ReplayChallenge,
} from '@mathmagic/types';

// ── Local types ───────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'wizzy' | 'child' | 'system' | 'hint' | 'challenge';
  text: string;
  imageUrl?: string;
  isCorrect?: boolean; // for system messages
  hint?: HintResponse; // for hint messages — carries the mini-quiz data
  challenge?: ReplayChallenge; // for replay challenge cards
}

// ── BADGE EMOJI MAP ───────────────────────────────────────────────────────────

const BADGE_EMOJIS: Record<string, string> = {
  'first-adventure': '🌟',
  'perfect-score': '💯',
  '5-day-streak': '🔥',
  'speed-master': '⚡',
  'topic-master': '🎓',
  explorer: '🗺️',
};

// ── CONFETTI CONFIG ───────────────────────────────────────────────────────────

const CONFETTI_COLORS = ['#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899'];
const CONFETTI_PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  x: 4 + ((i * 6) % 92),
  delay: i * 55,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  size: 6 + (i % 3) * 3,
}));

// ── WORLD PARTICLE CONFIG ─────────────────────────────────────────────────────

const WORLD_PARTICLES: Record<string, { symbols: string[]; count: number; color: string[] }> = {
  space: {
    symbols: ['★', '✦', '·', '✧', '⭐'],
    count: 22,
    color: ['#c4b5fd', '#818cf8', '#e0e7ff'],
  },
  fantasy: {
    symbols: ['✨', '🌸', '🍀', '💫', '♦'],
    count: 18,
    color: ['#f9a8d4', '#c084fc', '#fde68a'],
  },
  ocean: {
    symbols: ['○', '◦', '◯', '·', '○'],
    count: 20,
    color: ['#7dd3fc', '#38bdf8', '#bae6fd'],
  },
  jungle: {
    symbols: ['🍃', '✿', '❀', '◈', '●'],
    count: 16,
    color: ['#86efac', '#4ade80', '#bbf7d0'],
  },
  dinosaur: {
    symbols: ['✦', '◆', '·', '✧', '◇'],
    count: 16,
    color: ['#fde047', '#a3e635', '#fcd34d'],
  },
  pirates: {
    symbols: ['✦', '·', '✧', '◇', '○'],
    count: 14,
    color: ['#fcd34d', '#fbbf24', '#fef3c7'],
  },
  robots: {
    symbols: ['◈', '◉', '⊕', '◦', '●'],
    count: 16,
    color: ['#94a3b8', '#cbd5e1', '#e2e8f0'],
  },
  candy: {
    symbols: ['✿', '❀', '◆', '✦', '◇'],
    count: 20,
    color: ['#f9a8d4', '#f0abfc', '#fde68a'],
  },
  'magic-school': {
    symbols: ['★', '✦', '✧', '⭐', '💫'],
    count: 20,
    color: ['#c4b5fd', '#f9a8d4', '#fde68a'],
  },
  'ancient-temple': {
    symbols: ['◈', '◆', '◇', '✦', '✧'],
    count: 14,
    color: ['#fcd34d', '#fbbf24', '#f97316'],
  },
  default: {
    symbols: ['★', '✦', '·', '◇', '✧'],
    count: 16,
    color: ['#c4b5fd', '#f9a8d4', '#fde68a'],
  },
};

// ── CHALLENGE OPTION STYLES ───────────────────────────────────────────────────

const OPTION_SHAPES = [{ label: 'A' }, { label: 'B' }, { label: 'C' }, { label: 'D' }];

// ── PATH CHOICE STYLES ────────────────────────────────────────────────────────

const PATH_THEMES = [
  {
    gradient: 'linear-gradient(135deg, #faf5ff, #ede9fe)',
    border: 'rgba(139,92,246,0.3)',
    hover: '#8b5cf6',
    icon: '⚡',
    label: 'Path A',
    labelColor: '#7c3aed',
  },
  {
    gradient: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
    border: 'rgba(245,158,11,0.3)',
    hover: '#f59e0b',
    icon: '✨',
    label: 'Path B',
    labelColor: '#b45309',
  },
];

// ── CORRECT ANSWER STAR BURST ─────────────────────────────────────────────────

const STAR_BURST_PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  delay: i * 60,
  tx: Math.round(Math.cos((i / 8) * Math.PI * 2) * 120),
  ty: Math.round(Math.sin((i / 8) * Math.PI * 2) * 120),
}));

// ── WIZZY STATUS MAP ──────────────────────────────────────────────────────────

const WIZZY_STATUS_MAP = {
  thinking: { text: 'Thinking…', color: '#f59e0b', dot: '#fbbf24' },
  talking: { text: 'Speaking…', color: '#8b5cf6', dot: '#a78bfa' },
  idle: { text: 'Ready!', color: '#10b981', dot: '#34d399' },
} as const;

// ── Main component ────────────────────────────────────────────────────────────

export default function StoryChat() {
  const { adventureId } = useParams<{ adventureId: string }>();
  const { activeChild, setActiveChild } = useAuth();
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);
  const panelAutoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const challengePanelRef = useRef<HTMLElement>(null);
  const showChallengePillRef = useRef<HTMLButtonElement>(null);

  const { speakQueue, stopAndSpeak, toggleMute, isSpeaking, isMuted } = useTTS(
    activeChild?.narratorVoice ?? DEFAULT_TTS_VOICE_ID
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentChallenge, setCurrentChallenge] = useState<ICurrentChallenge | null>(null);
  const [currentChoices, setCurrentChoices] = useState<string[]>([]);
  const [adventureStatus, setAdventureStatus] = useState<
    'loading' | 'in-progress' | 'completed' | 'error'
  >('loading');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLastStep, setIsLastStep] = useState(false);
  const [completionData, setCompletionData] = useState<CompleteAdventureResponse | null>(null);
  const [lastAnswerFeedback, setLastAnswerFeedback] = useState<AnswerChallengeResponse | null>(
    null
  );
  const [lastSubmittedAnswer, setLastSubmittedAnswer] = useState<string | null>(null);
  const [pendingContinue, setPendingContinue] = useState(false);
  const [adventureContext, setAdventureContext] = useState<{
    mathTopic: string;
    mathTopicName: string;
    storyWorld: string;
    starsEarned: number;
  } | null>(null);
  const [showCorrectFlash, setShowCorrectFlash] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);
  // Texts to speak after the initial history load completes (handled in a separate effect)
  const [initialSpeakTexts, setInitialSpeakTexts] = useState<string[]>([]);
  // URL of the story image currently shown full-screen, or null when closed
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id'>) => {
    setMessages((prev) => [...prev, { ...msg, id: `${Date.now()}-${Math.random()}` }]);
  }, []);

  const applySegment = useCallback(
    (segment: StorySegment) => {
      addMessage({ role: 'wizzy', text: segment.narrative, imageUrl: segment.imageUrl });
      if (segment.wizzyDialogue && segment.wizzyDialogue !== segment.narrative) {
        addMessage({ role: 'wizzy', text: segment.wizzyDialogue });
      }
      const toSpeak = [segment.narrative];
      if (segment.wizzyDialogue && segment.wizzyDialogue !== segment.narrative)
        toSpeak.push(segment.wizzyDialogue);
      if (segment.challenge?.problemText) toSpeak.push(segment.challenge.problemText);
      if (segment.choices?.length) toSpeak.push(...segment.choices);
      speakQueue(toSpeak);
      setCurrentChoices(segment.choices ?? []);
      setCurrentChallenge(segment.challenge);
      setIsLastStep(segment.isLastStep);
      setLastAnswerFeedback(null);
      setLastSubmittedAnswer(null);
      setPendingContinue(false);
    },
    [addMessage, speakQueue]
  );

  // Auto-show the challenge panel whenever a new challenge arrives
  useEffect(() => {
    if (currentChallenge) setPanelVisible(true);
  }, [currentChallenge]);

  // Cleanup: cancel the auto-close timer if the component unmounts
  useEffect(() => {
    return () => {
      if (panelAutoCloseRef.current) clearTimeout(panelAutoCloseRef.current);
    };
  }, []);

  // Focus the challenge panel when it opens
  useEffect(() => {
    if (panelVisible && currentChallenge && challengePanelRef.current) {
      challengePanelRef.current.focus();
    }
  }, [panelVisible, currentChallenge]);

  // ── Mount: load adventure state (start or resume) ────────────────────────────

  useEffect(() => {
    if (!adventureId) return;

    const load = async () => {
      const adventure = await adventureService.get(adventureId);
      setAdventureContext({
        mathTopic: adventure.mathTopic,
        mathTopicName: adventure.mathTopicName,
        storyWorld: adventure.storyWorld,
        starsEarned: adventure.starsEarned,
      });

      // Pre-fetch base64 image data for every step that has a stored image
      const stepImageUrls: Record<number, string> = {};
      const imageEntries = Object.entries(adventure.stepImages ?? {});
      if (imageEntries.length > 0) {
        await Promise.all(
          imageEntries.map(async ([stepStr]) => {
            const stepIndex = Number(stepStr);
            try {
              const { imageUrl } = await adventureService.getImage(adventureId, stepIndex);
              stepImageUrls[stepIndex] = imageUrl;
            } catch {
              // image unavailable — render without it
            }
          })
        );
      }

      // Reconstruct chat from persisted conversation history (image mapping keys
      // off wizzy-message order, which the timestamp merge preserves).
      let wizzyCount = 0;
      const historyMsgs = adventure.conversationHistory.map((entry, i) => {
        const isCorrectMsg =
          entry.role === 'system' &&
          (entry.content.startsWith('Correct') || entry.content.startsWith('Great job'));
        const imageUrl = entry.role === 'wizzy' ? stepImageUrls[wizzyCount++] : undefined;
        const msg: ChatMessage = {
          id: `hist-${i}`,
          role: entry.role as 'wizzy' | 'child' | 'system',
          text: entry.content,
          imageUrl,
          isCorrect: entry.role === 'system' ? isCorrectMsg : undefined,
        };
        return { ts: new Date(entry.timestamp).getTime(), msg };
      });

      let ordered = historyMsgs;
      if (adventure.status === 'completed' && adventure.replayChallenges?.length) {
        const challengeMsgs = adventure.replayChallenges.map((c, i) => ({
          ts: new Date(c.timestamp).getTime(),
          msg: {
            id: `chal-${i}`,
            role: 'challenge' as const,
            text: c.problemText,
            challenge: c,
          },
        }));
        ordered = [...historyMsgs, ...challengeMsgs].sort((a, b) => a.ts - b.ts);
      }
      setMessages(ordered.map((x) => x.msg));

      if (adventure.status === 'completed') {
        setAdventureStatus('completed');
        return;
      }

      setCurrentChallenge(adventure.currentChallenge);
      setPanelVisible(Boolean(adventure.currentChallenge));

      if (adventure.currentChallenge) {
        // Active challenge: choices are deferred until challenge resolves
        setCurrentChoices([]);
      } else if (adventure.lastChoices.length > 0) {
        setCurrentChoices(adventure.lastChoices);
      } else {
        // Challenge was resolved but user hasn't continued yet
        setPendingContinue(true);
      }

      // Detect if we're at the final step (end story was generated)
      if (adventure.currentStepIndex >= adventure.totalSteps - 1) {
        setIsLastStep(true);
      }

      // Collect the trailing consecutive Wizzy messages (current step) to auto-speak
      const trailingWizzy: string[] = [];
      for (let i = adventure.conversationHistory.length - 1; i >= 0; i--) {
        const entry = adventure.conversationHistory[i];
        if (entry.role === 'wizzy') trailingWizzy.unshift(entry.content);
        else break;
      }
      if (trailingWizzy.length > 0) setInitialSpeakTexts(trailingWizzy);

      setAdventureStatus('in-progress');
    };

    load().catch(() => {
      toast.error('Failed to load adventure');
      setAdventureStatus('error');
    });
  }, [adventureId]);

  // ── Speak current-step Wizzy messages after initial history load ────────────

  useEffect(() => {
    if (initialSpeakTexts.length === 0) return;
    speakQueue(initialSpeakTexts);
    setInitialSpeakTexts([]);
  }, [initialSpeakTexts, speakQueue]);

  // ── Auto-scroll when messages update ────────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // ── Action handlers ──────────────────────────────────────────────────────────

  const handleChoice = useCallback(
    async (index: number) => {
      if (!adventureId || isProcessing) return;
      const choiceText = currentChoices[index];
      if (!choiceText) return;

      addMessage({ role: 'child', text: choiceText });
      setCurrentChoices([]);
      setIsProcessing(true);

      try {
        const { segment } = await adventureService.continue(adventureId, { choiceIndex: index });
        applySegment(segment);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to continue adventure');
      } finally {
        setIsProcessing(false);
      }
    },
    [adventureId, isProcessing, currentChoices, addMessage, applySegment]
  );

  const handleAutoContinue = useCallback(async () => {
    if (!adventureId || isProcessing) return;
    setPendingContinue(false);
    setIsProcessing(true);

    try {
      const { segment } = await adventureService.continue(adventureId, { choiceIndex: 0 });
      applySegment(segment);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to continue adventure');
    } finally {
      setIsProcessing(false);
    }
  }, [adventureId, isProcessing, applySegment]);

  const handleAnswer = useCallback(
    async (answer: string) => {
      if (!adventureId || isProcessing) return;

      addMessage({ role: 'child', text: answer });
      setLastSubmittedAnswer(answer);
      setIsProcessing(true);

      try {
        const response = await adventureService.answer(adventureId, { answer });
        const isCorrect = response.correct;
        addMessage({ role: 'system', text: response.feedback, isCorrect });
        stopAndSpeak(response.feedback);
        setLastAnswerFeedback(response);

        if (isCorrect) {
          setShowCorrectFlash(true);
          setTimeout(() => setShowCorrectFlash(false), 1400);
          if (panelAutoCloseRef.current) clearTimeout(panelAutoCloseRef.current);
          panelAutoCloseRef.current = setTimeout(() => setPanelVisible(false), 1500);
        }

        if (response.correct || response.correctAnswer !== undefined) {
          // Challenge resolved (correct answer or max attempts exhausted)
          setCurrentChallenge(null);
          if (!isLastStep) {
            setPendingContinue(true);
          }
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to submit answer');
      } finally {
        setIsProcessing(false);
      }
    },
    [adventureId, isProcessing, addMessage, isLastStep, stopAndSpeak]
  );

  const handleHint = useCallback(async () => {
    if (!adventureId || isProcessing) return;
    setIsProcessing(true);

    try {
      const response: HintResponse = await adventureService.hint(adventureId);
      addMessage({ role: 'hint', text: response.hintText, hint: response });
      stopAndSpeak(response.hintText);
      setCurrentChallenge((prev) =>
        prev ? { ...prev, hintLevel: Math.min(prev.hintLevel + 1, 3) as 0 | 1 | 2 | 3 } : null
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to get hint');
    } finally {
      setIsProcessing(false);
    }
  }, [adventureId, isProcessing, addMessage, stopAndSpeak]);

  const handleFinishAdventure = useCallback(async () => {
    if (!adventureId || isProcessing) return;
    setIsProcessing(true);

    try {
      const response = await adventureService.complete(adventureId);
      setCompletionData(response);
      setAdventureStatus('completed');

      if (activeChild) {
        setActiveChild({
          ...activeChild,
          totalXP: response.totalXP,
          totalStars: response.totalStars,
          currentLevel: response.newLevel ?? activeChild.currentLevel,
          badges: response.newBadges?.length
            ? [...activeChild.badges, ...response.newBadges]
            : activeChild.badges,
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to complete adventure');
    } finally {
      setIsProcessing(false);
    }
  }, [adventureId, isProcessing, activeChild, setActiveChild]);

  // ── Render ───────────────────────────────────────────────────────────────────

  // World-specific background tints
  const WORLD_TINTS: Record<string, string> = {
    space: 'linear-gradient(180deg, #0f0c29/5 0%, #f5f3ff 100%)',
    fantasy: 'linear-gradient(180deg, #f5f3ff 0%, #ede9fe 100%)',
    dinosaur: 'linear-gradient(180deg, #fefce8 0%, #ecfccb 100%)',
    ocean: 'linear-gradient(180deg, #eff6ff 0%, #e0f2fe 100%)',
    jungle: 'linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)',
    pirates: 'linear-gradient(180deg, #fff7ed 0%, #fef3c7 100%)',
    robots: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
    candy: 'linear-gradient(180deg, #fdf4ff 0%, #fce7f3 100%)',
    'magic-school': 'linear-gradient(180deg, #f5f3ff 0%, #ede9fe 100%)',
    'ancient-temple': 'linear-gradient(180deg, #fef9c3 0%, #fef3c7 100%)',
    default: 'linear-gradient(180deg, #f5f3ff 0%, #fffbeb 100%)',
  };
  const worldBg = WORLD_TINTS[adventureContext?.storyWorld ?? 'default'] ?? WORLD_TINTS.default;

  // Richer, more saturated world gradients for the read-only replay page —
  // a finished story gets a bolder backdrop than live play. Kept at a pastel
  // (~200-level) intensity so the light chat bubbles stay legible.
  const REPLAY_TINTS: Record<string, string> = {
    space: 'linear-gradient(160deg, #c7d2fe 0%, #ddd6fe 50%, #f5d0fe 100%)',
    fantasy: 'linear-gradient(160deg, #e9d5ff 0%, #f5d0fe 50%, #fbcfe8 100%)',
    dinosaur: 'linear-gradient(160deg, #d9f99d 0%, #bbf7d0 50%, #fef08a 100%)',
    ocean: 'linear-gradient(160deg, #bfdbfe 0%, #a5f3fc 50%, #cffafe 100%)',
    jungle: 'linear-gradient(160deg, #bbf7d0 0%, #a7f3d0 50%, #d9f99d 100%)',
    pirates: 'linear-gradient(160deg, #fde68a 0%, #fed7aa 50%, #fecaca 100%)',
    robots: 'linear-gradient(160deg, #e2e8f0 0%, #c7d2fe 50%, #bfdbfe 100%)',
    candy: 'linear-gradient(160deg, #fbcfe8 0%, #f5d0fe 50%, #fed7aa 100%)',
    'magic-school': 'linear-gradient(160deg, #ddd6fe 0%, #c7d2fe 50%, #fde68a 100%)',
    'ancient-temple': 'linear-gradient(160deg, #fde68a 0%, #fcd34d 50%, #fed7aa 100%)',
    default: 'linear-gradient(160deg, #ddd6fe 0%, #fbcfe8 50%, #fde68a 100%)',
  };

  const wizzyStatus: keyof typeof WIZZY_STATUS_MAP = isProcessing
    ? 'thinking'
    : isSpeaking
      ? 'talking'
      : 'idle';

  const isReplay = adventureStatus === 'completed';
  const pageBg = isReplay
    ? (REPLAY_TINTS[adventureContext?.storyWorld ?? 'default'] ?? REPLAY_TINTS.default)
    : worldBg;

  if (adventureStatus === 'loading') {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <ParentLoader message="Loading your adventure…" />
      </div>
    );
  }

  if (adventureStatus === 'error') {
    return (
      <div className="min-h-screen bg-parchment flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Could not load this adventure.</p>
        <button
          onClick={() => navigate('/child/dashboard')}
          className="flex items-center gap-1.5 text-sm text-purple-wizzy hover:underline"
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: pageBg }}>
      <WorldParticleLayer world={adventureContext?.storyWorld ?? 'default'} />

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-10 backdrop-blur-md border-b border-purple-wizzy/10 px-4 py-2.5 flex-shrink-0"
        style={{ background: 'rgba(245,243,255,0.92)' }}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/child/dashboard')}
            className="flex items-center gap-1.5 text-sm font-semibold text-purple-wizzy bg-purple-wizzy/10 hover:bg-purple-wizzy/20 transition-colors px-3 py-2 rounded-lg min-h-[44px]"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          {isReplay ? (
            <>
              {/* Center: adventure title + replay badge */}
              <div className="flex flex-col items-center min-w-0 px-2">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-purple-wizzy/70">
                  <BookOpen size={12} />
                  Story Replay
                </span>
                <span className="text-sm font-black text-gray-700 truncate max-w-[60vw]">
                  {WORLD_EMOJIS[adventureContext?.storyWorld ?? ''] ?? '✨'}{' '}
                  {WORLD_NAMES[adventureContext?.storyWorld ?? ''] ?? adventureContext?.storyWorld}
                  {' · '}
                  {adventureContext?.mathTopicName}
                </span>
              </div>

              {/* Right: stars earned + mute */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      className={
                        star <= (adventureContext?.starsEarned ?? 0)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }
                      fill={
                        star <= (adventureContext?.starsEarned ?? 0) ? '#facc15' : 'transparent'
                      }
                    />
                  ))}
                </div>
                <button
                  onClick={toggleMute}
                  title={isMuted ? 'Unmute Wizzy' : 'Mute Wizzy'}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-wizzy/10 hover:bg-purple-wizzy/20 transition-colors flex-shrink-0"
                >
                  {isMuted ? (
                    <VolumeX size={15} className="text-purple-wizzy/50" />
                  ) : (
                    <Volume2 size={15} className="text-purple-wizzy" />
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <img src={mathmagicLogo} alt="MathMagic" className="h-11 w-auto" />

              {/* Wizzy character status + mute toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  title={isMuted ? 'Unmute Wizzy' : 'Mute Wizzy'}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-wizzy/10 hover:bg-purple-wizzy/20 transition-colors flex-shrink-0"
                >
                  {isMuted ? (
                    <VolumeX size={15} className="text-purple-wizzy/50" />
                  ) : (
                    <Volume2 size={15} className="text-purple-wizzy" />
                  )}
                </button>
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[11px] font-bold text-gray-500">Wizzy</span>
                  <div className="flex items-center gap-1">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: WIZZY_STATUS_MAP[wizzyStatus].dot,
                        boxShadow: `0 0 6px ${WIZZY_STATUS_MAP[wizzyStatus].dot}`,
                        animation:
                          wizzyStatus === 'thinking' || wizzyStatus === 'talking'
                            ? 'sparkle 0.8s ease-in-out infinite'
                            : 'none',
                      }}
                    />
                    <span
                      className="text-[11px] font-semibold"
                      style={{ color: WIZZY_STATUS_MAP[wizzyStatus].color }}
                    >
                      {WIZZY_STATUS_MAP[wizzyStatus].text}
                    </span>
                  </div>
                </div>
                <div
                  className="w-10 h-10 rounded-full overflow-hidden border-2 shadow-md flex-shrink-0"
                  style={{
                    borderColor: WIZZY_STATUS_MAP[wizzyStatus].dot,
                    boxShadow: `0 0 10px ${WIZZY_STATUS_MAP[wizzyStatus].dot}40`,
                    animation:
                      wizzyStatus === 'thinking'
                        ? 'mm-wizzy-bob 1.2s ease-in-out infinite'
                        : 'none',
                  }}
                >
                  <img
                    src={wizzyImg}
                    alt="Wizzy"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ── Content area: chat + optional challenge panel ── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Chat column */}
        <main className="flex-1 min-w-0 min-h-0 flex justify-center overflow-hidden">
          <div
            className={`${
              currentChallenge && panelVisible ? 'max-w-2xl' : 'max-w-4xl'
            } w-full overflow-y-auto scrollbar-hide px-4 py-6`}
          >
            <div className="space-y-4 pb-4">
              {messages.map((msg) => {
                if (msg.role === 'wizzy')
                  return (
                    <WizzyMessage
                      key={msg.id}
                      text={msg.text}
                      imageUrl={msg.imageUrl}
                      onReplay={() => stopAndSpeak(msg.text)}
                      onExpand={() => msg.imageUrl && setLightboxUrl(msg.imageUrl)}
                    />
                  );
                if (msg.role === 'child')
                  return (
                    <ChildMessage
                      key={msg.id}
                      text={msg.text}
                      avatarUrl={
                        activeChild?.avatars[activeChild.activeAvatarIndex]?.imageData ||
                        defaultAvatar
                      }
                    />
                  );
                if (msg.role === 'hint' && msg.hint)
                  return <HintMessage key={msg.id} hint={msg.hint} />;
                if (msg.role === 'challenge' && msg.challenge)
                  return <ReplayChallengeCard key={msg.id} challenge={msg.challenge} />;
                return (
                  <SystemMessage key={msg.id} text={msg.text} isCorrect={msg.isCorrect ?? false} />
                );
              })}

              {isProcessing && <TypingIndicator />}

              {/* Inline action controls */}
              {!completionData && !currentChallenge && pendingContinue && (
                <div className="flex justify-center py-2">
                  <button
                    onClick={handleAutoContinue}
                    className="flex items-center gap-2 text-white rounded-2xl px-8 py-3.5 font-bold transition-all shadow-lg hover:scale-105 active:scale-95"
                    style={{
                      background: 'linear-gradient(90deg, #8b5cf6, #6d28d9)',
                      boxShadow: '0 6px 20px rgba(139,92,246,0.4)',
                    }}
                  >
                    <Wand2 size={18} />
                    Continue Story
                  </button>
                </div>
              )}
              {!completionData && !currentChallenge && currentChoices.length > 0 && (
                <ChoiceBubbles choices={currentChoices} onChoice={handleChoice} />
              )}
              {!completionData &&
                isLastStep &&
                !currentChallenge &&
                !pendingContinue &&
                currentChoices.length === 0 && (
                  <div className="flex justify-center py-2">
                    <button
                      onClick={handleFinishAdventure}
                      className="flex items-center gap-2 text-white rounded-2xl px-8 py-3.5 font-bold transition-all shadow-lg hover:scale-105 active:scale-95"
                      style={{
                        background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                        boxShadow: '0 6px 20px rgba(245,158,11,0.4)',
                      }}
                    >
                      <Trophy size={18} />
                      Finish Adventure!
                    </button>
                  </div>
                )}

              <div ref={bottomRef} />
            </div>
          </div>
        </main>

        {/* Challenge panel column */}
        {currentChallenge && panelVisible && (
          <aside
            ref={challengePanelRef}
            tabIndex={-1}
            className="challenge-panel-enter md:w-96 lg:w-[28rem] flex-shrink-0 flex flex-col overflow-hidden border-t-2 md:border-t-0 md:border-l-2 border-purple-wizzy/20 max-h-[50vh] md:max-h-none"
            style={{
              background: 'rgba(252,250,255,0.97)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
          >
            <div className="flex-1 flex flex-col p-4 min-h-0">
              <ChallengePanel
                challenge={currentChallenge}
                onAnswer={handleAnswer}
                onHint={handleHint}
                onHide={() => {
                  setPanelVisible(false);
                  setTimeout(() => showChallengePillRef.current?.focus(), 50);
                }}
                lastFeedback={lastAnswerFeedback}
                lastSubmittedAnswer={lastSubmittedAnswer}
              />
            </div>
          </aside>
        )}
      </div>

      {/* ── Floating "Show Challenge" pill ── */}
      {currentChallenge && !panelVisible && (
        <button
          ref={showChallengePillRef}
          onClick={() => setPanelVisible(true)}
          className="fixed bottom-6 right-6 z-30 flex items-center gap-2 text-white text-sm font-bold rounded-full px-5 py-3 min-h-[44px] shadow-lg hover:scale-105 active:scale-95 transition-all"
          style={{
            background: 'linear-gradient(90deg, #7c3aed, #8b5cf6)',
            boxShadow: '0 4px 20px rgba(139,92,246,0.45)',
          }}
        >
          <Zap size={15} className="fill-yellow-300 text-yellow-300" />
          Show Challenge
        </button>
      )}

      {/* ── Correct answer flash overlay ── */}
      {showCorrectFlash && (
        <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
          <div
            className="absolute inset-0"
            style={{
              background: 'rgba(16,185,129,0.22)',
              animation: 'chat-flash 1.2s ease-out forwards',
            }}
          />
          {STAR_BURST_PARTICLES.map((s) => (
            <div
              key={s.id}
              className="absolute text-2xl"
              style={
                {
                  animation: `star-burst 1s ${s.delay}ms ease-out forwards`,
                  '--tx': `${s.tx}px`,
                  '--ty': `${s.ty}px`,
                } as React.CSSProperties
              }
            >
              ⭐
            </div>
          ))}
          <div
            className="relative text-4xl font-black text-white select-none"
            style={{
              animation: 'pop-in 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
              textShadow: '0 2px 16px rgba(16,185,129,0.9)',
            }}
          >
            ✨ Correct! ✨
          </div>
        </div>
      )}

      {/* ── Completion overlay ── */}
      {completionData && (
        <CompletionOverlay
          data={completionData}
          onDashboard={() => navigate('/child/dashboard', { state: { completionData } })}
          onNewAdventure={() => navigate('/child/adventure')}
        />
      )}

      {/* ── Full-screen image lightbox ── */}
      {lightboxUrl && <ImageLightbox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function WizzyMessage({
  text,
  imageUrl,
  onReplay,
  onExpand,
}: {
  text: string;
  imageUrl?: string;
  onReplay?: () => void;
  onExpand?: () => void;
}) {
  return (
    <div className="story-message-enter">
      {/* Cinematic full-bleed image panel */}
      {imageUrl && (
        <button
          type="button"
          onClick={onExpand}
          aria-label="View story image full screen"
          className="group relative block w-full text-left p-0 border-0 bg-transparent overflow-hidden rounded-2xl mb-3 max-w-2xl mx-auto aspect-video"
        >
          <img
            src={imageUrl}
            alt="Story scene"
            className="w-full h-full object-cover"
            style={{ animation: 'ken-burns 10s ease-in-out infinite alternate' }}
          />
          {/* Gradient overlay — image fades to page background at bottom */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, transparent 25%, rgba(0,0,0,0.45) 70%, rgba(0,0,0,0.78) 100%)',
            }}
          />
          {/* Tap-to-expand hint — always visible so it's discoverable on touch */}
          <div
            aria-hidden="true"
            className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-white opacity-80 group-hover:opacity-100 transition-opacity"
          >
            <Maximize2 size={14} />
          </div>
        </button>
      )}

      {/* Dialogue bubble */}
      <div className="flex items-start gap-3 max-w-[90%]">
        <div className="wizzy-avatar flex-shrink-0 w-14 h-14 rounded-full overflow-hidden shadow-md border-2 border-purple-wizzy/30">
          <img src={wizzyImg} alt="Wizzy" className="w-full h-full object-cover object-top" />
        </div>
        <div
          className="rounded-2xl rounded-tl-sm p-4 min-w-0 flex-1"
          style={{
            background: 'linear-gradient(135deg, rgba(245,243,255,0.97), rgba(237,233,254,0.92))',
            border: '1px solid rgba(139,92,246,0.18)',
            boxShadow: '0 2px 12px rgba(139,92,246,0.08)',
          }}
        >
          <p className="text-gray-800 leading-relaxed whitespace-pre-line break-words">
            <MathText text={text} />
          </p>
          {onReplay && (
            <div className="flex justify-end mt-2">
              <button
                onClick={onReplay}
                title="Replay Wizzy's voice"
                className="flex items-center gap-1 text-[10px] text-purple-wizzy/60 hover:text-purple-wizzy transition-colors"
              >
                <Play size={10} />
                replay
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChildMessage({ text, avatarUrl }: { text: string; avatarUrl?: string }) {
  return (
    <div className="child-message-enter flex items-start gap-3 max-w-[85%] ml-auto flex-row-reverse">
      <div className="flex-shrink-0 w-14 h-14 rounded-full bg-purple-wizzy overflow-hidden border-2 border-purple-wizzy/30 shadow-sm">
        {avatarUrl ? (
          <img src={avatarUrl} alt="You" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">You</span>
          </div>
        )}
      </div>
      <div className="bg-purple-wizzy/10 rounded-2xl rounded-tr-sm p-4 min-w-0">
        <p className="text-purple-wizzy font-medium break-words">
          <MathText text={text} />
        </p>
      </div>
    </div>
  );
}

function SystemMessage({ text, isCorrect }: { text: string; isCorrect: boolean }) {
  return (
    <div className="system-message-enter flex justify-center">
      <span
        className="text-sm px-5 py-2 rounded-full font-semibold shadow-sm"
        style={
          isCorrect
            ? {
                background: 'linear-gradient(90deg, #d1fae5, #a7f3d0)',
                color: '#047857',
                border: '1px solid rgba(16,185,129,0.3)',
              }
            : {
                background: 'linear-gradient(90deg, #fef3c7, #fde68a)',
                color: '#92400e',
                border: '1px solid rgba(245,158,11,0.3)',
              }
        }
      >
        {isCorrect ? '✅ ' : '💡 '}
        <MathText text={text} />
      </span>
    </div>
  );
}

function HintMessage({ hint }: { hint: HintResponse }) {
  const [wrongOption, setWrongOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);

  const hasQuiz = Boolean(hint.subQuestion && hint.subQuestionOptions && hint.subQuestionAnswer);

  const handlePick = (option: string) => {
    if (isCorrect) return;
    if (option === hint.subQuestionAnswer) {
      setIsCorrect(true);
      setWrongOption(null);
    } else {
      setWrongOption(option);
    }
  };

  return (
    <div className="hint-message-enter flex items-start gap-3 max-w-[85%]">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold-magic/10 flex items-center justify-center">
        <Lightbulb size={15} className="text-gold-magic" />
      </div>
      <div className="bg-amber-50 rounded-2xl rounded-tl-sm p-4 border-l-4 border-gold-magic/50 min-w-0 flex-1">
        <p className="text-amber-800 leading-relaxed whitespace-pre-line break-words">
          <MathText text={hint.hintText} />
        </p>

        {hasQuiz && (
          <>
            <p className="text-amber-900 font-bold text-sm mt-3 mb-2">
              <MathText text={hint.subQuestion!} />
            </p>

            <div className="grid grid-cols-2 gap-2">
              {hint.subQuestionOptions!.map((option, i) => {
                const wasWrong = wrongOption === option;
                const isPicked = isCorrect && option === hint.subQuestionAnswer;
                return (
                  <button
                    key={i}
                    onClick={() => handlePick(option)}
                    disabled={isCorrect}
                    className={`px-3 py-2 rounded-xl text-sm font-bold text-left transition-all active:scale-[0.96] ${
                      wasWrong ? 'animate-shake' : 'hover:scale-[1.02]'
                    }`}
                    style={{
                      background: wasWrong ? '#fef2f2' : isPicked ? '#f0fdf4' : 'white',
                      border: wasWrong
                        ? '2px solid #fca5a5'
                        : isPicked
                          ? '2px solid #6ee7b7'
                          : '2px solid rgba(217,119,6,0.2)',
                    }}
                  >
                    {OPTION_SHAPES[i]?.label ?? ''}. <MathText text={option} />
                  </button>
                );
              })}
            </div>

            {isCorrect && hint.encouragement && (
              <p
                className="text-emerald-600 font-semibold text-sm mt-3"
                style={{ animation: 'slide-up-fade 0.35s ease-out both' }}
              >
                <MathText text={hint.encouragement} />
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ReplayChallengeCard({ challenge }: { challenge: ReplayChallenge }) {
  return (
    <div
      className="story-message-enter rounded-3xl overflow-hidden max-w-2xl mx-auto w-full"
      style={{
        background: 'linear-gradient(160deg, #faf5ff 0%, #f3e8ff 40%, #ede9fe 100%)',
        border: '2px solid rgba(139,92,246,0.22)',
        boxShadow: '0 2px 8px rgba(139,92,246,0.08)',
      }}
    >
      <div
        className="h-1.5 w-full"
        style={{ background: 'linear-gradient(90deg, #8b5cf6, #f59e0b, #8b5cf6)' }}
      />
      <div className="p-5">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-extrabold text-white mb-4"
          style={{ background: 'linear-gradient(90deg, #7c3aed, #8b5cf6, #a78bfa)' }}
        >
          <Wand2 size={14} className="text-yellow-300" />
          Math Challenge
          <Zap size={14} className="text-yellow-300 fill-yellow-300" />
        </div>

        <p className="text-xl font-extrabold text-center text-gray-800 tracking-tight mb-3">
          <MathText text={challenge.problemText} />
        </p>

        {challenge.mathExpression && (
          <div className="flex justify-center mb-4">
            <div
              className="px-5 py-1.5 rounded-2xl text-2xl font-black text-purple-800 tracking-widest"
              style={{ background: 'white', border: '2px solid rgba(139,92,246,0.25)' }}
            >
              <MathText text={challenge.mathExpression} />
            </div>
          </div>
        )}

        {challenge.clockTime && (
          <div className="flex justify-center mb-4">
            <AnalogClock time={challenge.clockTime} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {challenge.options.map((option, i) => {
            const isCorrect = option === challenge.correctAnswer;
            return (
              <div
                key={i}
                className="relative rounded-2xl overflow-hidden"
                style={{
                  minHeight: 56,
                  background: isCorrect ? '#f0fdf4' : 'white',
                  border: isCorrect ? '2px solid #6ee7b7' : '2px solid rgba(139,92,246,0.15)',
                }}
              >
                <div className="flex items-center gap-3 px-3 py-3">
                  <div
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
                    style={{ background: isCorrect ? '#10b981' : '#8b5cf6' }}
                  >
                    {OPTION_SHAPES[i]?.label ?? ''}
                  </div>
                  <span className="font-bold text-gray-800 text-sm text-left flex-1">
                    <MathText text={option} />
                  </span>
                  {isCorrect && <Star size={15} className="text-emerald-500 fill-emerald-500" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="story-message-enter flex items-start gap-3 max-w-[75%]">
      <div
        className="relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
          animation: 'wizzy-thinking-pulse 2s ease-in-out infinite',
        }}
      >
        <Wand2 size={16} className="text-white" />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: '2px solid rgba(139,92,246,0.5)',
            animation: 'pulse-ring 1.5s ease-out infinite',
          }}
        />
      </div>
      <div
        className="rounded-2xl rounded-tl-sm px-5 py-4"
        style={{
          background: 'linear-gradient(135deg, rgba(245,243,255,0.97), rgba(237,233,254,0.92))',
          border: '1px solid rgba(139,92,246,0.18)',
          boxShadow: '0 2px 12px rgba(139,92,246,0.08)',
        }}
      >
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-purple-400 mr-2">Wizzy is thinking</span>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                fontSize: i % 2 === 0 ? 14 : 10,
                animation: `sparkle-dot 1.2s ease-in-out ${i * 200}ms infinite`,
                color: i % 2 === 0 ? '#8b5cf6' : '#f59e0b',
              }}
            >
              ✦
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChoiceBubbles({
  choices,
  onChoice,
}: {
  choices: string[];
  onChoice: (index: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-2 mb-1">
        <div className="h-px flex-1 bg-purple-wizzy/15 rounded" />
        <p className="text-xs text-purple-wizzy font-black uppercase tracking-widest px-2">
          Choose your path
        </p>
        <div className="h-px flex-1 bg-purple-wizzy/15 rounded" />
      </div>
      {choices.map((choice, i) => {
        const t = PATH_THEMES[i] ?? PATH_THEMES[0];
        return (
          <button
            key={i}
            onClick={() => onChoice(i)}
            className="group w-full text-left rounded-2xl transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-[0.98]"
            style={{
              background: t.gradient,
              border: `2px solid ${t.border}`,
              minHeight: 64,
              padding: '14px 16px',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = t.hover;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = t.border;
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm"
                style={{ background: 'rgba(255,255,255,0.7)' }}
              >
                {t.icon}
              </div>
              <div className="flex-1 min-w-0">
                <span
                  className="text-xs font-black uppercase tracking-widest block mb-0.5"
                  style={{ color: t.labelColor }}
                >
                  {t.label}
                </span>
                <span className="text-gray-800 font-semibold text-sm leading-snug break-words">
                  <MathText text={choice} />
                </span>
              </div>
              <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity"
                style={{ background: t.hover + '20' }}
              >
                <span className="text-sm font-black" style={{ color: t.labelColor }}>
                  ›
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

interface ChallengePanelProps {
  challenge: ICurrentChallenge;
  onAnswer: (answer: string) => void;
  onHint: () => void;
  onHide: () => void;
  lastFeedback: AnswerChallengeResponse | null;
  lastSubmittedAnswer: string | null;
}

function ChallengePanel({
  challenge,
  onAnswer,
  onHint,
  onHide,
  lastFeedback,
  lastSubmittedAnswer,
}: ChallengePanelProps) {
  return (
    <div
      className="flex-1 flex flex-col rounded-3xl overflow-hidden min-h-0"
      style={{
        background: 'linear-gradient(160deg, #faf5ff 0%, #f3e8ff 40%, #ede9fe 100%)',
        border: '2px solid rgba(139,92,246,0.22)',
        boxShadow: '0 -4px 32px rgba(139,92,246,0.10), 0 2px 8px rgba(139,92,246,0.08)',
      }}
    >
      {/* Shimmer bar at top */}
      <div
        className="h-1.5 w-full"
        style={{
          background: 'linear-gradient(90deg, #8b5cf6, #f59e0b, #8b5cf6)',
          backgroundSize: '200% 100%',
          animation: 'shimmer-text 3s linear infinite',
        }}
      />

      <div className="flex-1 flex flex-col p-5 min-h-0">
        {/* Challenge badge + hide button */}
        <div className="flex items-center justify-between mb-4">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-extrabold text-white"
            style={{
              background: 'linear-gradient(90deg, #7c3aed, #8b5cf6, #a78bfa)',
              boxShadow: '0 0 16px rgba(139,92,246,0.40)',
            }}
          >
            <Wand2 size={14} className="text-yellow-300" />
            Math Challenge!
            <Zap size={14} className="text-yellow-300 fill-yellow-300" />
          </div>
          <button
            onClick={onHide}
            aria-label="Hide challenge panel"
            className="flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-600 hover:bg-purple-wizzy/10 transition-colors px-3 py-2 rounded-lg"
          >
            Hide ✕
          </button>
        </div>

        {/* Scrollable middle region (scrollbar hidden) — question, expression, and options
            scroll together so the hint button below always stays visible */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
          <p
            className={`text-xl font-extrabold text-center text-gray-800 tracking-tight ${
              challenge.mathExpression || challenge.clockTime ? 'mb-3' : 'mb-5'
            }`}
          >
            <MathText text={challenge.problemText} />
          </p>

          {challenge.mathExpression && (
            <div className="flex justify-center mb-4">
              <div
                className="px-5 py-1.5 rounded-2xl text-2xl font-black text-purple-800 tracking-widest"
                style={{
                  background: 'white',
                  border: '2px solid rgba(139,92,246,0.25)',
                  boxShadow: '0 2px 10px rgba(139,92,246,0.14)',
                }}
              >
                <MathText text={challenge.mathExpression} />
              </div>
            </div>
          )}

          {challenge.clockTime && (
            <div className="flex justify-center mb-4">
              <AnalogClock time={challenge.clockTime} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 content-start">
            {challenge.options.map((option, i) => {
              const shape = OPTION_SHAPES[i] ?? OPTION_SHAPES[0];
              const wasWrong =
                lastFeedback && !lastFeedback.correct && option === lastSubmittedAnswer;
              const isRevealed = lastFeedback?.correctAnswer === option;

              return (
                <button
                  key={i}
                  onClick={() => onAnswer(option)}
                  disabled={Boolean(lastFeedback?.correct)}
                  className={`relative group rounded-2xl overflow-hidden transition-all active:scale-[0.96] ${
                    wasWrong
                      ? 'animate-shake'
                      : 'hover:scale-[1.03] hover:shadow-md hover:border-purple-wizzy/40'
                  }`}
                  style={{
                    minHeight: 56,
                    background: wasWrong ? '#fef2f2' : isRevealed ? '#f0fdf4' : 'white',
                    border: wasWrong
                      ? '2px solid #fca5a5'
                      : isRevealed
                        ? '2px solid #6ee7b7'
                        : '2px solid rgba(139,92,246,0.15)',
                    boxShadow: wasWrong ? 'none' : '0 2px 6px rgba(139,92,246,0.08)',
                  }}
                >
                  {/* Sparkle shimmer on hover */}
                  <div className="option-sparkle-hover absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100" />
                  <div className="flex items-center gap-3 px-3 py-3">
                    {/* Letter badge */}
                    <div
                      className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
                      style={{
                        background: wasWrong ? '#ef4444' : isRevealed ? '#10b981' : '#8b5cf6',
                      }}
                    >
                      {shape.label}
                    </div>
                    <span className="font-bold text-gray-800 text-sm text-left flex-1">
                      <MathText text={option} />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Retry / revealed answer prompt */}
        {lastFeedback && !lastFeedback.correct && !lastFeedback.correctAnswer && (
          <p
            className="text-center text-sm font-bold text-amber-600 mt-3"
            style={{ animation: 'slide-up-fade 0.35s ease-out both' }}
          >
            💪 Try again — you've got this!
          </p>
        )}
        {lastFeedback?.correctAnswer && (
          <p
            className="text-center text-sm font-semibold text-emerald-600 mt-3"
            style={{ animation: 'slide-up-fade 0.35s ease-out both' }}
          >
            The answer was{' '}
            <strong>
              <MathText text={lastFeedback.correctAnswer} />
            </strong>{' '}
            — keep going! 🌟
          </p>
        )}

        {challenge.hintLevel < 3 && (
          <div className="flex justify-center mt-4">
            <button
              onClick={onHint}
              className="flex items-center gap-1.5 text-sm font-semibold text-gold-magic hover:text-amber-600 transition-colors px-4 py-3 rounded-xl hover:bg-amber-50"
            >
              <Lightbulb size={15} />
              Ask Wizzy for help
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── World Particle Layer ──────────────────────────────────────────────────────

function WorldParticleLayer({ world }: { world: string }) {
  const cfg = WORLD_PARTICLES[world] ?? WORLD_PARTICLES.default;
  const ANIMS = ['particle-float-a', 'particle-float-b', 'particle-float-c'];

  const particles = useMemo(
    () =>
      Array.from({ length: cfg.count }, (_, i) => ({
        id: i,
        symbol: cfg.symbols[i % cfg.symbols.length],
        left: ((i * 137.508) % 92) + 4,
        top: ((i * 3 * 137.508) % 88) + 6,
        size: 10 + ((i * 5) % 14),
        duration: 7 + ((i * 3) % 8),
        delay: (i * 0.41) % 5,
        anim: ANIMS[i % 3],
        color: cfg.color[i % cfg.color.length],
      })),
    [cfg]
  );

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      {particles.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: `${p.top}%`,
            fontSize: p.size,
            color: p.color,
            opacity: 0.18,
            userSelect: 'none',
            animation: `${p.anim} ${p.duration}s ease-in-out ${p.delay}s infinite`,
            willChange: 'transform, opacity',
          }}
        >
          {p.symbol}
        </span>
      ))}
    </div>
  );
}

// ── Completion Overlay ────────────────────────────────────────────────────────

interface CompletionOverlayProps {
  data: CompleteAdventureResponse;
  onDashboard: () => void;
  onNewAdventure: () => void;
}

function CompletionOverlay({ data, onDashboard, onNewAdventure }: CompletionOverlayProps) {
  const [animatedStars, setAnimatedStars] = useState<Set<number>>(new Set());
  const [showXP, setShowXP] = useState(false);
  const [xpDisplay, setXpDisplay] = useState(0);
  const [showTotals, setShowTotals] = useState(false);
  const [showExtras, setShowExtras] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  // Stagger the reveal sequence
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Stars pop in one by one (earned only)
    for (let i = 1; i <= data.starsEarned; i++) {
      timers.push(
        setTimeout(() => setAnimatedStars((prev) => new Set([...prev, i])), 500 + i * 320)
      );
    }

    // XP counter starts after last star
    const xpDelay = 500 + data.starsEarned * 320 + 380;
    timers.push(setTimeout(() => setShowXP(true), xpDelay));
    timers.push(setTimeout(() => setShowTotals(true), xpDelay + 750));
    timers.push(setTimeout(() => setShowExtras(true), xpDelay + 1050));
    timers.push(setTimeout(() => setShowButtons(true), xpDelay + 1350));

    return () => timers.forEach(clearTimeout);
  }, [data.starsEarned]);

  // XP count-up with ease-out cubic
  useEffect(() => {
    if (!showXP) return;
    if (data.xpEarned === 0) {
      setXpDisplay(0);
      return;
    }
    const duration = 900;
    const startTime = Date.now();
    let rafId: number;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setXpDisplay(Math.floor(eased * data.xpEarned));
      if (progress < 1) rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [showXP, data.xpEarned]);

  const hasExtras = !!(data.newLevel || data.newBadges?.length);

  // Stable confetti list (derived from module-level constant, no re-computation needed)
  const confetti = useMemo(() => CONFETTI_PARTICLES, []);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-6">
      <div
        className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-5 overflow-y-auto overflow-x-hidden max-h-[88vh] scrollbar-hide"
        style={{ animation: 'pop-in 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}
      >
        {/* Confetti burst from bottom */}
        <div className="absolute inset-x-0 bottom-0 pointer-events-none" aria-hidden="true">
          {confetti.map((c) => (
            <div
              key={c.id}
              className="absolute rounded-full"
              style={{
                left: `${c.x}%`,
                bottom: 0,
                width: c.size,
                height: c.size,
                backgroundColor: c.color,
                animation: `confetti-rise 1.3s ${c.delay}ms ease-out forwards`,
              }}
            />
          ))}
        </div>

        {/* Trophy + title */}
        <div className="text-5xl animate-bounce select-none">🎉</div>
        <h1 className="text-2xl font-bold text-purple-wizzy text-center">Adventure Complete!</h1>

        {/* Stars */}
        <div className="flex items-center gap-3">
          {[1, 2, 3].map((i) => {
            const lit = animatedStars.has(i);
            return (
              <Star
                key={i}
                size={40}
                className={lit ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}
                style={
                  lit
                    ? {
                        animation: 'star-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                      }
                    : {}
                }
              />
            );
          })}
        </div>

        {/* XP earned */}
        {showXP && (
          <div
            className="flex items-center gap-2 bg-purple-wizzy/10 rounded-xl px-6 py-3"
            style={{ animation: 'slide-up-fade 0.4s ease-out forwards' }}
          >
            <Zap size={22} className="text-gold-magic fill-gold-magic" />
            <span className="font-bold text-purple-wizzy text-xl">+{xpDisplay} XP</span>
          </div>
        )}

        {/* Totals */}
        {showTotals && (
          <div
            className="flex gap-10 text-sm text-gray-500"
            style={{ animation: 'slide-up-fade 0.4s ease-out forwards' }}
          >
            <div className="text-center">
              <p className="font-bold text-gray-800 text-lg">{data.totalXP.toLocaleString()}</p>
              <p>Total XP</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-800 text-lg">{data.totalStars}</p>
              <p>Total Stars</p>
            </div>
          </div>
        )}

        {/* Level-up + new badge */}
        {showExtras && hasExtras && (
          <div
            className="flex flex-col gap-2 w-full"
            style={{ animation: 'slide-up-fade 0.4s ease-out forwards' }}
          >
            {data.newLevel && (
              <div
                className="flex items-center gap-2 bg-gold-magic/10 rounded-xl px-5 py-3 w-full justify-center border border-gold-magic/30"
                style={{ animation: 'glow-pulse 2s ease-in-out infinite' }}
              >
                <Trophy size={18} className="text-gold-magic" />
                <span className="font-bold text-amber-700 text-sm">
                  Level Up! You're now Level {data.newLevel} 🚀
                </span>
              </div>
            )}
            {data.newBadges?.map((badge) => (
              <div
                key={badge.badgeType}
                className="flex items-center gap-3 bg-purple-wizzy/5 rounded-xl px-4 py-3 w-full border border-purple-wizzy/10"
              >
                <span className="text-2xl">{BADGE_EMOJIS[badge.badgeType] ?? '🏅'}</span>
                <div>
                  <p className="font-bold text-purple-wizzy text-sm">{badge.badgeName}</p>
                  <p className="text-xs text-gray-500">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        {showButtons && (
          <div
            className="flex gap-3 w-full pt-1"
            style={{ animation: 'slide-up-fade 0.4s ease-out forwards' }}
          >
            <button
              onClick={onDashboard}
              className="flex-1 py-3 rounded-xl border-2 border-purple-wizzy/30 text-purple-wizzy font-semibold hover:bg-purple-wizzy/5 transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={onNewAdventure}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-purple-wizzy text-white font-semibold hover:bg-purple-700 transition-colors"
            >
              <Sparkles size={15} className="text-gold-magic" />
              New Adventure
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Image Lightbox ────────────────────────────────────────────────────────────

function ImageLightbox({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    contentRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-label="Story image"
        tabIndex={-1}
        className="relative outline-none"
        style={{ animation: 'pop-in 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt="Story scene, full view"
          className="max-w-[95vw] max-h-[85vh] object-contain rounded-xl md:rounded-2xl"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
