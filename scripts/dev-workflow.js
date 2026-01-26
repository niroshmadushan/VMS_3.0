#!/usr/bin/env node
/**
 * Development Workflow Script
 * Cross-platform Node.js script for complete dev-to-production workflow
 */

const { execSync } = require('child_process');
const readline = require('readline');
const path = require('path');

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
    throw error;
  }
}

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('========================================');
  console.log('Development to Production Workflow');
  console.log('========================================');
  console.log('');
  console.log('This script will:');
  console.log('1. Merge development branch to main');
  console.log('2. Build production version');
  console.log('');
  
  const confirm = await question('Continue? (y/n): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('Cancelled.');
    rl.close();
    return;
  }

  console.log('');
  console.log('Step 1: Merging development to main...');
  try {
    exec('node scripts/merge-to-production.js');
  } catch (error) {
    console.error('ERROR: Merge failed. Please fix issues and try again.');
    rl.close();
    process.exit(1);
  }

  console.log('');
  console.log('Step 2: Building production version...');
  try {
    exec('node scripts/build-production.js');
  } catch (error) {
    console.error('ERROR: Build failed. Please fix issues and try again.');
    rl.close();
    process.exit(1);
  }

  console.log('');
  console.log('========================================');
  console.log('Workflow completed successfully!');
  console.log('========================================');
  console.log('');
  console.log('Production is ready for deployment!');
  console.log('');

  rl.close();
}

main().catch(error => {
  console.error('Fatal error:', error);
  rl.close();
  process.exit(1);
});











