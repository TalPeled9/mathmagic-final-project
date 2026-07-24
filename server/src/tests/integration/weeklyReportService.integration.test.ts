import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import User from '../../models/User';
import { Child } from '../../models/Child';
import { Adventure } from '../../models/Adventure';
import { LearningSession } from '../../models/LearningSession';
import { TopicProgress } from '../../models/TopicProgress';
import { getChildWeekStats, getParentWeekReport } from '../../services/weeklyReportService';

const WEEK_START = new Date('2026-01-05T00:00:00.000Z'); // Monday
const WEEK_END = new Date('2026-01-12T00:00:00.000Z');
const PREV_WEEK_START = new Date('2025-12-29T00:00:00.000Z');

describe('weeklyReportService', () => {
  let mongoServer: MongoMemoryServer;
  let parentId: string;
  let childId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), { dbName: 'mathmagic-weekly-report-tests' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Child.deleteMany({});
    await Adventure.deleteMany({});
    await LearningSession.deleteMany({});
    await TopicProgress.deleteMany({});

    const parent = await User.create({
      email: 'parent@example.com',
      name: 'Dana Cohen',
      passwordHash: 'hashed',
    });
    parentId = String(parent._id);

    const child = await Child.create({
      parentId: parent._id,
      name: 'Ari',
      gradeLevel: 3,
      avatars: [{ imageData: '', description: '', createdAt: new Date() }],
      activeAvatarIndex: 0,
      totalXP: 180,
      badges: [
        {
          badgeType: 'first-adventure',
          earnedAt: new Date('2026-01-06T10:00:00.000Z'), // inside week
        },
        {
          badgeType: 'perfect-score',
          earnedAt: new Date('2025-12-20T10:00:00.000Z'), // outside week
        },
      ],
    });
    childId = String(child._id);
  });

  it('includes adventures completed inside the week and excludes the boundary adventures', async () => {
    await Adventure.create([
      {
        childId,
        mathTopic: 'g1_addition',
        storyWorld: 'space',
        status: 'completed',
        completedAt: new Date(WEEK_START.getTime() + 60_000), // just inside
        xpEarned: 50,
        starsEarned: 3,
        totalChallenges: 10,
        correctAnswers: 9,
      },
      {
        childId,
        mathTopic: 'g1_addition',
        storyWorld: 'ocean',
        status: 'completed',
        completedAt: new Date(WEEK_START.getTime() - 1), // 1ms before weekStart — excluded
        xpEarned: 999,
        starsEarned: 3,
        totalChallenges: 10,
        correctAnswers: 10,
      },
      {
        childId,
        mathTopic: 'g1_addition',
        storyWorld: 'jungle',
        status: 'completed',
        completedAt: WEEK_END, // exactly weekEnd — excluded ($lt)
        xpEarned: 999,
        starsEarned: 3,
        totalChallenges: 10,
        correctAnswers: 10,
      },
    ]);

    const child = await Child.findById(childId);
    const stats = await getChildWeekStats(child!, WEEK_START, WEEK_END);

    expect(stats.adventuresCompletedThisWeek).toBe(1);
    expect(stats.xpEarnedThisWeek).toBe(50);
    expect(stats.starsEarnedThisWeek).toBe(3);
    expect(stats.hasActivity).toBe(true);
    expect(stats.recentAdventures).toHaveLength(1);
    expect(stats.recentAdventures[0].storyWorld).toBe('space');
  });

  it('splits learning minutes between this week and last week', async () => {
    await LearningSession.create([
      {
        childId,
        adventureId: new mongoose.Types.ObjectId(),
        date: new Date(WEEK_START.getTime() + 24 * 60 * 60 * 1000),
        duration: 20,
      },
      {
        childId,
        adventureId: new mongoose.Types.ObjectId(),
        date: new Date(PREV_WEEK_START.getTime() + 24 * 60 * 60 * 1000),
        duration: 15,
      },
    ]);

    const child = await Child.findById(childId);
    const stats = await getChildWeekStats(child!, WEEK_START, WEEK_END);

    expect(stats.minutesThisWeek).toBe(20);
    expect(stats.minutesLastWeek).toBe(15);
  });

  it('only includes badges earned within the week window', async () => {
    const child = await Child.findById(childId);
    const stats = await getChildWeekStats(child!, WEEK_START, WEEK_END);

    expect(stats.newBadgesThisWeek).toHaveLength(1);
    expect(stats.newBadgesThisWeek[0].badgeType).toBe('first-adventure');
    expect(stats.newBadgesThisWeek[0].badgeName).toBe('First Adventure');
  });

  it('reports hasActivity: false for a child with no adventures or minutes this week', async () => {
    const child = await Child.findById(childId);
    const stats = await getChildWeekStats(child!, WEEK_START, WEEK_END);

    expect(stats.hasActivity).toBe(false);
    expect(stats.adventuresCompletedThisWeek).toBe(0);
    expect(stats.minutesThisWeek).toBe(0);
  });

  it('getParentWeekReport aggregates all of a parent\'s children and computes hasAnyActivity', async () => {
    await Adventure.create({
      childId,
      mathTopic: 'g1_addition',
      storyWorld: 'space',
      status: 'completed',
      completedAt: new Date(WEEK_START.getTime() + 60_000),
      xpEarned: 10,
      starsEarned: 1,
      totalChallenges: 5,
      correctAnswers: 4,
    });

    const report = await getParentWeekReport(parentId, { weekStart: WEEK_START, weekEnd: WEEK_END });

    expect(report).not.toBeNull();
    expect(report!.parent.email).toBe('parent@example.com');
    expect(report!.children).toHaveLength(1);
    expect(report!.hasAnyActivity).toBe(true);
  });

  it('returns null for an unknown parentId', async () => {
    const report = await getParentWeekReport(String(new mongoose.Types.ObjectId()), {
      weekStart: WEEK_START,
      weekEnd: WEEK_END,
    });
    expect(report).toBeNull();
  });
});
