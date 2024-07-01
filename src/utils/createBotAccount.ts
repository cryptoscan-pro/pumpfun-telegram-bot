import { createWallet } from "@cryptoscan/solana-wallet-sdk";
import { editUser } from "./editUser";
import { getBotUsername } from "./getBotUsername";
import { loginUser } from "./loginUser";
import { Keypair } from "@solana/web3.js";

export const createBotAccount = async (): Promise<Keypair> => {
  const wallet = createWallet();
  const token = await loginUser(wallet);
  const username = getBotUsername();
  const description = `Fully automated, safety and free BUMP bot - https://t.me/bumpme_bot`;
  const profileImage = 'https://cf-ipfs.com/ipfs/QmYBfd9vm9nMea5vctoxjJqguTa5zEYBwp9bZisuC1WWBY';
  await editUser(token, username, description, profileImage);
  return wallet;
}
