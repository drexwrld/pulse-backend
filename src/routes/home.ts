// apps/api/src/routes/home.ts
import { Hono } from 'hono';
import { prisma } from '../db.js';

const home = new Hono();

// Get complete dashboard data
home.get('/dashboard', async (c) => {
  try {
    // TODO: Get userId from JWT token
    const userId = 1; // Placeholder

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get user's enrollments for today's classes
    const todayClasses = await prisma.class.findMany({
      where: {
        enrollments: {
          some: { userId },
        },
        // TODO: Add date filtering based on your schedule logic
      },
      include: {
        instructor: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Get cancelled classes count
    const cancelledCount = await prisma.class.count({
      where: {
        enrollments: {
          some: { userId },
        },
        status: 'CANCELLED',
        // TODO: Add today filter
      },
    });

    // Get unread updates count
    const updatesCount = await prisma.scheduleUpdate.count({
      where: {
        class: {
          enrollments: {
            some: { userId },
          },
        },
        // TODO: Add unread filter
      },
    });

    // Get pending assignments count
    const tasksPending = await prisma.assignment.count({
      where: {
        class: {
          enrollments: {
            some: { userId },
          },
        },
        dueDate: {
          gte: new Date(),
        },
        submissions: {
          none: {
            userId,
          },
        },
      },
    });

    // Find next class
    const now = new Date();
    const nextClass = todayClasses.find((cls) => {
      // TODO: Implement proper time comparison
      return true; // Placeholder
    });

    // Get recent updates
    const recentUpdates = await prisma.scheduleUpdate.findMany({
      where: {
        class: {
          enrollments: {
            some: { userId },
          },
        },
      },
      include: {
        class: {
          select: {
            name: true,
          },
        },
        createdBy: {
          select: {
            fullName: true,
            isHOC: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    return c.json({
      stats: {
        totalClasses: todayClasses.length,
        cancelledClasses: cancelledCount,
        updatesCount,
        tasksPending,
      },
      nextClass: nextClass
        ? {
            id: nextClass.id,
            name: nextClass.name,
            code: nextClass.code,
            time: nextClass.startTime,
            location: nextClass.location,
            instructor: nextClass.instructor?.fullName || 'Unknown',
            minutesUntil: 45, // TODO: Calculate actual time
          }
        : null,
      todayClasses: todayClasses.map((cls) => ({
        id: cls.id,
        name: cls.name,
        code: cls.code,
        time: `${cls.startTime} - ${cls.endTime}`,
        location: cls.location,
        instructor: cls.instructor?.fullName || 'Unknown',
        status: cls.status.toLowerCase(),
      })),
      recentUpdates: recentUpdates.map((update) => ({
        id: update.id,
        type: update.updateType.toLowerCase(),
        className: update.class.name,
        reason: update.reason,
        oldTime: update.oldTime,
        newTime: update.newTime,
        oldLocation: update.oldLocation,
        newLocation: update.newLocation,
        changedBy: `${update.createdBy.isHOC ? 'HOC' : 'Admin'} - ${
          update.createdBy.fullName
        }`,
        timestamp: getRelativeTime(update.createdAt),
      })),
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return c.json({ error: 'Failed to fetch dashboard data' }, 500);
  }
});

// Get quick stats only
home.get('/stats', async (c) => {
  try {
    const userId = 1; // TODO: Get from JWT

    const [totalClasses, cancelledClasses, updatesCount, tasksPending] =
      await Promise.all([
        prisma.class.count({
          where: {
            enrollments: { some: { userId } },
            // TODO: Add today filter
          },
        }),
        prisma.class.count({
          where: {
            enrollments: { some: { userId } },
            status: 'CANCELLED',
            // TODO: Add today filter
          },
        }),
        prisma.scheduleUpdate.count({
          where: {
            class: { enrollments: { some: { userId } } },
            // TODO: Add unread filter
          },
        }),
        prisma.assignment.count({
          where: {
            class: { enrollments: { some: { userId } } },
            dueDate: { gte: new Date() },
            submissions: { none: { userId } },
          },
        }),
      ]);

    return c.json({
      totalClasses,
      cancelledClasses,
      updatesCount,
      tasksPending,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// Helper function to get relative time
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export default home;