import json
import os
import pathlib
import re
import subprocess
import time
import urllib.parse
import urllib.request

OUT = pathlib.Path("assets/videos")
OUT.mkdir(parents=True, exist_ok=True)
MANIFEST = OUT / "video_generation_manifest.json"


def load_env_file(path):
    env_path = pathlib.Path(path)
    if not env_path.exists():
        return
    for raw_line in env_path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


load_env_file(".env")
load_env_file(".env.local")

FAL_MODEL = os.environ.get("FAL_VIDEO_MODEL", "fal-ai/hunyuan-video")
MINIMAX_MODEL = os.environ.get("MINIMAX_VIDEO_MODEL", "MiniMax-Hailuo-2.3")
MINIMAX_RESOLUTION = os.environ.get("MINIMAX_VIDEO_RESOLUTION", "768P")
MINIMAX_DURATION = int(os.environ.get("MINIMAX_VIDEO_DURATION", "6"))
VIDEO_START = int(os.environ.get("VIDEO_START", "0"))
VIDEO_LIMIT = int(os.environ.get("VIDEO_LIMIT", "0"))


def slugify(value):
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", value.lower()))


def load_games():
    source = pathlib.Path("data.js").read_text()
    pattern = re.compile(
        r'g\("(?P<title>[^"]+)",\s*"(?P<category>[^"]+)",\s*"(?P<lesson>[^"]+)",\s*"(?P<mission>[^"]+)"'
    )
    games = []
    for match in pattern.finditer(source):
        title = match.group("title")
        lesson = match.group("lesson")
        mission = match.group("mission")
        slug = slugify(title)
        prompt = video_prompt(title, lesson, mission)
        games.append((slug, prompt))
    return games


def video_prompt(title, lesson, mission):
    return (
        f"6 second clear children's lesson video: {title}. "
        f"Animated kids in a magical kingdom face this simple moment: {mission}. "
        f"Show the kind choice clearly, then show friends feeling helped. "
        f"Lesson: {lesson}. "
        "Realistic 3D animated kids, warm storybook lighting, simple camera, no text, no logos."
    )


def pollinations_url(prompt):
    return f"https://gen.pollinations.ai/video/{urllib.parse.quote(prompt)}"


def run_curl_json(args, payload=None, timeout=60):
    command = ["curl", "-L", "--fail", "--silent", "--show-error", *args]
    if payload is not None:
        command.extend(["--json", json.dumps(payload)])
    result = subprocess.run(command, check=False, capture_output=True, text=True, timeout=timeout)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or f"curl failed with exit {result.returncode}")
    return json.loads(result.stdout)


def minimax_key():
    key = os.environ.get("MINIMAX_API_KEY") or os.environ.get("VIDEO_API_KEY")
    if not key:
        raise RuntimeError("MINIMAX_API_KEY or VIDEO_API_KEY is not set")
    return key


def submit_minimax(prompt):
    payload = {
        "model": MINIMAX_MODEL,
        "prompt": prompt[:2000],
        "duration": MINIMAX_DURATION,
        "resolution": MINIMAX_RESOLUTION,
        "prompt_optimizer": True,
        "fast_pretreatment": True,
    }
    data = run_curl_json(
        [
            "-H",
            f"Authorization: Bearer {minimax_key()}",
            "-H",
            "Content-Type: application/json",
            "https://api.minimax.io/v1/video_generation",
        ],
        payload,
        timeout=90,
    )
    base_resp = data.get("base_resp", {})
    if base_resp.get("status_code") not in (None, 0):
        raise RuntimeError(f"MiniMax submit failed: {base_resp}")
    task_id = data.get("task_id")
    if not task_id:
        raise RuntimeError(f"MiniMax submit did not return task_id: {data}")
    return task_id


def wait_minimax(task_id):
    query = f"https://api.minimax.io/v1/query/video_generation?task_id={urllib.parse.quote(task_id)}"
    for _ in range(180):
        data = run_curl_json(["-H", f"Authorization: Bearer {minimax_key()}", query], timeout=60)
        status = data.get("status")
        print(f"  MiniMax status {task_id}: {status}")
        if status == "Success":
            file_id = data.get("file_id")
            if not file_id:
                raise RuntimeError(f"MiniMax success response did not include file_id: {data}")
            return file_id
        if status == "Fail":
            raise RuntimeError(f"MiniMax request failed: {data}")
        time.sleep(10)
    raise TimeoutError(f"Timed out waiting for MiniMax task {task_id}")


def retrieve_minimax_file(file_id):
    query = f"https://api.minimax.io/v1/files/retrieve?file_id={urllib.parse.quote(str(file_id))}"
    data = run_curl_json(["-H", f"Authorization: Bearer {minimax_key()}", query], timeout=60)
    base_resp = data.get("base_resp", {})
    if base_resp.get("status_code") not in (None, 0):
        raise RuntimeError(f"MiniMax retrieve failed: {base_resp}")
    file_info = data.get("file", {})
    download_url = file_info.get("download_url")
    if not download_url:
        raise RuntimeError(f"MiniMax retrieve response did not include download_url: {data}")
    return download_url


def download_with_minimax(slug, prompt):
    target = OUT / f"{slug}.mp4"
    task_id = submit_minimax(prompt)
    update_manifest(slug, {"provider": "minimax", "task_id": task_id, "status": "submitted"})
    file_id = wait_minimax(task_id)
    update_manifest(slug, {"provider": "minimax", "task_id": task_id, "file_id": file_id, "status": "success"})
    video_url = retrieve_minimax_file(file_id)
    ok = download_url(video_url, target)
    update_manifest(slug, {"provider": "minimax", "task_id": task_id, "file_id": file_id, "downloaded": ok, "path": str(target)})
    return ok


def update_manifest(slug, data):
    try:
        current = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    except json.JSONDecodeError:
        current = {}
    current[slug] = {**current.get(slug, {}), **data, "updated_at": int(time.time())}
    MANIFEST.write_text(json.dumps(current, indent=2))


def submit_fal(prompt, seed):
    key = os.environ.get("FAL_KEY") or os.environ.get("VIDEO_API_KEY")
    if not key:
        raise RuntimeError("FAL_KEY or VIDEO_API_KEY is not set")
    payload = {
        "prompt": prompt,
        "aspect_ratio": "16:9",
        "resolution": "480p",
        "num_frames": "85",
        "enable_safety_checker": True,
        "seed": seed,
    }
    data = run_curl_json(
        [
            "-H",
            f"Authorization: Key {key}",
            f"https://queue.fal.run/{FAL_MODEL}",
        ],
        {"input": payload},
    )
    request_id = data.get("request_id") or data.get("requestId")
    if not request_id:
        raise RuntimeError(f"fal submit did not return request id: {data}")
    return request_id


def wait_fal(request_id):
    key = os.environ.get("FAL_KEY") or os.environ["VIDEO_API_KEY"]
    status_url = f"https://queue.fal.run/{FAL_MODEL}/requests/{request_id}/status"
    result_url = f"https://queue.fal.run/{FAL_MODEL}/requests/{request_id}"
    for _ in range(180):
        status = run_curl_json(["-H", f"Authorization: Key {key}", status_url], timeout=60)
        state = status.get("status")
        print(f"  status {request_id}: {state}")
        if state == "COMPLETED":
            return run_curl_json(["-H", f"Authorization: Key {key}", result_url], timeout=60)
        if state in {"FAILED", "ERROR", "CANCELLED"}:
            raise RuntimeError(f"fal request failed: {status}")
        time.sleep(10)
    raise TimeoutError(f"Timed out waiting for {request_id}")


def extract_video_url(result):
    data = result.get("data", result)
    video = data.get("video", {})
    if isinstance(video, dict):
        return video.get("url")
    if isinstance(video, str):
        return video
    return None


def download_url(url, target):
    temp = target.with_suffix(".tmp")
    result = subprocess.run(
        [
            "curl",
            "-L",
            "--fail",
            "--silent",
            "--show-error",
            "--max-time",
            "900",
            "--output",
            str(temp),
            url,
        ],
        check=False,
    )
    if result.returncode != 0:
        temp.unlink(missing_ok=True)
        return False
    if not temp.exists() or temp.stat().st_size < 50_000:
        temp.unlink(missing_ok=True)
        return False
    temp.replace(target)
    return True


def download_with_fal(slug, prompt, seed):
    target = OUT / f"{slug}.mp4"
    request_id = submit_fal(prompt, seed)
    result = wait_fal(request_id)
    video_url = extract_video_url(result)
    if not video_url:
        raise RuntimeError(f"fal result did not include video url: {result}")
    return download_url(video_url, target)


def download_with_pollinations(slug, prompt):
    token = os.environ.get("POLLINATIONS_TOKEN") or os.environ.get("POLLINATIONS_KEY")
    url = pollinations_url(prompt)
    headers = []
    if token:
        headers = ["-H", f"Authorization: Bearer {token}"]
    target = OUT / f"{slug}.mp4"
    temp = OUT / f"{slug}.tmp"
    result = subprocess.run(
        ["curl", "-L", "--fail", "--max-time", "900", "--output", str(temp), *headers, url],
        check=False,
    )
    if result.returncode != 0:
        temp.unlink(missing_ok=True)
        return False
    if not temp.exists() or temp.stat().st_size < 50_000:
        temp.unlink(missing_ok=True)
        return False
    temp.replace(target)
    return True


def main():
    provider = os.environ.get("VIDEO_PROVIDER", "minimax").lower()
    print(json.dumps({
        "provider": provider,
        "fal_model": FAL_MODEL,
        "minimax_model": MINIMAX_MODEL,
        "minimax_resolution": MINIMAX_RESOLUTION,
        "minimax_duration": MINIMAX_DURATION,
        "video_start": VIDEO_START,
        "video_limit": VIDEO_LIMIT or "all",
        "note": "Default provider is MiniMax text-to-video. Put MINIMAX_API_KEY or VIDEO_API_KEY in .env.local before running. fal.ai is still available with VIDEO_PROVIDER=fal.",
        "output": str(OUT),
    }, indent=2))
    games = load_games()
    if VIDEO_START:
        games = games[VIDEO_START:]
    if VIDEO_LIMIT:
        games = games[:VIDEO_LIMIT]
    for index, (slug, prompt) in enumerate(games, start=VIDEO_START):
        target = OUT / f"{slug}.mp4"
        if target.exists() and target.stat().st_size > 50_000:
            print(f"exists {target}")
            continue
        print(f"attempting {slug}")
        try:
            if provider == "minimax":
                ok = download_with_minimax(slug, prompt)
            elif provider == "pollinations":
                ok = download_with_pollinations(slug, prompt)
            else:
                ok = download_with_fal(slug, prompt, 5100 + index)
        except Exception as exc:
            print(f"failed {slug}: {exc}")
            ok = False
        print(f"{'saved' if ok else 'failed'} {slug}")


if __name__ == "__main__":
    main()
