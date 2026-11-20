import { render } from "ink";
import { runDirectDownload } from "./direct.ts";
import App from "./ui/App.tsx";

const args = process.argv.slice(2);

if (args.some((arg) => arg === "--help" || arg === "-h")) {
  console.log(
    "Usage: bunx --bun ultrastar [<artist> <title> | <artist> - <title>]",
  );
  process.exit(0);
}

const dashIndex = args.indexOf("-");
const artist =
  dashIndex >= 0 ? args.slice(0, dashIndex).join(" ") : (args[0] ?? "");
const title =
  dashIndex >= 0
    ? args.slice(dashIndex + 1).join(" ")
    : args.slice(1).join(" ");

if (artist || title) {
  try {
    await runDirectDownload(artist, title);
  } catch (error) {
    console.error(
      `[ultrastar] Error: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  }
} else {
  const instance = render(<App />);
  await instance.waitUntilExit();
}
