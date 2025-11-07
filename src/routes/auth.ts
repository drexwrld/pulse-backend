import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '../db.js';

const authRoutes = new Hono();

// Check email availability
authRoutes.get('/check-email', async (c) => {
  try {
    const { email } = c.req.query();
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    return c.json({ 
      available: !existingUser 
    });
  } catch (error) {
    console.error('Email check error:', error);
    return c.json({ error: 'Failed to check email' }, 500);
  }
});

// Signup endpoint
authRoutes.post('/signup', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate required fields
    const { email, fullName, password, role, department, academicYear } = body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return c.json({ error: 'Email already registered' }, 409);
    }

    // TODO: Hash password properly
    // const hashedPassword = await bcrypt.hash(password, 12);
    const hashedPassword = password; // Temporary - replace with hashing

    // Determine user data based on role
    const userData: any = {
      email,
      fullName,
      password: hashedPassword,
      department,
      academicYear,
      // ALWAYS set role to STUDENT initially, even for HOC requests
      role: 'STUDENT', // Force STUDENT role regardless of selection
      isHOC: false, // Not HOC until approved
      isHOCPending: false, // Default to false
    };

    // Handle HOC requests
    if (role === 'HOC') {
      userData.isHOCPending = true; // Mark as pending approval
      userData.phone = body.phone; // HOC requires phone
      userData.studentId = body.studentId;
    } else if (role === 'INSTRUCTOR') {
      // Handle instructor-specific fields - instructors get role immediately
      userData.role = 'INSTRUCTOR';
      userData.qualification = body.qualification;
      userData.experience = body.experience;
      userData.officeNumber = body.officeNumber;
      userData.specializations = body.specializations;
      userData.bio = body.bio;
    }
    // For STUDENT role, just use the default STUDENT role

    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        academicYear: true,
        isHOC: true,
        isHOCPending: true,
        phone: true,
        studentId: true,
        createdAt: true,
      },
    });

    return c.json({
      success: true,
      message: role === 'HOC' 
        ? 'Account created! HOC role pending admin approval.' 
        : 'Account created successfully!',
      user,
      token: 'mock-jwt-token' // TODO: Generate real JWT
    }, 201);
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: 'Signup failed' }, 500);
  }
});

// Login endpoint
authRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    
    // TODO: Validate credentials properly
    // For now, just return mock data
    const mockUser = {
      id: 1,
      email: body.email,
      fullName: 'Test User',
      role: 'STUDENT' as const,
      department: 'Computer Science',
      academicYear: 'Year 3',
      isHOC: false,
      isHOCPending: false,
    };

    return c.json({
      success: true,
      message: 'Login successful',
      user: mockUser,
      token: 'mock-jwt-token'
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

export default authRoutes;