import { useEffect, useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { getCofheClient } from '../lib/cofhe'; 

export type CofheConnState = "idle" | "connecting" | "connected" | "error";

export function useCofheConnection() {
  const { isConnected, address, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [state, setState] = useState<CofheConnState>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let fallbackClient: any = null;

    if (!isConnected || !publicClient || !walletClient) {
      const cleanup = async () => {
        try {
          const client = await getCofheClient();
          if (client.connected) client.disconnect();
        } catch { /* noop */ }
      };
      cleanup();
      
      if (isMounted) {
        setState("idle");
        setError(null);
      }
      return;
    }

    const connectFhe = async () => {
      try {
        if (isMounted) {
          setState("connecting");
          setError(null);
        }

        const client = await getCofheClient();
        fallbackClient = client;

        console.log('[CoFHE] Handshaking standard connected providers with official SDK instance...');
        
        // Pass standard providers directly into the official client instance
        await client.connect(publicClient as any, walletClient as any);

        if (isMounted) {
          console.log('[CoFHE] Handshake complete! Connection successfully established.');
          setState("connected");
          setError(null);
        }
      } catch (err) {
        console.error('[CoFHE] Handshake execution collapsed:', err);
        if (isMounted) {
          setState("error");
          setError((err as Error).message ?? "FHE baseline initialization failed");
        }
      }
    };

    connectFhe();

    return () => {
      isMounted = false;
      if (fallbackClient?.connected) {
        try { fallbackClient.disconnect(); } catch { /* noop */ }
      }
    };
  }, [isConnected, address, chainId, publicClient, walletClient]);

  return {
    state,
    error,
    isFheReady: state === "connected",
    fheError: error
  };
}