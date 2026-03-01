#!/usr/bin/env npx tsx
/**
 * Test refund calculator for a sample Indian F1 student.
 * Run: npm run test:refund
 */

import { calculateEstimatedRefund } from '../lib/tax-rules';

const sampleProfile = {
  visaType: 'F1' as const,
  countryOfOrigin: 'India',
  yearsInUS: 2,
  stateOfResidence: 'California',
  incomeTypes: ['W2', 'TA'] as ('W2' | 'TA')[],
  ficaWithheld: true,
  tuitionPaid: 25_000,
  scholarshipAmount: 10_000,
};

const result = calculateEstimatedRefund(sampleProfile, {
  annualWages: 35_000,
  federalTaxWithheld: 1_200,
});

console.log('Sample Indian F1 student:');
console.log(JSON.stringify(sampleProfile, null, 2));
console.log('\nRefund breakdown:');
console.log(JSON.stringify(result, null, 2));
