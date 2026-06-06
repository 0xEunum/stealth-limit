import { createCofheConfig, createCofheClient } from '@cofhe/sdk/web';
import { chains } from '@cofhe/sdk/chains';

// --- Helper Exports Required by TradeTab ---
export type EncryptStepLabel = 'idle' | 'initTfhe' | 'fetchKeys' | 'pack' | 'prove' | 'verify' | 'submitting' | 'done';

export const STEP_LABELS: Record<EncryptStepLabel, string> = {
  idle: '🔒 Encrypt & Submit',
  initTfhe: 'Initializing FHE engine...',
  fetchKeys: 'Fetching encryption keys...',
  pack: 'Packing values...',
  prove: 'Generating ZK proof...',
  verify: 'Verifying with Fhenix...',
  submitting: 'Submitting transaction...',
  done: 'Order submitted!'
};

export function scaleTo1e8(val: string | number): bigint {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return 0n;
  return BigInt(Math.round(num * 1e8));
}

// --- Shared CoFHE Instance Configuration ---
let cofheClientInstance: any = null;

export async function getCofheClient() {
  if (cofheClientInstance) return cofheClientInstance;

  console.log('[CoFHE] Registering supported coprocessor profiles...');

  // Pull out the explicit Base Sepolia preset from the SDK definitions
  // If the specific key varies across SDK releases, we pass both L1 and L2 variations to ensure immediate resolution
  const baseSepoliaConfig = (chains as any).baseSepolia || (chains as any).base_sepolia || chains.sepolia;

  const config = createCofheConfig({
    supportedChains: [
      {
        ...baseSepoliaConfig,
        id: 84532, // Enforce absolute identification layout for your active wallet
      }
    ],
  });

  cofheClientInstance = createCofheClient(config);
  return cofheClientInstance;
}