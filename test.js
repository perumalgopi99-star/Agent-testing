// Minimal test file using only Node.js built-ins (no dependencies required).
// Run with: node test.js

const assert = require('node:assert');

// --- Code under test -------------------------------------------------------

/**
 * Adds two numbers.
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function sum(a, b) {
  return a + b;
}

// --- Tiny test runner ------------------------------------------------------

let passed = 0;
let failed = 0;

/**
 * Runs a single named test. `fn` should throw (e.g. via assert) on failure.
 * @param {string} name
 * @param {() => void} fn
 */
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`PASS: ${name}`);
  } catch (err) {
    failed++;
    console.log(`FAIL: ${name}`);
    console.log(`      ${err.message}`);
  }
}

// --- Test cases ------------------------------------------------------------

test('sum(2, 3) returns 5', () => {
  assert.strictEqual(sum(2, 3), 5);
});

test('sum(-1, 1) returns 0', () => {
  assert.strictEqual(sum(-1, 1), 0);
});

test('sum(0.1, 0.2) is approximately 0.3', () => {
  assert.ok(Math.abs(sum(0.1, 0.2) - 0.3) < Number.EPSILON);
});

// --- Summary ---------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed, ${passed + failed} total`);

// Non-zero exit code lets CI or scripts detect failures.
process.exitCode = failed > 0 ? 1 : 0;
