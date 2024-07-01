import { getSecretKey, getWallet } from "@cryptoscan/solana-wallet-sdk";
import { Keypair } from "@solana/web3.js";
import { existsSync, writeFileSync, readFileSync } from "fs";
import { createBotAccount } from "./createBotAccount";

if (!existsSync('./var/users.json')) {
  writeFileSync('./var/users.json', JSON.stringify({}));
}

const users: Record<string, string> = JSON.parse(readFileSync('./var/users.json').toString() || '');

const setAccount = (userId: string, value: string) => {
  users[userId] = value;
  writeFileSync('./var/users.json', JSON.stringify(users));
}

export const getHasAccount = (userId: string) => {
  return userId in users;
}

const getAccount = (userId: string) => {
  return users[userId];
}

export const getBotAccount = async (userId: string): Promise<Keypair> => {
  const privateKey = getAccount(userId);
	if (privateKey) {
    return getWallet(privateKey);
  }

  const account = await createBotAccount();

  setAccount(userId, getSecretKey(account));

  return account;
}
