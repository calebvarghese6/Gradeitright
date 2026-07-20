// Standalone AI Gateway smoke test — run with: pnpm exec tsx index.ts
// Streams a response through Vercel AI Gateway and prints token usage.

import { streamText } from "ai";
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const result = streamText({
    model: "openai/gpt-5.4-nano",
    prompt:
      "In two sentences, explain how a student can figure out what score they need on remaining assignments to hit a target grade.",
  });

  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }
  process.stdout.write("\n\n");

  console.log("Token usage:", await result.usage);
  console.log("Finish reason:", await result.finishReason);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
