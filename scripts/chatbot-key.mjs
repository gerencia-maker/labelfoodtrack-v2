import { createHmac } from "node:crypto";

const chatbotId = process.argv[2]?.trim();
const masterKey = process.env.CHATBOT_API_KEY?.trim();

if (!chatbotId || !masterKey) {
  console.error("Usage: set CHATBOT_API_KEY, then run: npm run chatbot:key -- CHATBOT_ID");
  process.exit(1);
}

const tenantKey = createHmac("sha256", masterKey)
  .update(`chatbot:${chatbotId}`)
  .digest("hex");

console.log(tenantKey);

