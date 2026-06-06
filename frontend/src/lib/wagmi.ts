import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { baseSepolia } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "StealthLimit",
  projectId: "stealthlimit-fhenix-base-sepolia",
  chains: [baseSepolia],
  ssr: true,
});

export { baseSepolia };
