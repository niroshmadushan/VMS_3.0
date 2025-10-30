#!/usr/bin/env node

/**
 * Cleanup Script - Remove Supabase Dependencies
 * 
 * This script removes all Supabase-related files and dependencies
 * from your project after migrating to custom backend authentication.
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Starting Supabase cleanup...\n');

// Files to remove
const filesToRemove = [
  'lib/supabase.ts',
  'lib/supabase-browser.ts',
  'lib/supabase-server.ts',
  'lib/supabase-client.ts',
  'lib/supabase-admin.ts',
  'lib/supabase-ssr.ts',
  'lib/auth-helpers.ts',
  'supabase-auth-setup.sql',
  'supabase-auth-setup-fixed.sql',
  'supabase-email-config.sql',
  'supabase-email-config-fixed.sql',
  'components/supabase-connection-test.tsx',
  'app/test-supabase/page.tsx',
  'app/troubleshoot-auth/page.tsx',
  'app/troubleshoot-email/page.tsx',
  'components/auth-troubleshoot.tsx',
  'components/email-troubleshoot.tsx',
  'SUPABASE_AUTH_SETUP_GUIDE.md',
  'AUTHENTICATION_TROUBLESHOOTING_GUIDE.md',
  'EMAIL_CONFIGURATION_GUIDE.md'
];

// Remove files
let removedCount = 0;
filesToRemove.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`✅ Removed: ${file}`);
      removedCount++;
    } catch (error) {
      console.log(`❌ Failed to remove: ${file} - ${error.message}`);
    }
  } else {
    console.log(`⚠️  Not found: ${file}`);
  }
});

console.log(`\n📊 Cleanup Summary:`);
console.log(`   Files removed: ${removedCount}`);
console.log(`   Files not found: ${filesToRemove.length - removedCount}`);

// Update package.json to remove Supabase dependencies
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Supabase dependencies to remove
    const supabaseDeps = [
      '@supabase/ssr',
      '@supabase/supabase-js'
    ];
    
    let removedDeps = 0;
    supabaseDeps.forEach(dep => {
      if (packageJson.dependencies && packageJson.dependencies[dep]) {
        delete packageJson.dependencies[dep];
        removedDeps++;
        console.log(`✅ Removed dependency: ${dep}`);
      }
    });
    
    if (removedDeps > 0) {
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log(`\n📦 Updated package.json - removed ${removedDeps} Supabase dependencies`);
      console.log(`   Run 'npm install' to update node_modules`);
    } else {
      console.log(`\n📦 No Supabase dependencies found in package.json`);
    }
  } catch (error) {
    console.log(`❌ Failed to update package.json: ${error.message}`);
  }
}

console.log(`\n🎉 Cleanup completed!`);
console.log(`\n📋 Next steps:`);
console.log(`   1. Create .env.local with your backend credentials`);
console.log(`   2. Run 'npm install' to update dependencies`);
console.log(`   3. Start your backend server`);
console.log(`   4. Test the authentication flow`);
console.log(`\n📚 See CUSTOM_BACKEND_SETUP_GUIDE.md for detailed instructions`);
