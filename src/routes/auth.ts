// apps/api/src/routes/auth.ts
import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';

const authRoutes = new Hono();

// Validation schemas
const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['STUDENT', 'HOC', 'INSTRUCTOR']),
  department: z.string().min(1, 'Department is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  isHOCPending: z.boolean().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Helper function to generate JWT
const generateToken = async (userId: number, email: string) => {
  const secret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production';
  const payload = {
    userId,
    email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
  };
  return await sign(payload, secret);
};

// Check email availability
authRoutes.get('/check-email', async (c) => {
  try {
    const email = c.req.query('email');

    if (!email) {
      return c.json({ error: 'Email parameter is required' }, 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    return c.json({ available: !existingUser });
  } catch (error) {
    console.error('Check email error:', error);
    return c.json({ error: 'Failed to check email availability' }, 500);
  }
});

// Signup
authRoutes.post('/signup', async (c) => {
  try {
    const body = await c.req.json();

    // Validate input
    const validatedData = signupSchema.parse(body);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });

    if (existingUser) {
      return c.json({ error: 'Email is already registered' }, 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email.toLowerCase(),
        fullName: validatedData.fullName,
        password: hashedPassword,
        role: validatedData.role,
        department: validatedData.department,
        academicYear: validatedData.academicYear,
        isHOC: false, // Will be approved by admin
        isHOCPending: validatedData.role === 'HOC',
      },
    });

    // Generate JWT token
    const token = await generateToken(user.id, user.email);

    // Return user data (exclude password)
    return c.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        academicYear: user.academicYear,
        isHOC: user.isHOC,
      },
    }, 201);
  } catch (error) {
    console.error('Signup error:', error);

    if (error instanceof z.ZodError) {
      return c.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, 400);
    }

    return c.json({ error: 'Signup failed. Please try again.' }, 500);
  }
});

// Login
authRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json();

    // Validate input
    const validatedData = loginSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });

    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);

    if (!isPasswordValid) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Generate JWT token
    const token = await generateToken(user.id, user.email);

    // Return user data (exclude password)
    return c.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        academicYear: user.academicYear,
        isHOC: user.isHOC,
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    if (error instanceof z.ZodError) {
      return c.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, 400);
    }

    return c.json({ error: 'Login failed. Please try again.' }, 500);
  }
});

// Logout (optional - for future token invalidation)
authRoutes.post('/logout', async (c) => {
  // In a stateless JWT system, logout is handled client-side
  // But you can implement token blacklisting here if needed
  return c.json({ success: true, message: 'Logged out successfully' });
});

export default authRoutes;