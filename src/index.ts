import { Bot, session } from "grammy";
import { getBotAccount, getHasAccount } from "./utils/getBotAccount";
import { getBalance, getPublicKey } from "@cryptoscan/solana-wallet-sdk";
import { conversations, createConversation } from "@grammyjs/conversations";
import { hydrate } from "@grammyjs/hydrate";
import { BotContext } from "./types/BotContext";
import { createTransaction } from "@cryptoscan/swap-sdk";
import sendTransaction from '@cryptoscan/solana-send-transaction';
import { keyboard } from "./keyboard";
import { createCustomConnection, getPumpFunCoin } from "@cryptoscan/transactions-sdk";
import { BotConversation } from "./types/BotConversation";

const bot = new Bot<BotContext>(process.env.BOT_TOKEN!);

bot.use(session());
bot.use(hydrate());
bot.use(conversations());

bot.use(async (ctx, next) => {
  if (!ctx.session) {
    ctx.session = {}
  }
  await next()
})

bot.command('start', async (ctx) => {
  const user = ctx.from;

  if (!user) {
    return;
  }

  const userId = String(user.id);
  const wallet = await getBotAccount(userId);
  let balance = !getHasAccount(userId) ? 0 : await getBalance(getPublicKey(wallet));

  let text = '';
  text += `Deposit SOL to the bot wallet and lets start.\n`
  text += `After that, you should send the pumpfun link of coin.\n`
  text += '\n'
  text += `Address: \`${wallet.publicKey.toString()}\``;
  text += `Balance: ${balance} SOL`
  ctx.reply(text, {
    disable_web_page_preview: true,
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: keyboard,
    }
  } as any);
})

bot.command('setAmount', (ctx) => {
  const amount = Number(ctx.msg.text.replace('setAmount ', ''));
  ctx.session.amount = amount;
})

bot.hears('🔫 Run Bot', async (ctx) => {
  if (!ctx.session.coinAddress) {
    ctx.reply('You need to send pumpfun link, to launch the bot');
    return;
  }

  const user = ctx.from;

  if (!user) {
    return;
  }

  const userId = String(user.id);
  const wallet = await getBotAccount(userId);
  const balance = await getBalance(getPublicKey(wallet));

  if (balance <= 0.001) {
    let text = '';
    text += 'You need to deposit more to launch the bot\n\n'
    text += `Deposit SOL to the bot wallet and lets start.\n`
    text += `After that, you should send the pumpfun link of coin.\n`
    text += '\n'
    text += `Address: \`${wallet.publicKey.toString()}\``;
    text += `Balance: ${balance} SOL`
    ctx.reply(text, {
      disable_web_page_preview: true,
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: keyboard,
      }
    } as any);
    return;
  }

  ctx.reply('Bot started', {
    disable_web_page_preview: true,
    parse_mode: 'Markdown'
  } as any);

  ctx.session.started = 1;

  (async () => {
    const walletAddress = wallet.publicKey.toString();
    const coinAddress = ctx.session.coinAddress as string;

    const interval = setInterval(async () => {
      const sol = ctx.session.amount || 0.01;
      if (!ctx.session.started) {
        clearInterval(interval);
        return;
      }

      const transaction = await createTransaction({
        payerAddress: walletAddress,
        instructions: [
          {
            type: 'budgetPrice',
            sol: 0.0001,
          },
          {
            type: 'buy',
            service: 'pumpfun',
            coinAddress,
            walletAddress: walletAddress,
            sol,
            slippage: 5,
          },
          {
            type: 'sell',
            service: 'pumpfun',
            coinAddress,
            walletAddress: walletAddress,
            sol,
            slippage: 5,
          }
        ]
      });

      if (transaction instanceof Error) {
        ctx.reply('err: ' + transaction.message);
        clearInterval(interval);
        return;
      }

      transaction.sign([wallet]);

      console.log('send transaction')
      const tx = await sendTransaction(transaction, {
        connection: createCustomConnection(),
        commitment: 'confirmed',
        sendOptions: {
          skipPreflight: true
        }
      })
      console.log('tx', tx)

      if (tx instanceof Error) {
        ctx.session.started = 0;
        ctx.reply('err: ' + tx.message);
        clearInterval(interval);
      }
    }, 3000)
  })()
})

bot.hears('🚫 Stop Bot', (ctx) => {
  ctx.session.started = 0;
  ctx.reply('Bot stopped');
})

bot.hears(/(pump\.fun)/g, async (ctx) => {
  const url = ctx.message?.text;

  if (!url) {
    ctx.reply('no url error');
    return;
  }

  const baseUrl = 'https://pump.fun/'
  const address = url.replace(baseUrl, '');
  ctx.session.coinAddress = address;
  const coin = await getPumpFunCoin(address).catch((e) => e);

  if (coin instanceof Error) {
    ctx.reply('no coin error: ' + coin.message);
    return;
  }

  let msg = '';
  msg += `Coin successful saved\n\n`
  if (coin) {
    msg += `Name: ${coin.name} (<a href="https://pump.fun/${coin.mint}">$${coin.symbol}</a>)\n`;
    msg += `Dev: <a href="https://solscan.io/account/${coin.creator}">${coin.creator.slice(0, 5)}...${coin.creator.slice(-5)}</a>\n`
    msg += `Market cap: $${coin.usd_market_cap.toFixed()}\n`
    msg += '\n'
    msg += `Description: ${coin.description}\n`
    msg += `Website: ${coin.website ? coin.website : 'no'}\n`
    msg += `Telegram: ${coin.telegram ? coin.telegram : 'no'}\n`
    msg += `Twitter: ${coin.twitter ? coin.twitter : 'no'}\n`
  }

  const options = {
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  } as any;

  await ctx.reply(msg, options).catch((e: any) => {
    console.log(e)
  })
})

bot.hears('🔥 Close account', async (ctx) => {
  if (!ctx.session.coinAddress) {
    ctx.reply('You need to send pumpfun link, to launch the bot');
    return;
  }

  const user = ctx.from;

  if (!user) {
    return;
  }

  const userId = String(user.id);
  const coinAddress = ctx.session.coinAddress as string;
  const wallet = await getBotAccount(userId);
  const walletAddress = getPublicKey(wallet);
  ctx.reply(`${await getBalance(getPublicKey(wallet), coinAddress)}`);

  const transaction = await createTransaction({
    payerAddress: walletAddress,
    instructions: [
      {
        type: 'budgetPrice',
        sol: 0.0001,
      },
      {
        type: 'closeAccount',
        coinAddress,
        walletAddress: walletAddress,
      }
    ]
  });

  if (transaction instanceof Error) {
    ctx.reply('err: ' + transaction.message);
    return;
  }

  transaction.sign([wallet]);

  console.log('send transaction')
  const tx = await sendTransaction(transaction, {
    connection: createCustomConnection(),
    commitment: 'confirmed',
    sendOptions: {
      skipPreflight: true
    }
  })
  console.log('tx', tx)

  if (tx instanceof Error) {
    ctx.session.started = 0;
    ctx.reply('err: ' + tx.message);
  }

  ctx.reply('Sold all')
})

async function withdraw(conversation: BotConversation, ctx: BotContext) {
  ctx.reply('Enter your wallet address');
  const user = ctx.from;

  if (!user) {
    return;
  }

  const userId = String(user.id);
  const c = await conversation.waitFor(":text");
  const destAddress = c.msg.text;
  const wallet = await getBotAccount(userId);
  const walletAddress = getPublicKey(wallet);
  const balance = await getBalance(walletAddress);

  const transaction = await createTransaction({
    payerAddress: walletAddress,
    instructions: [
      {
        type: 'budgetPrice',
        sol: 0.0001,
      },
      {
        type: 'transfer',
        fromAddress: walletAddress,
        toAddress: destAddress,
        sol: (balance * 0.995) - 0.001
      }
    ]
  });

  if (transaction instanceof Error) {
    ctx.reply('err: ' + transaction.message);
    return;
  }

  transaction.sign([wallet]);

  const tx = await sendTransaction(transaction, {
    connection: createCustomConnection(),
    commitment: 'confirmed',
    sendOptions: {
      skipPreflight: true
    }
  })
  console.log('tx', tx)

  if (tx instanceof Error) {
    ctx.session.started = 0;
    ctx.reply('err: ' + tx.message);
  }

  ctx.reply('Transferred')
}

bot.use(createConversation(withdraw))

bot.hears('💵 Withdraw All', (ctx) => {
  ctx.conversation.enter('withdraw');
})


bot.start();
