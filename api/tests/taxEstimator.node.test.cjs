// Dependency-free smoke checks that can run when npm packages are unavailable.
const test = require('node:test');
const assert = require('node:assert/strict');
const { estimateTax, getTaxYearPeriod, getSouthAfricanTaxYear } = require('../services/taxEstimator');

test('SARS 2027 standard under-65 rebate threshold', () => {
  for (const income of [0, 50000, 99000]) assert.equal(estimateTax(income).estimatedTax, 0);
  assert.equal(estimateTax(100000).estimatedTax, 180);
});
test('SARS 2027 progressive boundaries', () => {
  const cases = [[245100,26298],[383100,62178],[530200,107779],[695800,167395],[887000,241963],[1878600,648519],[1878601,648519.45]];
  for (const [income,tax] of cases) assert.equal(estimateTax(income).estimatedTax, tax, `income ${income}`);
});
test('ZAR cent rounding and net amount', () => {
  const result = estimateTax(400000.21);
  assert.equal(result.totalIncome, 400000.21);
  assert.equal(result.estimatedNet, Number((result.totalIncome-result.estimatedTax).toFixed(2)));
});
test('rejects negative and invalid amounts and stale tax year', () => {
  for (const input of [-1,Infinity,NaN,'200']) assert.throws(() => estimateTax(input), RangeError);
  assert.throws(() => estimateTax(500000,2028), RangeError);
});
test('time zone determines year from Johannesburg midnight', () => {
  assert.equal(getSouthAfricanTaxYear(new Date('2026-02-28T21:59:59Z')),2026);
  assert.equal(getSouthAfricanTaxYear(new Date('2026-02-28T22:00:00Z')),2027);
  assert.equal(getTaxYearPeriod().start.toISOString(),'2026-02-28T22:00:00.000Z');
  assert.equal(getTaxYearPeriod().endExclusive.toISOString(),'2027-02-28T22:00:00.000Z');
});
