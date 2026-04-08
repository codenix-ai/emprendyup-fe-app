import assert from 'node:assert/strict';
import {
  acquireConversionLock,
  getReferralCodeFromUrl,
  hasCompletedConversion,
  markConversionCompleted,
  persistReferralAttribution,
  readLastConversionSummary,
  readReferralAttribution,
  releaseConversionLock,
  sanitizeReferralCode,
} from '../../src/lib/referrals/attribution';

class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key) || null : null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

const localStorageMock = new MemoryStorage();
const windowMock = {
  location: {
    protocol: 'https:',
  },
};
const documentMock = {
  cookie: '',
};

Object.assign(globalThis, {
  window: windowMock,
  localStorage: localStorageMock,
  document: documentMock,
});

const run = () => {
  assert.equal(sanitizeReferralCode('  abc123  '), 'ABC123');
  assert.equal(getReferralCodeFromUrl('  xyz999 '), 'XYZ999');
  assert.equal(getReferralCodeFromUrl(null), null);

  const attribution = persistReferralAttribution('abc123');
  assert.equal(attribution?.referralCode, 'ABC123');
  assert.equal(Boolean(readReferralAttribution()?.expiresAt), true);

  const transactionId = 'tx-001';
  assert.equal(acquireConversionLock(transactionId), true);
  assert.equal(acquireConversionLock(transactionId), false);
  releaseConversionLock(transactionId);
  assert.equal(acquireConversionLock(transactionId), true);

  markConversionCompleted(transactionId);
  assert.equal(hasCompletedConversion(transactionId), true);

  const summary = readLastConversionSummary();
  assert.equal(summary?.transactionId, transactionId);
  assert.equal(Boolean(summary?.convertedAt), true);

  console.log('referralAttribution tests passed');
};

run();
