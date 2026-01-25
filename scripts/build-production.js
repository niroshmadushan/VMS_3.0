#!/usr/bin/env node
/**
 * Script to build production-ready code
 * Cross-platform Node.js script for building production version
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
  console.log('Building Production Version');
  console.log('========================================');
  console.log('');

  // Check if we're on main branch
  const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  if (currentBranch !== 'main') {
    console.warn('WARNING: You are not on the main branch');
    console.warn(`Current branch: ${currentBranch}`);
    console.log('');
    const confirm = await question('Continue anyway? (y/n): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log('Build cancelled.');
      process.exit(1);
    }
  }

  console.log('[1/4] Fetching latest changes...');
  exec('git fetch origin');

  console.log('[2/4] Pulling latest code...');
  exec('git pull origin main');

  console.log('[3/4] Installing dependencies...');
  exec('npm install');

  console.log('[4/4] Building production version...');
  exec('npm run build');

  console.log('');
  console.log('========================================');
  console.log('Production build completed successfully!');
  console.log('========================================');
  console.log('');
  console.log('Build output is in the .next folder');
  console.log('You can now deploy this build to your hosting platform');
  console.log('');
  console.log('To start the production server locally, run:');
  console.log('  npm run start');
  console.log('');

  rl.close();
}

main().catch(error => {
  console.error('Fatal error:', error);
  rl.close();
  process.exit(1);
});











