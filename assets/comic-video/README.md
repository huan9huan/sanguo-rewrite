# Comic Video Shared Assets

This directory contains reusable assets for the Comic Video Builder workflow.

These assets are shared across passage-level video runs so each run does not need to generate its own basic utility files.

## Current Assets

- `audio/silence/silence_100ms.wav`
- `audio/silence/silence_200ms.wav`
- `audio/silence/silence_300ms.wav`
- `audio/silence/silence_500ms.wav`
- `audio/silence/silence_1000ms.wav`

All silence files are:

- WAV
- PCM signed 16-bit little-endian
- 48 kHz
- stereo

## Usage

Use these files for natural pauses between TTS segments, beat holds, or small timing gaps in motion comic renders.

Do not create per-run silence files unless the needed duration is missing from this shared library.

If a new shared asset is added, update `manifest.json`.
