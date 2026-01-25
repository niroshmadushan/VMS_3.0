#!/usr/bin/env node
/**
 * Script to merge development branch to main (production)
 * Cross-platform Node.js script for merging development to main
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function exec(command, options = {}) {
  try {
    return execSync(command, { 
      stdio: 'inherit', 
      encoding: 'utf8',
      ...options 
    });
  } catch (error) {
    console.error(`Error executing: ${command}`);
    process.exit(1);
  }
}

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('========================================');
  console.log('Merging Development to Production');
  console.log('========================================');
  console.log('');

  // Check if we're on development branch
  const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  if (currentBranch !== 'development') {
    console.error(`ERROR: You must be on the development branch to run this script`);
    console.error(`Current branch: ${currentBranch}`);
    process.exit(1);
  }

  console.log('[1/5] Fetching latest changes from remote...');
  exec('git fetch origin');

  console.log('[2/5] Switching to main branch...');
  exec('git checkout main');

  console.log('[3/5] Pulling latest main branch...');
  exec('git pull origin main');

  console.log('[4/5] Merging development into main...');
  try {
    exec('git merge development --no-ff -m "Merge development into main for production release"');
  } catch (error) {
    console.error('ERROR: Merge conflict detected! Please resolve conflicts manually.');
    console.error('After resolving, run: git commit');
    process.exit(1);
  }

  console.log('[5/5] Pushing main branch to remote...');
  exec('git push origin main');

  console.log('');
  console.log('========================================');
  console.log('Merge completed successfully!');
  console.log('========================================');
  console.log('');
  console.log('Next steps:');
  console.log('1. Run: npm run build:production');
  console.log('2. Deploy the build to your hosting platform');
  console.log('');
  console.log('Switching back to development branch...');
  exec('git checkout development');

  console.log('Done!');
  rl.close();
}

main().catch(error => {
  console.error('Fatal error:', error);
  rl.close();
  process.exit(1);
});











