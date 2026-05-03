import pathlib
import subprocess
import time
import urllib.parse

GAMES = [
    ("compliment-castle", "realistic 3D animated children giving specific sincere compliments in a beautiful castle courtyard, warm magical kingdom lighting, child friendly, no text"),
    ("share-the-crown", "realistic 3D animated children happily taking turns with a small golden crown in a friendly castle courtyard, warm magical kingdom lighting, no text"),
    ("brave-apology-bridge", "realistic 3D animated two children meeting on a glowing wooden bridge, making peace after a mistake, magical kingdom, no text"),
    ("listening-lanterns", "realistic 3D animated children holding glowing lanterns at dusk, one child listening carefully to another, magical forest, no text"),
    ("feelings-garden", "realistic 3D animated magical garden with colorful emotion flowers and children gently caring for them, warm soft light, no text"),
    ("patience-potion", "realistic 3D animated cozy wizard table with a glowing calm potion and children breathing slowly, magical kingdom, no text"),
    ("helping-hands-bakery", "realistic 3D animated warm royal bakery where children help carry bread flour and berry baskets, golden light, no text"),
    ("truth-teller-tower", "realistic 3D animated tall castle tower with a cracked bell, a child bravely telling the truth, warm dramatic light, no text"),
    ("gratitude-gems", "realistic 3D animated children discovering glowing thank you gems in a treasure room, magical sparkle, no text"),
    ("respectful-roundtable", "realistic 3D animated children sitting around a round wooden table, sharing ideas respectfully in a castle room, no text"),
    ("inclusion-inn", "realistic 3D animated welcoming fantasy inn where children invite a new child to join their game, warm light, no text"),
    ("courage-cave", "realistic 3D animated softly lit cave with a glowing map and a brave child taking a careful step forward, no text"),
    ("calm-dragon-den", "realistic 3D animated friendly orange dragon calming down while children use peaceful breathing, warm cave light, no text"),
    ("teamwork-tournament", "realistic 3D animated children passing a ball together on a royal tournament field, bright joyful scene, no text"),
    ("fairness-fountain", "realistic 3D animated sparkling fountain where children choose different tools that fit each helper, magical courtyard, no text"),
    ("promise-path", "realistic 3D animated sunny winding path with reminder notes and a child delivering a basket, magical kingdom, no text"),
    ("healthy-habits-harbor", "realistic 3D animated bright harbor with children packing water fruit and healthy supplies onto a small boat, no text"),
    ("safety-shield", "realistic 3D animated glowing safety shield protecting children near a crosswalk and play yard, magical kingdom, no text"),
    ("curiosity-clock", "realistic 3D animated magical clock tower filled with books and curious children experimenting, warm light, no text"),
    ("perseverance-peak", "realistic 3D animated children climbing a gentle mountain path helping each other continue after a setback, no text"),
    ("empathy-echoes", "realistic 3D animated moonlit valley where gentle glowing echoes connect children with caring expressions, no text"),
    ("manners-market", "realistic 3D animated cheerful market where children use polite words with vendors, warm fantasy village, no text"),
    ("problem-solving-portal", "realistic 3D animated glowing blue portal opening as children arrange four magical runes, no text"),
    ("nature-nook", "realistic 3D animated children caring for plants and animals in a sunlit forest nook, magical soft light, no text"),
    ("digital-kindness-gate", "realistic 3D animated magical digital gate showing kind glowing messages and children choosing wisely, no readable text"),
    ("restful-moon-meadow", "realistic 3D animated peaceful moonlit meadow with children winding down under soft glowing lights, no text"),
]

OUT = pathlib.Path("assets/images/games")
OUT.mkdir(parents=True, exist_ok=True)


def url_for(prompt, seed):
    encoded = urllib.parse.quote(prompt)
    return f"https://image.pollinations.ai/prompt/{encoded}?width=720&height=600&seed={seed}&nologo=true&safe=true"


for index, (slug, prompt) in enumerate(GAMES):
    target = OUT / f"{slug}.jpg"
    temp = OUT / f"{slug}.tmp"
    if target.exists() and target.stat().st_size > 10_000:
        print(f"exists {target}")
        continue

    url = url_for(prompt, 3100 + index)
    print(f"downloading {slug}")
    result = subprocess.run(
        [
            "curl",
            "-L",
            "--fail",
            "--silent",
            "--show-error",
            "--max-time",
            "240",
            "--output",
            str(temp),
            url,
        ],
        check=False,
    )
    if result.returncode != 0:
        print(f"failed {slug}: curl exit {result.returncode}")
        temp.unlink(missing_ok=True)
        continue
    if not temp.exists() or temp.stat().st_size < 10_000:
        size = temp.stat().st_size if temp.exists() else 0
        print(f"failed {slug}: small file {size} bytes")
        temp.unlink(missing_ok=True)
        continue
    temp.replace(target)
    print(f"saved {target} {target.stat().st_size} bytes")
    time.sleep(1)
