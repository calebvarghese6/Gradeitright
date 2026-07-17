import { streamText } from "ai";
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const result = streamText({
    model: "openai/gpt-4o-mini",
    prompt: "Write a short haiku about the ocean.",
  });

  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }

  const usage = await result.usage;
  console.log("\n\nToken usage:", usage);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
