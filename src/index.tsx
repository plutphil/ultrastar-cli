import { render } from "ink";
import App from "./ui/App.tsx";

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

const ENTER_ALTERNATE_SCREEN = "\u001b[?1049h";
const LEAVE_ALTERNATE_SCREEN = "\u001b[?1049l";
const CLEAR_SCREEN = "\u001b[2J"; // clear entire screen
const CURSOR_HOME = "\u001b[H"; // move cursor to 1;1

// Enter alternate screen so previous content is preserved and hidden,
// then clear and move cursor to the top-left to avoid inheriting the previous row.
process.stdout.write(ENTER_ALTERNATE_SCREEN + CLEAR_SCREEN + CURSOR_HOME);

const instance = render(<App initialArtist={artist} initialTitle={title} />);

// Ensure we restore previous content when the app exits
instance.waitUntilExit().finally(() => {
  try {
    process.stdout.write(LEAVE_ALTERNATE_SCREEN);
  } catch {}
});
