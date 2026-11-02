# Void Editor - TranscriptAI
# Author: Aktug Antika

import sys
import os
import json
import argparse

# PyInstaller frozen exe support
if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODELS_DIR = os.path.join(BASE_DIR, 'models')

# Set cache dirs before importing faster_whisper
os.environ['HF_HOME'] = MODELS_DIR
os.environ['TRANSFORMERS_CACHE'] = MODELS_DIR
os.environ['HF_HUB_CACHE'] = MODELS_DIR

from faster_whisper import WhisperModel

parser = argparse.ArgumentParser()
parser.add_argument("path")
parser.add_argument("params")
args = parser.parse_args()

try:
    params = json.loads(args.params)
except Exception as e:
    print(json.dumps({"error": "Invalid params: " + str(e)}))
    sys.exit(1)

MODEL_SIZE = params.get("model",     "base")
LANGUAGE   = params.get("language",  None)
DEVICE     = params.get("device",    "cpu")
MAX_CHARS  = int(params.get("max_chars", 42))
MAX_WORDS  = int(params.get("max_words", 7))
FILE_PATH  = args.path

import tempfile
import subprocess



def merge_clips_with_ffmpeg(clips, ffmpeg_path):
    """Build timeline-aligned audio using unique media inputs."""
    import os
    import tempfile
    import subprocess

    if not clips:
        raise ValueError("No audio clips to merge.")

    sample_rate = 16000
    work_dir = tempfile.mkdtemp(prefix="void_merge_")
    output_path = os.path.join(work_dir, "merged.wav")
    filter_path = os.path.join(work_dir, "filter.txt")

    # Register each source media file only once.
    media_indices = {}
    media_paths = []

    for clip in clips:
        media_path = os.path.normpath(clip["mediaPath"])

        if not os.path.isfile(media_path):
            raise FileNotFoundError(
                "Media file not found: " + media_path
            )

        if media_path not in media_indices:
            media_indices[media_path] = len(media_paths)
            media_paths.append(media_path)

    # Sort clips by their Premiere timeline positions.
    sorted_clips = sorted(
        clips,
        key=lambda clip: float(clip.get("start", 0))
    )

    valid_clips = []

    for clip in sorted_clips:
        source_in = float(clip["in"])
        source_out = float(clip["out"])
        timeline_start = float(clip.get("start", 0))

        if source_out <= source_in:
            continue

        valid_clips.append({
            "mediaPath": os.path.normpath(clip["mediaPath"]),
            "in": source_in,
            "out": source_out,
            "start": max(0.0, timeline_start)
        })

    if not valid_clips:
        raise ValueError("No valid audio clips found.")

    # Use the first clip's position as the audio time origin.
    timeline_origin = min(
        clip["start"] for clip in valid_clips
    )

    filter_parts = []
    source_groups = {}

    for clip in valid_clips:
        media_path = clip["mediaPath"]
        source_groups.setdefault(media_path, []).append(clip)

    # Split each unique source into independent audio branches.
    branch_map = {}

    for media_path, group in source_groups.items():
        input_idx = media_indices[media_path]
        branch_labels = [
            "src{}_{}".format(input_idx, i)
            for i in range(len(group))
        ]

        if len(branch_labels) == 1:
            filter_parts.append(
                "[{}:a]anull[{}]".format(
                    input_idx, branch_labels[0]
                )
            )
        else:
            filter_parts.append(
                "[{}:a]asplit={}[{}]".format(
                    input_idx,
                    len(branch_labels),
                    "][".join(branch_labels)
                )
            )

        for i, clip in enumerate(group):
            branch_map[id(clip)] = branch_labels[i]

    # Trim and position each clip on the Premiere timeline.
    mix_labels = []

    for i, clip in enumerate(valid_clips):
        branch = branch_map[id(clip)]
        delay_ms = round(
            (clip["start"] - timeline_origin) * 1000
        )

        output_label = "clip{}".format(i)


        filter_parts.append(
            "[{}]atrim=start={:.6f}:end={:.6f},"
            "asetpts=PTS-STARTPTS,"
            "aresample={},"
            "aformat=sample_fmts=fltp:"
            "channel_layouts=mono,"
            "adelay={}:all=1[{}]".format(
                branch,
                clip["in"],
                clip["out"],
                sample_rate,
                delay_ms,
                output_label
            )
        )


        mix_labels.append("[{}]".format(output_label))

    # Mix positioned clips and preserve silence between them.
    if len(mix_labels) == 1:
        filter_parts.append(
            "{}anull[out]".format(mix_labels[0])
        )
    else:
        filter_parts.append(
            "{}amix=inputs={}:duration=longest:"
            "normalize=0[out]".format(
                "".join(mix_labels),
                len(mix_labels)
            )
        )

    with open(filter_path, "w", encoding="utf-8") as f:
        f.write(";\n".join(filter_parts))

    cmd = [
        ffmpeg_path,
        "-hide_banner",
        "-loglevel", "error"
    ]

    for media_path in media_paths:
        cmd.extend(["-i", media_path])

    cmd.extend([
        "-filter_complex_script", filter_path,
        "-map", "[out]",
        "-ar", str(sample_rate),
        "-ac", "1",
        "-c:a", "pcm_s16le",
        "-y", output_path
    ])

    result = subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        errors="replace"
    )

    if result.returncode != 0:
        raise RuntimeError(
            "FFmpeg timeline merge failed: " +
            result.stderr[-3000:]
        )

    return output_path


clips_data = params.get('clips', None)
tmp_file = None

if clips_data and len(clips_data) >= 1:
    ffmpeg_path = os.path.join(BASE_DIR, 'bin', 'ffmpeg.exe' if os.name == 'nt' else 'ffmpeg')
    tmp_file = merge_clips_with_ffmpeg(clips_data, ffmpeg_path)
    FILE_PATH = tmp_file

if not os.path.exists(FILE_PATH):
    print(json.dumps({"error": "File not found: " + FILE_PATH}))
    sys.exit(1)

# Load model from local cache
try:
    model = WhisperModel(
        MODEL_SIZE,
        device=DEVICE,
        compute_type="int8",
        download_root=MODELS_DIR,
        local_files_only=True
    )
except Exception as e:
    try:
        model = WhisperModel(
            MODEL_SIZE,
            device=DEVICE,
            compute_type="int8",
            download_root=MODELS_DIR
        )
    except Exception as e2:
        print(json.dumps({"error": "Model load failed: " + str(e2)}))
        sys.exit(1)

# Transcribe with progress tracking
try:
    total_duration = 0
    segments, info = model.transcribe(
        FILE_PATH,
        language=LANGUAGE if LANGUAGE else None,
        word_timestamps=True,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500)
    )
    total_duration = info.duration
    print(json.dumps({"duration": total_duration}))
except Exception as e:
    print(json.dumps({"error": "Transcription failed: " + str(e)}))
    sys.exit(1)

# Group words into lines
# Degisiklik: cur_words artik string degil, dict saklıyor {"word", "start", "end"}
lines = []
cur_words = []
cur_start = None
cur_end   = None
cur_chars = 0

for segment in segments:
    if not hasattr(segment, 'words') or not segment.words:
        continue
    for word in segment.words:
        w_text  = word.word.strip()
        w_start = round(word.start, 3)
        w_end   = round(word.end,   3)
        if not w_text:
            continue
        if cur_start is None:
            cur_start = w_start
        new_chars = cur_chars + len(w_text) + (1 if cur_words else 0)
        new_count = len(cur_words) + 1
        if cur_words and (new_chars > MAX_CHARS or new_count > MAX_WORDS):
            lines.append({
                "text":  " ".join([w["word"] for w in cur_words]),
                "start": cur_start,
                "end":   cur_end,
                "words": cur_words
            })
            cur_words = []
            cur_chars = 0
            cur_start = w_start
        cur_words.append({"word": w_text, "start": w_start, "end": w_end})
        cur_chars = cur_chars + len(w_text) + (1 if len(cur_words) > 1 else 0)
        cur_end   = w_end

if cur_words:
    lines.append({
        "text":  " ".join([w["word"] for w in cur_words]),
        "start": cur_start,
        "end":   cur_end,
        "words": cur_words
    })

output = {
    "language":   info.language,
    "duration":   round(info.duration, 3),
    "line_count": len(lines),
    "lines":      lines
}

print(json.dumps(output, ensure_ascii=True))
