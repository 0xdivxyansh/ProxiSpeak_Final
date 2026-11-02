/**
 * Final Proxispeak - Automated Verification Runner
 *
 * Runs formatting, linting, unit tests, integration tests, and build checks.
 */

import { execSync } from 'child_process';

function runStep(title, command) {
  console.log(`\n===============================================================`);
  console.log(`  STEP: ${title}`);
  console.log(`  CMD:  ${command}`);
  console.log(`===============================================================`);

  try {
    execSync(command, { stdio: 'inherit', env: process.env });
    console.log(`[PASS] ${title}`);
    return true;
  } catch (error) {
    console.error(`[FAIL] ${title} - Process exited with code ${error.status}`);
    return false;
  }
}

async function main() {
  console.log('###############################################################');
  console.log('#       Final Proxispeak - Master Automated Verification       #');
  console.log('###############################################################');

  const results = [];

  // 1. Environment Verification
  results.push({ name: 'Environment Check', pass: runStep('Environment Verification', 'node scripts/verify-environment.js') });

  // 2. Database Seeding
  results.push({ name: 'Database Seeding', pass: runStep('Database Seeding', 'npm run seed') });

  // 3. Backend Unit Tests
  results.push({ name: 'Backend Unit Tests', pass: runStep('Backend Unit Tests', 'npm run test:unit -w backend') });

  // 4. Frontend Unit Tests
  results.push({ name: 'Frontend Unit Tests', pass: runStep('Frontend Unit Tests', 'npm run test:unit -w frontend') });

  // 5. Backend Integration Tests (MongoDB + Sockets + Redis)
  results.push({ name: 'Backend Integration Tests', pass: runStep('Backend Integration Tests', 'npm run test:integration -w backend') });

  // 6. Proximity Latency Benchmark (< 20ms faculty target)
  results.push({ name: 'Proximity Performance Benchmark', pass: runStep('Proximity Benchmark', 'npm run test:performance') });

  // 7. Frontend Production Build Check
  results.push({ name: 'Frontend Production Build', pass: runStep('Frontend Build', 'npm run build -w frontend') });

  console.log('\n\n###############################################################');
  console.log('#                    VERIFICATION SUMMARY                     #');
  console.log('###############################################################');

  let allPassed = true;
  for (const r of results) {
    const symbol = r.pass ? 'PASS' : 'FAIL';
    console.log(`  [${symbol}] ${r.name}`);
    if (!r.pass) allPassed = false;
  }

  console.log('###############################################################');
  if (allPassed) {
    console.log('# ALL SYSTEM VERIFICATION STEPS COMPLETED SUCCESSFULLY!       #');
    console.log('###############################################################\n');
    process.exit(0);
  } else {
    console.error('# ONE OR MORE STEPS FAILED. PLEASE REVIEW LOGS ABOVE.         #');
    console.log('###############################################################\n');
    process.exit(1);
  }
}

main();

