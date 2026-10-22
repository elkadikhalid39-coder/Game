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
    # Diálogo de cierre: cada línea (las frases incorrectas solo se leen).
    for k in range(1, len(u.get("dialog", {}).get("lines", [])) + 1):
        course.add(es[f"g_{u['id']}_{k}"])

drive = load("content/exams/conducir.json")
# Igual que en src/exams/driving.js: pregunta y opciones leídas seguidas.
drive_texts = {w["es"] for w in drive["words"]} | {
    ". ".join([q["q"], *[f"{'abc'[i]}. {o}" for i, o in enumerate(q["options"])]]) for q in drive["questions"]
}

deles = [load("content/exams/dele-a2.json"), load("content/exams/dele-a2-2.json")]
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


for dele in deles:
    walk(dele)
examiner = {line for dele in deles for t in dele["speaking"]["tasks"] for line in t.get("examiner", [])}

# Qué lleva cada paquete: cada voz, el curso; las dos voces de España, además, los diálogos de la
# comprensión auditiva del DELE (M: mujer, H: hombre). Lo que se lee en los exámenes (preguntas de
# conducir y examinador del DELE) va en un paquete aparte con la voz neutra («neutra-ex»), que solo
# se descarga al abrir un examen: así la app no baja megas de audio que quizá nunca se usen.
extra = {"es-f": dialog["M"], "es-m": dialog["H"]}
packs = [(v, course | extra.get(v["id"], set()), v["id"]) for v in CATALOG["voices"] if v.get("source") == "recorded"]
neutral = next(v for v in CATALOG["voices"] if v["id"] == CATALOG["default"])
packs.append((neutral, (drive_texts | examiner) - course, "neutra-ex"))

OUT.mkdir(parents=True, exist_ok=True)
models = {}
for v, texts, name in packs:
    model = models.get(v["model"]) or models.setdefault(v["model"], PiperVoice.load(str(MODELS / (v["model"] + ".onnx"))))
    config = SynthesisConfig(speaker_id=v.get("speaker"), length_scale=v.get("lengthScale", 1.0))
    blob, index = bytearray(), {}
    for text in sorted(texts):
        wav = io.BytesIO()
        with wave.open(wav, "wb") as w:
            model.synthesize_wav(text, w, syn_config=config)
        mp3 = subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-i", "pipe:0", "-ac", "1", "-ar", "22050", "-b:a", "32k", "-f", "mp3", "pipe:1"],
            input=wav.getvalue(), capture_output=True, check=True,
        ).stdout
        index[fnv(text)] = [len(blob), len(mp3)]
        blob += mp3
    (OUT / f"{name}.bin").write_bytes(blob)
    (OUT / f"{name}.json").write_text(json.dumps(index, separators=(",", ":")))
    print(f"{name}: {len(texts)} audios, {len(blob) / 1e6:.1f} MB")
