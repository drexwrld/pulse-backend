import { execSync } from 'child_process';

console.log('🚀 Starting build process...');

try {
  // Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Compile TypeScript (skip lib check to avoid bcryptjs issues)
  console.log('🔨 Compiling TypeScript...');
  execSync('npx tsc --skipLibCheck', { stdio: 'inherit' });

  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}