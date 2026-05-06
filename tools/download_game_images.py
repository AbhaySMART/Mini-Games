import pathlib
import re
import subprocess
import time
import urllib.parse

OUT = pathlib.Path("assets/images/games")
OUT.mkdir(parents=True, exist_ok=True)


def slugify(value):
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", value.lower()))


def load_games():
    source = pathlib.Path("data.js").read_text()
    pattern = re.compile(
        r'g\("(?P<title>[^"]+)",\s*"(?P<category>[^"]+)",\s*"(?P<lesson>[^"]+)",\s*"(?P<mission>[^"]+)",\s*"(?P<mechanic>[^"]+)",\s*"(?P<key>[^"]+)",\s*"(?P<icon>[^"]+)",\s*\{\s*theme:\s*"(?P<theme>[^"]+)",\s*scene:\s*"(?P<scene>[^"]+)"',
        re.S,
    )
    games = []
    for match in pattern.finditer(source):
        title = match.group("title")
        prompt = (
            f"realistic 3D animated kids in Kind Kingdom playing {title}, "
            f"{match.group('scene')}, theme: {match.group('theme')}, "
            f"teaching {match.group('category').lower()}, warm storybook lighting, child friendly, no text, no logos"
        )
        games.append((slugify(title), prompt))
    return games


def url_for(prompt, seed):
    encoded = urllib.parse.quote(prompt)
    return f"https://image.pollinations.ai/prompt/{encoded}?width=720&height=600&seed={seed}&nologo=true&safe=true"


for index, (slug, prompt) in enumerate(load_games()):
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
