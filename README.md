# Void Editor — TranscriptAI

> An open-source Adobe Premiere Pro CEP extension for automatic transcription and dynamic, animated subtitles.

Void Editor — TranscriptAI is a CEP extension for Adobe Premiere Pro 2022 and later. It combines local Whisper transcription with word-level timestamps, subtitle editing, customizable typography, and MOGRT-based animated/highlighted captions.

The goal is simple: **turn spoken audio into editable, styled subtitles directly inside Premiere Pro.**

---

## ✨ Features

### 🎙️ Automatic transcription

- Local speech-to-text transcription with `faster-whisper`
- Word-level timestamps
- Selectable Whisper models
- Language selection
- Voice Activity Detection (VAD)
- Configurable maximum characters per subtitle
- Configurable maximum words per subtitle
- Transcription progress reporting

The engine can read clips from the active Premiere Pro audio track and combine them with FFmpeg before transcription when necessary.

### ✏️ Subtitle editing

After transcription, generated subtitle lines can be reviewed and edited before being added to the timeline.

The editor supports:

- Editing subtitle text
- Adding new subtitle lines
- Merging subtitle lines
- Adjusting subtitle timing
- Selecting the transcription range
- Saving interface settings locally

### 🎬 Animated & highlighted subtitles

The main feature of the project is its MOGRT-based subtitle system.

The extension generates subtitle timing data and sends it to the MOGRT through JSON. This allows the MOGRT to handle animated text and word highlighting while Premiere Pro handles the timeline.

Supported styling options include:

- Word highlighting
- Highlight color
- Text color
- Font selection
- Font size
- Bold
- Italic
- Outline
- Outline color
- Outline width
- Shadow
- Shadow color
- Shadow opacity
- Shadow distance
- Shadow softness
- Background
- Background opacity
- Text animation
- Highlight animation
- Timeline offset
- Video track selection

### 🔤 Bundled fonts

The extension includes a collection of fonts that can be selected directly from the interface.

Current font families include:

- Archivo Black
- Bebas Neue
- Cinzel
- Cormorant Garamond
- Crimson Text
- Darker Grotesque
- EB Garamond
- Exo 2
- Inter
- Jost
- Libre Baskerville
- Lora
- Merriweather
- Metal Mania
- Michroma
- Montserrat
- Nunito
- Open Sans
- Orbitron
- Pirata One
- Playfair Display
- Rajdhani
- Roboto
- Sorts Mill Goudy
- Syncopate
- UnifrakturMaguntia

Font licensing and attribution information is included in:

`client/fonts/FONT_LICENSES.txt`

---

## ⚙️ How it works

The basic workflow is:

```text
Premiere Pro Sequence
        │
        ▼
Selected Audio Track
        │
        ▼
Audio Clip Collection
        │
        ▼
FFmpeg (when multiple clips are required)
        │
        ▼
faster-whisper
        │
        ▼
Word-level timestamps
        │
        ▼
Subtitle line generation
        │
        ▼
Transcript Editor
        │
        ├───────────────┐
        ▼               ▼
     SRT Captions     MOGRT + JSON
                        │
                        ▼
              Animated / Highlighted
                   Subtitles
                        │
                        ▼
                 Premiere Timeline
```

---

## 🧠 Transcription engine

The Python transcription engine uses `faster-whisper`.

It returns subtitle data containing:

- Detected language
- Total duration
- Number of subtitle lines
- Subtitle text
- Line start/end timestamps
- Individual word timestamps

A simplified output looks like:

```json
{
  "language": "en",
  "duration": 12.345,
  "line_count": 2,
  "lines": [
    {
      "text": "Example subtitle",
      "start": 0.0,
      "end": 1.85,
      "words": [
        {
          "word": "Example",
          "start": 0.0,
          "end": 0.65
        },
        {
          "word": "subtitle",
          "start": 0.72,
          "end": 1.85
        }
      ]
    }
  ]
}
```

Subtitle lines are automatically grouped according to the configured character and word limits.

---

## 🔥 MOGRT + JSON system

When animated/highlighted subtitles are enabled, the extension imports the MOGRT into Premiere Pro and configures it using JSON.

The subtitle timing is converted into a compact representation using millisecond offsets relative to the first subtitle line.

The MOGRT receives this information through its `JSON_Input` parameter.

This makes it possible to keep the visual animation inside the MOGRT while the extension controls:

- subtitle content
- word timing
- font
- colors
- animation selection
- outline
- shadow
- background
- timeline placement

In short:

```text
Subtitle timing
      +
Style settings
      ↓
    JSON
      ↓
   MOGRT
      ↓
Premiere Pro Timeline
```

---

## 📝 Standard caption mode

The extension can also generate an SRT file and import it into Premiere Pro as standard captions.

This provides a simpler alternative when animated/highlighted MOGRT subtitles are not required.

---

## 🖥️ Requirements

- Windows
- Adobe Premiere Pro 2022 or later
- CEP extension support
- Required transcription runtime
- `faster-whisper`
- FFmpeg
- Whisper model files

The repository contains the project source and distribution files used by the current version.

---

## 📦 Installation

### Using the packaged version

If you are using the packaged distribution:

1. Download the project/release package.
2. Place the extension in the Adobe CEP extensions directory.
3. Enable CEP extensions if your Premiere Pro installation requires it.
4. Open Adobe Premiere Pro.
5. Open the Void Editor — TranscriptAI extension.

The packaged `dist` directory contains the current runtime/build components used by the project.

### From source

If you want to develop or rebuild the transcription engine:

1. Clone the repository.
2. Install the required Python dependencies.
3. Make sure the required Whisper model is available.
4. Make sure FFmpeg is available.
5. Build the transcription executable if required.
6. Install the CEP extension into Premiere Pro.
7. Launch Premiere Pro and open the extension.

---

## 📁 Project structure

The repository intentionally keeps the existing working project structure.

```text
void-editor-transcriptai/
│
├── client/
│   ├── fonts/
│   │   ├── *.ttf
│   │   └── FONT_LICENSES.txt
│   ├── CSInterface.js
│   ├── index.html
│   ├── index.js
│   └── style.css
│
├── CSXS/
│   └── manifest.xml
│
├── dist/
│   ├── bin/
│   ├── models/
│   ├── source/
│   │   ├── dinamik_altyazi_motoru/
│   │   └── dinamik_altyazi_motoru.mogrt
│   ├── derleme.txt
│   ├── VoidEditorTranscript.exe
│   ├── VoidEditorTranscript.spec
│   └── whisper_engine.py
│
├── host/
│   └── index.jsx
│
├── LICENSE
├── README.md
└── whisper_engine.py
```

The project structure is kept close to the working production version so that paths and runtime behavior do not need to be changed simply for repository organization.

---

## 🔌 CEP architecture

The extension consists of three main parts:

### Client

The `client` directory contains the CEP interface:

- HTML interface
- JavaScript logic
- CSS
- bundled fonts
- Adobe `CSInterface.js`

The client communicates with Premiere Pro through CEP.

### Host

The `host/index.jsx` file contains the Premiere Pro ExtendScript logic.

It is responsible for tasks such as:

- Checking the active sequence
- Reading audio clips
- Reading sequence In/Out points
- Importing SRT captions
- Importing MOGRTs
- Configuring MOGRT parameters
- Communicating with Premiere Pro

### Transcription engine

`whisper_engine.py` handles:

- Whisper model loading
- Audio processing
- FFmpeg clip merging
- Transcription
- Word timestamps
- Subtitle segmentation
- JSON output

---

## 💾 Settings

The extension stores selected interface settings locally using browser `localStorage`.

Saved settings include items such as:

- Whisper model
- Language
- Character/word limits
- Audio track
- Caption track
- Font
- Font size
- Colors
- Outline
- Shadow
- Background
- Animation settings

---

## 🛠️ Development

This project is primarily intended for Windows and Adobe Premiere Pro.

The source code is provided so developers can inspect, modify, improve, and extend the extension.

Potential areas for future development include:

- Additional subtitle animation styles
- More caption layout options
- Improved subtitle segmentation
- Additional export formats
- More MOGRT templates
- GPU acceleration
- Improved installation tooling
- Better cross-version Premiere Pro compatibility

---

## 🤝 Contributing

Contributions are welcome.

To contribute:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test the extension in Premiere Pro.
5. Submit a pull request.

For larger changes, opening an issue before implementation is recommended.

---

## 📜 License

The original source code of Void Editor — TranscriptAI is released under the **MIT License**.

See:

[`LICENSE`](LICENSE)

Third-party components and assets are **not automatically relicensed under MIT**.

This includes, where applicable:

- Adobe CEP / `CSInterface.js`
- Fonts
- FFmpeg
- `faster-whisper`
- Whisper models
- Other third-party Python packages
- Third-party components contained in or required by MOGRT assets

Font licensing and attribution information is available at:

[`client/fonts/FONT_LICENSES.txt`](client/fonts/FONT_LICENSES.txt)

---

## ⚠️ Disclaimer

Void Editor — TranscriptAI is an independent third-party project.

**Adobe**, **Adobe Premiere Pro**, and related trademarks are property of Adobe Inc.

This project is not affiliated with, endorsed by, or sponsored by Adobe unless explicitly stated otherwise.

---

## 👤 Author

Created by **Aktuğ Antika**.

If you find the project useful, consider giving the repository a ⭐ on GitHub.
