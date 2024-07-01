import type { ConversationFlavor } from "@grammyjs/conversations";
import type { HydrateFlavor } from "@grammyjs/hydrate";
import type { SessionFlavor } from "grammy";
import type { Context } from "grammy";

export type BotContext = Context & ConversationFlavor & SessionFlavor<Record<string, string | number>> & HydrateFlavor<Context>;

