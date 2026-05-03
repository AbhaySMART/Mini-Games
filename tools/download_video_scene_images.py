import pathlib
import re
import subprocess
import time
import urllib.parse
import argparse

OUT = pathlib.Path("assets/images/video-scenes")
OUT.mkdir(parents=True, exist_ok=True)


def slugify(value):
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", value.lower()))


def load_games():
    source = pathlib.Path("data.js").read_text()
    pattern = re.compile(
        r'g\("(?P<title>[^"]+)",\s*"(?P<category>[^"]+)",\s*"(?P<lesson>[^"]+)",\s*"(?P<mission>[^"]+)"'
    )
    for match in pattern.finditer(source):
        title = match.group("title")
        lesson = match.group("lesson")
        mission = match.group("mission")
        slug = slugify(title)
        yield slug, title, lesson, mission


def scene_prompts(title, lesson, mission):
    base = "realistic 3D animated children's storybook still, warm magical kingdom lighting, no text, no watermark"
    return [
        f"{base}, establishing shot for {title}, children in the exact kingdom location, clear friendly mood",
        f"{base}, problem moment for {title}: {mission}, a child clearly faces the situation",
        f"{base}, teaching moment for {title}: show the correct behavior step by step, {lesson}",
        f"{base}, happy result for {title}: friends or kingdom helped because the lesson was practiced, {lesson}",
    ]


def image_url(prompt, seed):
    return f"https://image.pollinations.ai/prompt/{urllib.parse.quote(prompt)}?width=720&height=600&seed={seed}&nologo=true&safe=true"


def download(url, target):
    temp = target.with_suffix(".tmp")
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
        temp.unlink(missing_ok=True)
        return False
    if not temp.exists() or temp.stat().st_size < 10_000:
        temp.unlink(missing_ok=True)
        return False
    temp.replace(target)
    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--game", help="Only generate scenes for one game slug.")
    parser.add_argument("--scene", type=int, choices=[1, 2, 3, 4], help="Only generate one scene number.")
    parser.add_argument("--limit", type=int, default=4, help="Maximum number of scene images to request in this run.")
    args = parser.parse_args()
    requested = 0
    for game_index, (slug, title, lesson, mission) in enumerate(load_games()):
        if args.game and slug != args.game:
            continue
        for scene_index, prompt in enumerate(scene_prompts(title, lesson, mission), start=1):
            if args.scene and scene_index != args.scene:
                continue
            if requested >= args.limit:
                print(f"stopped after limit {args.limit}")
                return
            target = OUT / f"{slug}-{scene_index}.jpg"
            if target.exists() and target.stat().st_size > 10_000:
                print(f"exists {target}")
                continue
            print(f"downloading {target}")
            ok = download(image_url(prompt, 7000 + game_index * 10 + scene_index), target)
            print(f"{'saved' if ok else 'failed'} {target}")
            requested += 1
            time.sleep(1)


if __name__ == "__main__":
    main()
