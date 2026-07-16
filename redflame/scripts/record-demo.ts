import { execFile } from "node:child_process";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { chromium, type Page } from "@playwright/test";
import latestEval from "../evals/live/latest.json";

const run = promisify(execFile);
const root = process.cwd();
const outputDir = path.join(root, "artifacts");
const workingDir = path.join(outputDir, "demo-working");
const appUrl = process.env.REDFLAME_URL || "https://redflame-plum.vercel.app";
const ffmpeg = process.env.FFMPEG_PATH || "/opt/homebrew/bin/ffmpeg";
const ffprobe = process.env.FFPROBE_PATH || "/opt/homebrew/bin/ffprobe";
const voice = process.env.DEMO_VOICE || "Samantha";
const speechRate = process.env.DEMO_SPEECH_RATE || "165";
const hasVerifiedEval = (latestEval as { mode?: string }).mode === "live_eval";

type Segment = {
  narration: string;
  prepare?: (page: Page) => Promise<void>;
};

const segments: Segment[] = [
  {
    narration: "Investment teams already have AI that summarizes documents and drafts memos. RedFlame is different. It is pull requests and CI tests for investment decisions.",
    prepare: async (page) => page.locator("#top").scrollIntoViewIfNeeded(),
  },
  {
    narration: "Project Apex previously cleared the fund's two point five times M O I C and twenty percent I R R hurdles. Entry equity is a locked sixty million dollars, and the approved memo relies on those results.",
    prepare: async (page) => page.getByText("LOCKED INPUTS").scrollIntoViewIfNeeded(),
  },
  {
    narration: "Management revised fiscal year twenty thirty exit E B I T D A from twenty four million to twenty million. RedFlame confirms the period, unit, and adjusted basis are unchanged. This is a comparable value change.",
    prepare: async (page) => page.getByRole("heading", { name: "FY2030 Exit EBITDA" }).scrollIntoViewIfNeeded(),
  },
  {
    narration: "Deterministic code recompiles only the affected path. At an eight times exit multiple, enterprise value falls from one hundred ninety two million to one hundred sixty million. After twelve million of exit net debt, equity value falls to one hundred forty eight million. Against locked entry equity, M O I C falls to two point four seven times and five year I R R to nineteen point seven nine percent. Both return tests fail, while customer concentration remains unaffected.",
    prepare: async (page) => page.getByRole("heading", { name: "One fact, one traceable path" }).scrollIntoViewIfNeeded(),
  },
  {
    narration: hasVerifiedEval
      ? "Now consider ambiguous source language. The public demo shows a timestamped recorded G P T five point six evaluation artifact. G P T five point six classifies only the semantic definition; it never calculates a number or changes a hurdle. RedFlame blocks comparison and disables Accept."
      : "Now consider ambiguous source language. The public demo shows a clearly labeled fallback fixture, not a live model result. In configured live mode, G P T five point six may classify the semantic definition, but it never calculates a number or changes a hurdle. RedFlame blocks comparison and disables Accept.",
    prepare: async (page) => {
      await page.getByRole("button", { name: "Ambiguous definition" }).click();
      await page.getByTestId("semantic-card").getByText(/RECORDED EVAL FIXTURE|LIVE /).waitFor();
    },
  },
  {
    narration: "Returning to the comparable value change, the evidence, calculations, executable policy, and affected memo assertions are visible on one review surface.",
    prepare: async (page) => {
      await page.getByRole("button", { name: "Comparable value change" }).click();
      await page.getByRole("heading", { name: "Decision Tests" }).scrollIntoViewIfNeeded();
    },
  },
  {
    narration: "Accepting a fact is not approving an investment. The evidence becomes active, but both return tests remain failed, the deal moves to Hold, and the affected memo paragraphs become draft revisions requiring human review.",
    prepare: async (page) => {
      await page.getByRole("button", { name: "Accept evidence" }).click();
      await page.getByTestId("resolution-receipt").scrollIntoViewIfNeeded();
    },
  },
  {
    narration: "The review ends with a resolution receipt: thresholds unchanged, two failed tests, and two draft revisions. It is deliberately labeled demo local, unsigned, and not server persisted.",
  },
  {
    narration: "The revised memo is still a draft. Human review is required, and accepting evidence does not change either investment hurdle.",
    prepare: async (page) => {
      await page.getByRole("button", { name: "View revised memo" }).click();
      await page.getByRole("dialog", { name: "Project Apex · IC Memo" }).waitFor();
    },
  },
  {
    narration: "Adjacent tools document source grounding, model lineage, assumption tracking, and memo updates. RedFlame's narrow contribution is the complete evidence to decision control loop shown here: calculations, executable hurdles, stale assertions, and human resolution.",
    prepare: async (page) => {
      await page.getByRole("button", { name: "Close revised memo" }).click();
      await page.getByRole("heading", { name: "Document AI updates words. RedFlame invalidates decisions." }).scrollIntoViewIfNeeded();
    },
  },
  {
    narration: "Codex helped build and verify every recorded layer, including catching a real asynchronous bug in browser testing. RedFlame makes sure an investment decision cannot quietly rely on stale evidence.",
    prepare: async (page) => page.getByTestId("resolution-receipt").scrollIntoViewIfNeeded(),
  },
];

async function durationSeconds(file: string): Promise<number> {
  const { stdout } = await run(ffprobe, ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file]);
  return Number(stdout.trim());
}

async function main() {
  await rm(workingDir, { recursive: true, force: true });
  await mkdir(workingDir, { recursive: true });

  const audioFiles: string[] = [];
  const durations: number[] = [];
  for (const [index, segment] of segments.entries()) {
    const audio = path.join(workingDir, `segment-${String(index + 1).padStart(2, "0")}.aiff`);
    await run("/usr/bin/say", ["-v", voice, "-r", speechRate, "-o", audio, segment.narration]);
    audioFiles.push(audio);
    durations.push(await durationSeconds(audio));
  }

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: workingDir, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();
  await page.goto(appUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => window.localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.mouse.move(1390, 30);

  for (const [index, segment] of segments.entries()) {
    if (segment.prepare) await segment.prepare(page);
    await page.mouse.move(1390, 30);
    await page.waitForTimeout(Math.ceil((durations[index] + 0.35) * 1000));
  }

  await page.waitForTimeout(750);
  await context.close();
  await browser.close();

  const files = await readdir(workingDir);
  const videoFile = path.join(workingDir, files.find((file) => file.endsWith(".webm")) || "");
  if (!videoFile.endsWith(".webm")) throw new Error("Playwright did not produce a WebM recording");

  const concatList = path.join(workingDir, "audio-files.txt");
  await writeFile(concatList, audioFiles.map((file) => `file '${file.replaceAll("'", "'\\''")}'`).join("\n") + "\n");
  const narration = path.join(workingDir, "narration.aiff");
  await run(ffmpeg, ["-y", "-f", "concat", "-safe", "0", "-i", concatList, "-c", "copy", narration]);

  const output = path.join(outputDir, "redflame-demo.mp4");
  await run(ffmpeg, [
    "-y", "-i", videoFile, "-i", narration,
    "-c:v", "libx264", "-preset", "medium", "-crf", "22", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-shortest", output,
  ]);
  const finalDuration = await durationSeconds(output);
  if (finalDuration >= 180) throw new Error(`Demo is ${finalDuration.toFixed(1)} seconds; it must remain under three minutes`);
  console.log(`Demo ready: ${output}`);
  console.log(`Duration: ${finalDuration.toFixed(1)} seconds`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
