#!/usr/bin/env python3
from __future__ import annotations

import argparse
import base64
import json
import os
import subprocess
import tempfile
import time
import urllib.parse
from pathlib import Path
from typing import Any

import requests


TOKEN_URL = "https://oauth2.googleapis.com/token"
TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize"
SCOPE = "https://www.googleapis.com/auth/cloud-platform"
DEFAULT_CREDENTIALS = Path("config/gcp/hsq-edu-cde6b91dff1b.json")


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def infer_language_code(voice: str) -> str:
    parts = voice.split("-")
    if len(parts) >= 2:
        return f"{parts[0]}-{parts[1]}"
    return "en-US"


def load_credentials(path: Path | None) -> dict[str, str]:
    if path:
        data = json.loads(path.read_text(encoding="utf-8"))
        return {
            "client_email": data["client_email"],
            "private_key": data["private_key"],
        }

    env_email = os.environ.get("GCP_SA_EMAIL")
    env_key = os.environ.get("GCP_SA_PRIVATE_KEY")
    if env_email and env_key:
        return {
            "client_email": env_email,
            "private_key": env_key.replace("\\n", "\n"),
        }

    gac = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if gac:
        return load_credentials(Path(gac))

    if DEFAULT_CREDENTIALS.exists():
        return load_credentials(DEFAULT_CREDENTIALS)

    raise SystemExit(
        "Missing Google credentials. Set GOOGLE_APPLICATION_CREDENTIALS, "
        "set GCP_SA_EMAIL/GCP_SA_PRIVATE_KEY, or place the service account JSON at "
        f"{DEFAULT_CREDENTIALS}."
    )


def sign_rs256(unsigned_jwt: str, private_key_pem: str) -> str:
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False) as key_file:
        key_file.write(private_key_pem)
        key_path = Path(key_file.name)

    try:
        key_path.chmod(0o600)
        proc = subprocess.run(
            ["openssl", "dgst", "-sha256", "-sign", str(key_path)],
            input=unsigned_jwt.encode("utf-8"),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )
    finally:
        try:
            key_path.unlink()
        except FileNotFoundError:
            pass

    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.decode("utf-8", errors="replace").strip())

    return b64url(proc.stdout)


def get_access_token(credentials: dict[str, str]) -> str:
    now = int(time.time())
    header = {"alg": "RS256", "typ": "JWT"}
    payload = {
        "iss": credentials["client_email"],
        "scope": SCOPE,
        "aud": TOKEN_URL,
        "iat": now,
        "exp": now + 3600,
    }
    unsigned = (
        f"{b64url(json.dumps(header, separators=(',', ':')).encode('utf-8'))}."
        f"{b64url(json.dumps(payload, separators=(',', ':')).encode('utf-8'))}"
    )
    jwt = f"{unsigned}.{sign_rs256(unsigned, credentials['private_key'])}"
    body = urllib.parse.urlencode(
        {
            "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
            "assertion": jwt,
        }
    ).encode("utf-8")
    data = post_json(
        TOKEN_URL,
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    return str(data["access_token"])


def post_json(url: str, *, data: bytes, headers: dict[str, str]) -> dict[str, Any]:
    resp = requests.post(url, data=data, headers=headers, timeout=60)
    if not resp.ok:
        raise RuntimeError(f"HTTP {resp.status_code}: {resp.text}")
    return resp.json()


def synthesize(
    *,
    token: str,
    text: str,
    voice: str,
    language_code: str,
    speaking_rate: float,
    audio_encoding: str,
    input_kind: str,
) -> bytes:
    if input_kind not in {"text", "ssml", "markup"}:
        raise ValueError(f"Unsupported input kind: {input_kind}")

    payload = {
        "input": {input_kind: text},
        "voice": {"languageCode": language_code, "name": voice},
        "audioConfig": {"audioEncoding": audio_encoding, "speakingRate": speaking_rate},
    }
    data = post_json(
        TTS_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    return base64.b64decode(data["audioContent"])


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Generate speech with Google Cloud Text-to-Speech REST API."
    )
    text_group = parser.add_mutually_exclusive_group(required=True)
    text_group.add_argument("--text", help="Text to synthesize.")
    text_group.add_argument("--text-file", type=Path, help="UTF-8 text file to synthesize.")
    parser.add_argument("--out", type=Path, required=True, help="Output audio path.")
    parser.add_argument("--credentials", type=Path, help="Service account JSON path.")
    parser.add_argument("--voice", default="en-US-Neural2-J", help="Google TTS voice name.")
    parser.add_argument("--language-code", help="Google TTS language code. Defaults from voice.")
    parser.add_argument("--rate", type=float, default=0.92, help="Speaking rate.")
    parser.add_argument(
        "--input-kind",
        choices=["text", "ssml", "markup"],
        default="text",
        help="Google TTS input field to use.",
    )
    parser.add_argument(
        "--encoding",
        default="MP3",
        choices=["MP3", "LINEAR16", "OGG_OPUS", "MULAW", "ALAW"],
        help="Google TTS audio encoding.",
    )
    parser.add_argument(
        "--ssml",
        action="store_true",
        help="Compatibility alias for --input-kind ssml.",
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()
    text = args.text if args.text is not None else args.text_file.read_text(encoding="utf-8")
    text = text.strip()
    if not text:
        raise SystemExit("Input text is empty.")

    input_kind = "ssml" if args.ssml else args.input_kind
    credentials = load_credentials(args.credentials)
    token = get_access_token(credentials)
    audio = synthesize(
        token=token,
        text=text,
        voice=args.voice,
        language_code=args.language_code or infer_language_code(args.voice),
        speaking_rate=args.rate,
        audio_encoding=args.encoding,
        input_kind=input_kind,
    )
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_bytes(audio)
    print(
        json.dumps(
            {
                "out": str(args.out),
                "bytes": len(audio),
                "voice": args.voice,
                "language_code": args.language_code or infer_language_code(args.voice),
                "encoding": args.encoding,
                "rate": args.rate,
                "input_kind": input_kind,
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
