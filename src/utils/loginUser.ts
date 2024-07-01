import type { Keypair } from "@solana/web3.js";
import { existsSync, writeFileSync, readFileSync } from "fs";
import { signAuthMessage } from "./signAuthMessage";

if (!existsSync('./var/keys.json')) {
  writeFileSync('./var/keys.json', JSON.stringify({}));
}

const users = JSON.parse(readFileSync('./var/keys.json').toString() || '');

const setUser = (key: string, value: string) => {
  users[key] = value;
  writeFileSync('./var/keys.json', JSON.stringify(users));
}

export const loginUser = async (wallet: Keypair) => {
  if (wallet.publicKey.toString() in users) {
    return users[wallet.publicKey.toString()];
  }
  const timestamp = Date.now();
  const signature = signAuthMessage(wallet, timestamp);
  const walletAddress = wallet.publicKey.toString();
  console.log(walletAddress, signature)
  const res = await fetch("https://frontend-api.pump.fun/auth/login", {
    "headers": {
      "accept": "*/*",
      "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
      "content-type": "application/json",
      "sec-ch-ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Google Chrome\";v=\"120\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"macOS\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "sec-gpc": "1",
      "Referer": "https://pump.fun/",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    body: JSON.stringify({
      "address": walletAddress,
      "signature": signature,
      "timestamp": timestamp,
    }),
    "method": "POST"
  });
  
  const data = await res.json();
  setUser(walletAddress, signature);
  return data.access_token;
}
