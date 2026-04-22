import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Sparkles, ArrowLeft, Lightbulb, Star, Zap, Trophy, Wand2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { adventureService } from '@/services/adventureService';
import type {
  ICurrentChallenge,
  CompleteAdventureResponse,
  AnswerChallengeResponse,
  HintResponse,
  StorySegment,
} from '@mathmagic/types';

// ── Local types ───────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'wizzy' | 'child' | 'system' | 'hint';
  text: string;
  imageUrl?: string;
  isCorrect?: boolean; // for system messages
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

// ── Main component ────────────────────────────────────────────────────────────

export default function StoryChat() {
  const { adventureId } = useParams<{ adventureId: string }>();
  const { activeChild } = useAuth();
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);

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
    null,
  );
  const [lastSubmittedAnswer, setLastSubmittedAnswer] = useState<string | null>(null);
  const [pendingContinue, setPendingContinue] = useState(false);
  const [adventureContext, setAdventureContext] = useState<{
    mathTopic: string;
    storyWorld: string;
  } | null>(null);

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
      setCurrentChoices(segment.choices ?? []);
      setCurrentChallenge(segment.challenge);
      setIsLastStep(segment.isLastStep);
      setLastAnswerFeedback(null);
      setLastSubmittedAnswer(null);
      setPendingContinue(false);
    },
    [addMessage],
  );

  // ── Mount: load adventure state (start or resume) ────────────────────────────

  useEffect(() => {
    if (!adventureId) return;

    const load = async () => {
      const adventure = await adventureService.get(adventureId);
      setAdventureContext({ mathTopic: adventure.mathTopic, storyWorld: adventure.storyWorld });

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
          }),
        );
      }

      // Reconstruct chat from persisted conversation history
      let wizzyCount = 0;
      const msgs: ChatMessage[] = adventure.conversationHistory.map((entry, i) => {
        const isCorrectMsg =
          entry.role === 'system' &&
          (entry.content.startsWith('Correct') || entry.content.startsWith('Great job'));
        const imageUrl = entry.role === 'wizzy' ? stepImageUrls[wizzyCount++] : undefined;
        return {
          id: `hist-${i}`,
          role: entry.role as 'wizzy' | 'child' | 'system',
          text: entry.content,
          imageUrl,
          isCorrect: entry.role === 'system' ? isCorrectMsg : undefined,
        };
      });
      setMessages(msgs);

      if (adventure.status === 'completed') {
        setAdventureStatus('completed');
        return;
      }

      setCurrentChallenge(adventure.currentChallenge);

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

      setAdventureStatus('in-progress');
    };

    load().catch(() => {
      toast.error('Failed to load adventure');
      setAdventureStatus('error');
    });
  }, [adventureId]);

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
    [adventureId, isProcessing, currentChoices, addMessage, applySegment],
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
        setLastAnswerFeedback(response);

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
    [adventureId, isProcessing, addMessage, isLastStep],
  );

  const handleHint = useCallback(async () => {
    if (!adventureId || isProcessing) return;
    setIsProcessing(true);

    try {
      const response: HintResponse = await adventureService.hint(adventureId);
      const hintText = response.subQuestion
        ? `${response.hintText}\n\n💭 ${response.subQuestion}`
        : response.hintText;
      addMessage({ role: 'hint', text: hintText });
      setCurrentChallenge((prev) =>
        prev
          ? { ...prev, hintLevel: Math.min(prev.hintLevel + 1, 3) as 0 | 1 | 2 | 3 }
          : null,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to get hint');
    } finally {
      setIsProcessing(false);
    }
  }, [adventureId, isProcessing, addMessage]);

  const handleFinishAdventure = useCallback(async () => {
    if (!adventureId || isProcessing) return;
    setIsProcessing(true);

    try {
      const response = await adventureService.complete(adventureId);
      setCompletionData(response);
      setAdventureStatus('completed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to complete adventure');
    } finally {
      setIsProcessing(false);
    }
  }, [adventureId, isProcessing]);

  // ── Render ───────────────────────────────────────────────────────────────────

  if (adventureStatus === 'loading') {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-400">
          <Sparkles size={20} className="animate-pulse text-purple-wizzy" />
          <span>Loading your adventure...</span>
        </div>
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
    <div className="min-h-screen bg-parchment flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-10 bg-parchment/90 backdrop-blur-sm border-b border-gray-100 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/child/dashboard')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-wizzy transition-colors px-3 py-1.5 rounded-lg hover:bg-purple-wizzy/10"
          >
            <ArrowLeft size={15} />
            Dashboard
          </button>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <Sparkles className="text-gold-magic" size={18} />
              <span className="font-bold text-purple-wizzy">MathMagic</span>
            </div>
            {adventureContext && (
              <span className="text-xs text-gray-400 capitalize">
                {adventureContext.storyWorld.replace(/-/g, ' ')} ·{' '}
                {adventureContext.mathTopic}
              </span>
            )}
          </div>

          {/* Spacer */}
          <div className="w-24" />
        </div>
      </header>

      {/* ── Message list ── */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4 pb-4">
          {messages.map((msg) => {
            if (msg.role === 'wizzy')
              return (
                <WizzyMessage key={msg.id} text={msg.text} imageUrl={msg.imageUrl} />
              );
            if (msg.role === 'child')
              return (
                <ChildMessage
                  key={msg.id}
                  text={msg.text}
                  avatarUrl={activeChild?.avatarUrl}
                />
              );
            if (msg.role === 'hint') return <HintMessage key={msg.id} text={msg.text} />;
            return (
              <SystemMessage
                key={msg.id}
                text={msg.text}
                isCorrect={msg.isCorrect ?? false}
              />
            );
          })}

          {isProcessing && <TypingIndicator />}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* ── Interactive panel ── */}
      {adventureStatus === 'in-progress' && !isProcessing && !completionData && (
        <div className="sticky bottom-0 bg-parchment/95 backdrop-blur-sm border-t border-gray-100 px-4 py-4">
          <div className="max-w-2xl mx-auto">
            {currentChallenge ? (
              <ChallengePanel
                challenge={currentChallenge}
                onAnswer={handleAnswer}
                onHint={handleHint}
                lastFeedback={lastAnswerFeedback}
                lastSubmittedAnswer={lastSubmittedAnswer}
              />
            ) : pendingContinue ? (
              <div className="flex justify-center">
                <button
                  onClick={handleAutoContinue}
                  className="flex items-center gap-2 bg-purple-wizzy text-white rounded-xl px-8 py-3 font-bold hover:bg-purple-700 transition-all shadow-sm"
                >
                  <Wand2 size={18} />
                  Continue Story
                </button>
              </div>
            ) : currentChoices.length > 0 ? (
              <ChoiceBubbles choices={currentChoices} onChoice={handleChoice} />
            ) : isLastStep ? (
              <div className="flex justify-center">
                <button
                  onClick={handleFinishAdventure}
                  className="flex items-center gap-2 bg-gold-magic text-white rounded-xl px-8 py-3 font-bold hover:bg-amber-500 transition-all shadow-sm"
                >
                  <Trophy size={18} />
                  Finish Adventure!
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Completion overlay ── */}
      {completionData && (
        <CompletionOverlay
          data={completionData}
          onDashboard={() => navigate('/child/dashboard')}
          onNewAdventure={() => navigate('/child/adventure')}
        />
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function WizzyMessage({ text, imageUrl }: { text: string; imageUrl?: string }) {
  return (
    <div className="flex items-start gap-3 max-w-[85%]">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-wizzy/10 flex items-center justify-center">
        <Sparkles size={15} className="text-purple-wizzy" />
      </div>
      <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm border-l-4 border-purple-wizzy/30 min-w-0">
        <p className="text-gray-800 leading-relaxed whitespace-pre-line break-words">{text}</p>
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Story scene"
            className="mt-3 rounded-xl w-full object-cover max-h-72"
          />
        )}
      </div>
    </div>
  );
}

function ChildMessage({ text, avatarUrl }: { text: string; avatarUrl?: string }) {
  return (
    <div className="flex items-start gap-3 max-w-[85%] ml-auto flex-row-reverse">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-wizzy overflow-hidden">
        {avatarUrl ? (
          <img src={avatarUrl} alt="You" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">You</span>
          </div>
        )}
      </div>
      <div className="bg-purple-wizzy/10 rounded-2xl rounded-tr-sm p-4 min-w-0">
        <p className="text-purple-wizzy font-medium break-words">{text}</p>
      </div>
    </div>
  );
}

function SystemMessage({ text, isCorrect }: { text: string; isCorrect: boolean }) {
  return (
    <div className="flex justify-center">
      <span
        className={`text-sm px-4 py-1.5 rounded-full font-medium ${
          isCorrect ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
        }`}
      >
        {text}
      </span>
    </div>
  );
}

function HintMessage({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 max-w-[85%]">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold-magic/10 flex items-center justify-center">
        <Lightbulb size={15} className="text-gold-magic" />
      </div>
      <div className="bg-amber-50 rounded-2xl rounded-tl-sm p-4 border-l-4 border-gold-magic/50 min-w-0">
        <p className="text-amber-800 leading-relaxed whitespace-pre-line break-words">{text}</p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 max-w-[85%]">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-wizzy/10 flex items-center justify-center">
        <Sparkles size={15} className="text-purple-wizzy" />
      </div>
      <div className="bg-white rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm border-l-4 border-purple-wizzy/30">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-purple-wizzy/40 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
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
    <div className="space-y-2">
      <p className="text-xs text-gray-400 text-center mb-3">Choose your path:</p>
      {choices.map((choice, i) => (
        <button
          key={i}
          onClick={() => onChoice(i)}
          className="w-full text-left bg-white rounded-xl px-4 py-3 shadow-sm border-2 border-transparent hover:border-purple-wizzy/30 hover:shadow-md hover:-translate-y-0.5 transition-all text-gray-700 hover:text-purple-wizzy font-medium"
        >
          {choice}
        </button>
      ))}
    </div>
  );
}

interface ChallengePanelProps {
  challenge: ICurrentChallenge;
  onAnswer: (answer: string) => void;
  onHint: () => void;
  lastFeedback: AnswerChallengeResponse | null;
  lastSubmittedAnswer: string | null;
}

function ChallengePanel({ challenge, onAnswer, onHint, lastFeedback, lastSubmittedAnswer }: ChallengePanelProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 justify-center mb-4">
        <span className="text-lg">🧮</span>
        <p className="text-base font-semibold text-gray-800 text-center">
          {challenge.problemText}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {challenge.options.map((option, i) => {
          const wasWrong =
            lastFeedback && !lastFeedback.correct && option === lastSubmittedAnswer;
          return (
            <button
              key={i}
              onClick={() => onAnswer(option)}
              className={`rounded-xl px-3 py-3 text-center font-medium transition-colors border-2 ${
                wasWrong
                  ? 'bg-red-50 border-red-200 text-red-500'
                  : 'bg-purple-wizzy/5 border-transparent hover:bg-purple-wizzy/15 hover:text-purple-wizzy hover:border-purple-wizzy/20 text-gray-700'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {challenge.hintLevel < 3 && (
        <div className="flex justify-center mt-4">
          <button
            onClick={onHint}
            className="flex items-center gap-1.5 text-sm text-gold-magic hover:text-amber-600 transition-colors"
          >
            <Lightbulb size={14} />
            Ask Wizzy for help
          </button>
        </div>
      )}
    </div>
  );
}

interface CompletionOverlayProps {
  data: CompleteAdventureResponse;
  onDashboard: () => void;
  onNewAdventure: () => void;
}

function CompletionOverlay({ data, onDashboard, onNewAdventure }: CompletionOverlayProps) {
  return (
    <div className="fixed inset-0 bg-parchment/95 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center gap-5">
        <div className="text-5xl">🎉</div>
        <h1 className="text-2xl font-bold text-purple-wizzy text-center">
          Adventure Complete!
        </h1>

        {/* Stars */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((i) => (
            <Star
              key={i}
              size={32}
              className={
                i <= data.starsEarned
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-200 fill-gray-200'
              }
            />
          ))}
        </div>

        {/* XP */}
        <div className="flex items-center gap-2 bg-purple-wizzy/10 rounded-xl px-6 py-3">
          <Zap size={20} className="text-gold-magic fill-gold-magic" />
          <span className="font-bold text-purple-wizzy text-lg">+{data.xpEarned} XP</span>
        </div>

        {/* Totals */}
        <div className="flex gap-8 text-sm text-gray-500">
          <div className="text-center">
            <p className="font-bold text-gray-800 text-base">{data.totalXP}</p>
            <p>Total XP</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-800 text-base">{data.totalStars}</p>
            <p>Total Stars</p>
          </div>
        </div>

        {/* Level up */}
        {data.newLevel && (
          <div className="flex items-center gap-2 bg-gold-magic/10 rounded-xl px-5 py-3 w-full justify-center">
            <Trophy size={18} className="text-gold-magic" />
            <span className="font-bold text-amber-700 text-sm">
              Level Up! You're now Level {data.newLevel} 🚀
            </span>
          </div>
        )}

        {/* Badge */}
        {data.newBadge && (
          <div className="flex items-center gap-3 bg-purple-wizzy/5 rounded-xl px-4 py-3 w-full">
            <span className="text-2xl">
              {BADGE_EMOJIS[data.newBadge.badgeType] ?? '🏅'}
            </span>
            <div>
              <p className="font-bold text-purple-wizzy text-sm">{data.newBadge.badgeName}</p>
              <p className="text-xs text-gray-500">{data.newBadge.description}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 w-full pt-1">
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
      </div>
    </div>
  );
}
