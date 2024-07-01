import { existsSync, readFileSync, writeFileSync } from "fs";

if (!existsSync('./var/bot_idx.txt')) {
	writeFileSync('./var/bot_idx.txt', '0');
}

const getIdx = () => {
	const idx = Number(readFileSync('./var/bot_idx.txt').toString());
	writeFileSync('./var/bot_idx.txt', (idx + 1).toString());
	return idx;
}

export const getBotUsername = () => {
	return 'bumpme' + getIdx();
}
