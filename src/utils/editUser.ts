import { getBotUsername } from "./getBotUsername";

export const editUser = async (
  accessToken: string, 
  username: string, 
  description: string,
  profileImage: string,
) => {
  const res = await fetch("https://frontend-api.pump.fun/users", {
    "headers": {
      "accept": "*/*",
      "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
      "authorization": `Bearer ${accessToken}`,
      "content-type": "application/json",
      "sec-ch-ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Google Chrome\";v=\"120\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"macOS\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "sec-gpc": "1",
      "x-highlight-request": "/rackhZNVyW",
      "Referer": "https://pump.fun/",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    body: JSON.stringify({
      "username": username,
      "bio": description,
      "profileImage": profileImage,
    }),
    "method": "POST"
  });
  console.log(await res.json())

  return username;
}
