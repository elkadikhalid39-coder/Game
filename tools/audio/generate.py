"""Genera el audio pregrabado de la app con voces neuronales libres (Piper), sin conexión.

Uso (con piper-tts instalado y los modelos en VOICES_DIR):
    python tools/audio/generate.py /ruta/a/modelos

Crea, por cada voz, public/audio/<voz>.bin (MP3 concatenados) y public/audio/<voz>.json
(índice { clave: [inicio, longitud] }). La clave es el hash FNV-1a de 32 bits del texto
(igual que en src/core/audio.js). Las frases que no estén en el paquete se leen con la voz del móvil.
"""
import io, json, subprocess, sys, wave
from pathlib import Path

from piper import PiperVoice, SynthesisConfig

ROOT = Path(__file__).resolve().parents[2]
MODELS = Path(sys.argv[1])
OUT = ROOT / "public" / "audio"
CATALOG = json.loads((ROOT / "content" / "voices.json").read_text())


def fnv(text):
    h = 0x811C9DC5
    for b in text.strip().encode("utf-8"):
        h = ((h ^ b) * 0x01000193) & 0xFFFFFFFF
    return format(h, "08x")


def load(p):
    return json.loads((ROOT / p).read_text())


# ---------- Textos ----------
es = load("content/i18n/es.json")["t"]
units = load("content/course/units.json")
course = set()
for u in units:
    for w in u["words"]:
        course |= {es[w["id"]], es["e_" + w["id"]]}
    for p in u["phrases"]:
        course |= {es["q_" + p["id"]], es["a_" + p["id"]]}

drive = load("content/exams/conducir.json")
# Igual que en src/exams/driving.js: pregunta y opciones leídas seguidas.
drive_texts = {w["es"] for w in drive["words"]} | {
    ". ".join([q["q"], *[f"{'abc'[i]}. {o}" for i, o in enumerate(q["options"])]]) for q in drive["questions"]
}

dele = load("content/exams/dele-a2.json")
dialog = {"M": set(), "H": set()}


def walk(o):
    if isinstance(o, dict):
        for k, v in o.items():
            if k == "dialog":
                for who, text in v:
                    dialog[who].add(text)
            walk(v)
    elif isinstance(o, list):
        for v in o:
            walk(v)


walk(dele)
examiner = {line for t in dele["speaking"]["tasks"] for line in t.get("examiner", [])}

# Qué lleva cada voz: todas, el curso; la neutra, además, lo de los exámenes;
# las dos voces de España, los diálogos de la comprensión auditiva (M: mujer, H: hombre).
extra = {"neutra": drive_texts | examiner, "es-f": dialog["M"], "es-m": dialog["H"]}

OUT.mkdir(parents=True, exist_ok=True)
for v in CATALOG["voices"]:
    if v.get("source") != "recorded":
        continue
    model = PiperVoice.load(str(MODELS / (v["model"] + ".onnx")))
    config = SynthesisConfig(speaker_id=v.get("speaker"), length_scale=v.get("lengthScale", 1.0))
    texts = sorted(course | extra.get(v["id"], set()))
    blob, index = bytearray(), {}
    for text in texts:
        wav = io.BytesIO()
        with wave.open(wav, "wb") as w:
            model.synthesize_wav(text, w, syn_config=config)
        mp3 = subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-i", "pipe:0", "-ac", "1", "-ar", "22050", "-b:a", "32k", "-f", "mp3", "pipe:1"],
            input=wav.getvalue(), capture_output=True, check=True,
        ).stdout
        index[fnv(text)] = [len(blob), len(mp3)]
        blob += mp3
    (OUT / f"{v['id']}.bin").write_bytes(blob)
    (OUT / f"{v['id']}.json").write_text(json.dumps(index, separators=(",", ":")))
    print(f"{v['id']}: {len(texts)} audios, {len(blob) / 1e6:.1f} MB")
