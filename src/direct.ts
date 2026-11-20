import { Effect } from "effect";
import { searchSongs } from "./api/usdb/search.ts";
import { checkYtDlpAvailable } from "./api/youtube/check.ts";
import { ytDlpInstallHint } from "./platform.ts";
import { ensureSession } from "./session.ts";
import { appendDownloadedEntry } from "./storage/downloaded.ts";
import { downloadSong } from "./ui/downloadSong.ts";

const normalize = (value: string) =>
  value.toLocaleLowerCase().replace(/\s+/g, " ").trim();

const log = (message: string) => console.error(`[ultrastar] ${message}`);

export const runDirectDownload = async (artist: string, title: string) => {
  if (!artist.trim() || !title.trim()) {
    throw new Error(
      "Both artist and title are required. Example: ultrastar Calvin Harris - One Kiss",
    );
  }

  log(`Artist: ${artist}`);
  log(`Title: ${title}`);
  log("Checking yt-dlp...");

  const ytAvailable = await Effect.runPromise(checkYtDlpAvailable);
  if (!ytAvailable) {
    throw new Error(`yt-dlp is not installed. ${ytDlpInstallHint()}`);
  }
  log("yt-dlp is available");

  log("Initializing USDB session...");
  const session = await Effect.runPromise(ensureSession);
  log(`Logged in as ${session.user}`);

  log("Searching USDB...");
  const page = await Effect.runPromise(
    searchSongs(
      {
        interpret: artist,
        title,
        limit: 100,
        start: 0,
      },
      session.cookie,
    ),
  );

  if (page.songs.length === 0) {
    throw new Error(`No USDB results found for ${artist} - ${title}`);
  }

  const exactSong = page.songs.find(
    (song) =>
      normalize(song.artist) === normalize(artist) &&
      normalize(song.title) === normalize(title),
  );
  const song = exactSong ?? page.songs[0];
  if (!song) throw new Error("No downloadable song was found");

  if (!exactSong) {
    log(`No exact match; using first result: ${song.artist} - ${song.title}`);
  } else {
    log(`Found exact match: ${song.artist} - ${song.title}`);
  }

  log(`Downloading USDB entry ${song.apiId}...`);
  let lastProgress = -1;
  const result = await Effect.runPromise(
    downloadSong({
      song,
      cookie: session.cookie,
      onProgress: (progress) => {
        const percent = Math.floor(progress * 10) * 10;
        if (percent !== lastProgress && percent >= 0) {
          lastProgress = percent;
          log(`Download progress: ${percent}%`);
        }
      },
      onLog: (message) => {
        for (const line of message.split(/[\r\n]+/)) {
          if (line.trim()) console.error(`[yt-dlp] ${line}`);
        }
      },
    }),
  );

  await Effect.runPromise(
    appendDownloadedEntry({
      apiId: song.apiId,
      artist: song.artist,
      title: song.title,
      dirName: result.dirName,
      songDir: result.songDir,
      downloadedAt: new Date().toISOString(),
    }),
  );

  log(`Download complete: ${result.songDir}`);
};
