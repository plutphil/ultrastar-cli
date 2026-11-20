import App from "./ui/App.tsx";
import { render } from "ink";

const args = process.argv.slice(2);

if (args.some((arg) => arg === "--help" || arg === "-h")) {
  console.log("Usage: bunx --bun ultrastar [<artist> <title>] [--] \n\nDash-separated syntax: bunx --bun ultrastar <artist> - <title>");
  process.exit(0);
}

let artist = args[0] ?? "";
let title = args.slice(1).join(" ");

// Support both quoted positional arguments and an unquoted artist/title pair separated by a standalone dash.
const dashIndex = args.indexOf("-");
if (dashIndex !== -1) {
  const beforeDash = args.slice(0, dashIndex);
  const afterDash = args.slice(dashIndex + 1);

  artist = beforeDash.join(" ");
  title = afterDash.join(" ");
}

// Direct download mode
console.log(`Artist: ${artist}`);
console.log(`Title: ${title}`);
