const { spawn, execFile } = require("child_process");
const util = require("util");
const path = require("path");
const fs = require("fs");
const execFileAsync = util.promisify(execFile);
const Resource = require("../models/Resource");

const UPLOADS_DIR = path.join(__dirname, "../../uploads");
const HLS_DIR = path.join(UPLOADS_DIR, "hls");

// Quality ladder, highest first. Renditions taller than the source are skipped
// (never upscale) — see transcodeResource().
const RENDITIONS = [
  { name: "1080p", height: 1080, videoBitrate: 5000, audioBitrate: 192 },
  { name: "720p", height: 720, videoBitrate: 2800, audioBitrate: 128 },
  { name: "480p", height: 480, videoBitrate: 1400, audioBitrate: 128 },
  { name: "360p", height: 360, videoBitrate: 800, audioBitrate: 96 },
];

// In-memory FIFO queue, processed one job at a time so a large transcode never
// competes for CPU with more than one other encode at once on this live server.
const queue = [];
let running = false;

async function queueTranscode(resourceId) {
  const id = String(resourceId);
  if (!queue.includes(id)) {
    queue.push(id);
    try {
      await Resource.findByIdAndUpdate(id, { hlsStatus: "queued", hlsError: null });
    } catch (err) {
      console.error(`[hls] failed to mark ${id} queued:`, err.message);
    }
  }
  processQueue();
}

function processQueue() {
  if (running) return;
  const id = queue.shift();
  if (!id) return;
  running = true;
  transcodeResource(id)
    .catch(async (err) => {
      console.error(`[hls] transcode failed for ${id}:`, err.message);
      try {
        await Resource.findByIdAndUpdate(id, { hlsStatus: "failed", hlsError: String(err.message).slice(0, 500) });
      } catch { /* best-effort */ }
    })
    .finally(() => {
      running = false;
      processQueue();
    });
}

async function probeDimensions(filePath) {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v", "error",
    "-select_streams", "v:0",
    "-show_entries", "stream=width,height",
    "-of", "csv=s=x:p=0",
    filePath,
  ]);
  const [w, h] = stdout.trim().split("x").map((n) => parseInt(n, 10));
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    throw new Error("Could not read video dimensions (not a valid video file?)");
  }
  return { width: w, height: h };
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (d) => {
      stderr += d.toString();
      if (stderr.length > 4000) stderr = stderr.slice(-4000);
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-400)}`));
    });
  });
}

async function transcodeResource(resourceId) {
  const resource = await Resource.findById(resourceId);
  if (!resource || resource.type !== "video" || !resource.url.includes("/uploads/")) return;

  const filename = path.basename(resource.url.split("?")[0]);
  const sourcePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(sourcePath)) throw new Error(`Source file not found: ${filename}`);

  await Resource.findByIdAndUpdate(resourceId, { hlsStatus: "processing", hlsError: null });

  const { width: srcWidth, height: srcHeight } = await probeDimensions(sourcePath);
  let renditions = RENDITIONS.filter((r) => r.height <= srcHeight + 40);
  if (!renditions.length) renditions = [RENDITIONS[RENDITIONS.length - 1]];

  const outDir = path.join(HLS_DIR, String(resourceId));
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const variants = [];
  for (const r of renditions) {
    const playlistName = `${r.name}.m3u8`;
    const width = Math.max(2, Math.round((srcWidth * (r.height / srcHeight)) / 2) * 2);
    const args = [
      "-y", "-i", sourcePath,
      "-vf", `scale=${width}:${r.height}`,
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
      "-b:v", `${r.videoBitrate}k`, "-maxrate", `${Math.round(r.videoBitrate * 1.07)}k`, "-bufsize", `${r.videoBitrate * 1.5}k`,
      "-c:a", "aac", "-b:a", `${r.audioBitrate}k`, "-ac", "2",
      "-threads", "2",
      "-hls_time", "6", "-hls_playlist_type", "vod",
      "-hls_segment_filename", path.join(outDir, `${r.name}_%04d.ts`),
      path.join(outDir, playlistName),
    ];
    await runFfmpeg(args);
    variants.push({ ...r, playlistName, width });
  }

  const masterLines = ["#EXTM3U", "#EXT-X-VERSION:3"];
  for (const v of variants) {
    const bandwidth = (v.videoBitrate + v.audioBitrate) * 1000;
    masterLines.push(`#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${v.width}x${v.height}`);
    masterLines.push(v.playlistName);
  }
  fs.writeFileSync(path.join(outDir, "master.m3u8"), masterLines.join("\n") + "\n");

  await Resource.findByIdAndUpdate(resourceId, {
    hlsStatus: "ready",
    hlsUrl: `/uploads/hls/${resourceId}/master.m3u8`,
    hlsError: null,
  });
}

/** Re-queue any job left "queued"/"processing" from before a server restart. */
async function requeueStuckJobs() {
  try {
    const stuck = await Resource.find({ hlsStatus: { $in: ["queued", "processing"] } }).select("_id");
    stuck.forEach((r) => queueTranscode(r._id));
    if (stuck.length) console.log(`[hls] re-queued ${stuck.length} interrupted transcode job(s).`);
  } catch (err) {
    console.error("[hls] requeueStuckJobs failed:", err.message);
  }
}

module.exports = { queueTranscode, requeueStuckJobs };
