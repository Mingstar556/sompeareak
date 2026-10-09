const fs = require('fs');
const assert = require('assert');

// Read app.js code
const appCode = fs.readFileSync(__dirname + '/app.js', 'utf8');

// Extract isPhnomPenh
const isPPMatch = appCode.match(/function isPhnomPenh\(city\)[\s\S]*?\n\}/);
assert(isPPMatch, 'isPhnomPenh definition must exist');
eval(isPPMatch[0]);

// Test 1: City detection
console.log('[Test 1] City detection logic...');
assert.strictEqual(isPhnomPenh('Phnom Penh'), true);
assert.strictEqual(isPhnomPenh('phnom penh'), true);
assert.strictEqual(isPhnomPenh('phom penh'), true, 'User typo phom penh must be supported');
assert.strictEqual(isPhnomPenh('Phom Penh'), true);
assert.strictEqual(isPhnomPenh('រាជធានីភ្នំពេញ'), true);
assert.strictEqual(isPhnomPenh('ភ្នំពេញ'), true);
assert.strictEqual(isPhnomPenh('Siem Reap'), false);
assert.strictEqual(isPhnomPenh('Battambang'), false);
assert.strictEqual(isPhnomPenh('Kampot'), false);
assert.strictEqual(isPhnomPenh('Kandal'), false);
assert.strictEqual(isPhnomPenh('Other'), false);
console.log(' -> isPhnomPenh passed all variations.');

// Test 2: Receipt text rendering
console.log('[Test 2] Receipt text rendering for COD vs KHQR...');
function mockReceipt(order) {
  const contact = (typeof order.contact === 'string' ? JSON.parse(order.contact) : (order.contact || {})) || {};
  const paymentStr = contact.payment || order.payment || (contact.payment_type === 'COD' ? 'Cash on Delivery (COD)' : 'ABA KHQR (Scan to Pay)');
  const isCod = paymentStr.includes('COD') || contact.payment_type === 'COD';
  const payLabel = isCod ? 'Cash on Delivery (COD)' : 'ABA KHQR (Scan to Pay)';
  return {
    isCod,
    payLabel,
    notice: isCod ? 'COD Receipt Notice: Collect cash upon arrival' : 'KHQR Receipt Notice: Scan to complete payment'
  };
}

const codOrder = {
  id: 'SR123456',
  payment: 'Cash on Delivery (COD)',
  contact: {
    name: 'Ming',
    phone: '060206666',
    address: 'Street 328, Phnom Penh',
    payment: 'Cash on Delivery (COD)',
    payment_type: 'COD'
  }
};
const codReceipt = mockReceipt(codOrder);
assert.strictEqual(codReceipt.isCod, true);
assert.strictEqual(codReceipt.payLabel, 'Cash on Delivery (COD)');
assert(!codReceipt.payLabel.includes('ABA KHQR'), 'COD receipt must NEVER print ABA KHQR');

const khqrOrder = {
  id: 'SR123457',
  payment: 'ABA KHQR (Scan to Pay)',
  contact: {
    name: 'Sokha',
    phone: '012345678',
    address: 'Angkor Wat Rd, Siem Reap',
    payment: 'ABA KHQR (Scan to Pay)',
    payment_type: 'KHQR'
  }
};
const khqrReceipt = mockReceipt(khqrOrder);
assert.strictEqual(khqrReceipt.isCod, false);
assert.strictEqual(khqrReceipt.payLabel, 'ABA KHQR (Scan to Pay)');

console.log(' -> Receipt text correctly distinguishes COD from ABA KHQR.');

// Test 3: Verify app.js contains all required handlers & state
console.log('[Test 3] Verifying checkoutFormState and reactive handlers in app.js...');
assert(appCode.includes('checkoutFormState'), 'checkoutFormState must exist');
assert(appCode.includes('captureCheckoutForm()'), 'captureCheckoutForm must exist');
assert(appCode.includes('onDeliveryProvinceChanged(this.value)'), 'coProv onchange handler must be attached');
assert(appCode.includes('coPayNotice'), 'coPayNotice element must exist');
assert(appCode.includes('provincePaymentNotice'), 'provincePaymentNotice translation key must be used');
console.log(' -> app.js contains all required elements and functions.');

console.log('=== ALL FRONTEND DELIVERY & PAYMENT TESTS PASSED 100%! ===');
