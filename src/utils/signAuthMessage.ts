import type { Keypair } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

export const signAuthMessage = (wallet: Keypair, timestamp: number) => {
  let msg = `Sign in to pump.fun: ${timestamp}`;
  const signature = nacl.sign.detached(Buffer.from(msg), wallet.secretKey);
  return bs58.encode(signature);
}
