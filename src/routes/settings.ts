import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '../db.js';

const settingsRoutes = new Hono();

// Get user profile
settingsRoutes.get('/profile', async (c) => {
  try {
    // TODO: Get user from JWT token
    const userId = 1; // Mock user ID - replace with actual auth

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        academicYear: true,
        isHOC: true,
        isHOCPending: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    return c.json({ error: 'Failed to get profile' }, 500);
  }
});

// Update user profile
const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  department: z.string().optional(),
  academicYear: z.string().optional(),
});

settingsRoutes.put('/profile', async (c) => {
  try {
    const userId = 1; // Mock user ID - replace with actual auth
    const body = await c.req.json();
    
    const validatedData = updateProfileSchema.parse(body);

    const user = await prisma.user.update({
      where: { id: userId },
      data: validatedData,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        academicYear: true,
        isHOC: true,
        isHOCPending: true,
        updatedAt: true,
      },
    });

    return c.json({ 
      success: true, 
      message: 'Profile updated successfully',
      user 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid data', details: error.errors }, 400);
    }
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// Simple preferences endpoint (mock for now)
settingsRoutes.put('/preferences', async (c) => {
  try {
    const body = await c.req.json();
    
    // Mock response - these will be stored in frontend state for now
    const preferences = {
      notificationsEnabled: body.notificationsEnabled ?? true,
      darkModeEnabled: body.darkModeEnabled ?? true,
      language: body.language ?? 'en',
    };

    return c.json({ 
      success: true, 
      message: 'Preferences updated successfully',
      preferences 
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    return c.json({ error: 'Failed to update preferences' }, 500);
  }
});

// Change password
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

settingsRoutes.put('/change-password', async (c) => {
  try {
    const userId = 1; // Mock user ID - replace with actual auth
    const body = await c.req.json();
    
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    // For now, just update without verification
    await prisma.user.update({
      where: { id: userId },
      data: { 
        password: newPassword,
        updatedAt: new Date() 
      },
    });

    return c.json({ 
      success: true, 
      message: 'Password changed successfully' 
    });
  } catch (error) {
    console.error('Change password error:', error);
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid data', details: error.errors }, 400);
    }
    return c.json({ error: 'Failed to change password' }, 500);
  }
});

// Get HOC tools data (if user is HOC)
settingsRoutes.get('/hoc-tools', async (c) => {
  try {
    const userId = 1; // Mock user ID - replace with actual auth

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isHOC: true },
    });

    if (!user || !user.isHOC) {
      return c.json({ error: 'HOC access required' }, 403);
    }

    // Mock HOC data
    const hocData = {
      managedClasses: [
        { id: 1, name: 'Data Structures', code: 'CSC301', studentCount: 45 },
        { id: 2, name: 'Database Systems', code: 'CSC302', studentCount: 38 },
      ],
      pendingApprovals: 3,
      recentActivities: [
        { type: 'attendance', class: 'Data Structures', date: '2024-01-15' },
        { type: 'announcement', class: 'Database Systems', date: '2024-01-14' },
      ],
    };

    return c.json({ hocData });
  } catch (error) {
    console.error('Get HOC tools error:', error);
    return c.json({ error: 'Failed to get HOC tools data' }, 500);
  }
});

export default settingsRoutes;