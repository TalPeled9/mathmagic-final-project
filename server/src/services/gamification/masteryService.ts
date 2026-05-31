import type { TopicStat } from '@mathmagic/types';
import type { Difficulty } from '../ai/difficultyEngine';
import { TopicProgress } from '../../models/TopicProgress';
import { CURRICULUM_TOPICS } from '../../config/curriculumTopics';

/**
 * Upserts a TopicProgress record and recalculates mastery.
 *
 * Mastery formula: max(0, floor((correctAnswers / totalChallenges) * 100 - hintsUsed * 5))
 *
 * The hint penalty (5 pts per hint used across ALL challenges in this topic) discourages
 * over-reliance on hints and gives a more accurate picture of independent mastery.
 */
export async function updateTopicMastery(
  childId: string,
  mathTopic: string,
  correct: boolean,
  hintUsed: boolean
): Promise<void> {
  const inc: Record<string, number> = {
    totalChallenges: 1,
    ...(correct ? { correctAnswers: 1 } : { incorrectAnswers: 1 }),
    ...(hintUsed ? { hintsUsed: 1 } : {}),
  };

  const doc = await TopicProgress.findOneAndUpdate(
    { childId, mathTopic },
    { $inc: inc, $set: { lastPracticedAt: new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (doc && doc.totalChallenges > 0) {
    const rawMastery = (doc.correctAnswers / doc.totalChallenges) * 100 - doc.hintsUsed * 5;
    const masteryLevel = Math.max(0, Math.floor(rawMastery));
    await TopicProgress.updateOne({ _id: doc._id }, { $set: { masteryLevel } });
  }
}

export async function updateTopicDifficulty(
  childId: string,
  mathTopic: string,
  difficulty: Difficulty
): Promise<void> {
  await TopicProgress.updateOne(
    { childId, mathTopic },
    { $set: { currentDifficulty: difficulty } },
    { upsert: true }
  );
}

/**
 * Returns all topic progress records for a child, enriched with display metadata
 * from CURRICULUM_TOPICS config (name, icon, color).
 */
export async function getTopicStats(childId: string): Promise<TopicStat[]> {
  const docs = await TopicProgress.find({ childId }).lean();

  return docs.map((doc) => {
    const config = CURRICULUM_TOPICS.find((t) => t.id === doc.mathTopic);
    return {
      mathTopic: doc.mathTopic,
      name: config?.name ?? doc.mathTopic,
      icon: config?.icon ?? 'BookOpen',
      color: config?.color ?? 'from-gray-400 to-gray-500',
      totalChallenges: doc.totalChallenges,
      correctAnswers: doc.correctAnswers,
      incorrectAnswers: doc.incorrectAnswers,
      hintsUsed: doc.hintsUsed,
      masteryLevel: doc.masteryLevel,
      // lean() widens the Mongoose enum to string; schema + default guarantee the value is valid
      currentDifficulty: (doc.currentDifficulty ?? 'easy') as 'easy' | 'medium' | 'hard',
      lastPracticedAt: doc.lastPracticedAt?.toISOString(),
    };
  });
}
