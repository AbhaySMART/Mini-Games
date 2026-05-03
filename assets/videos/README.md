# Videos

Each game page includes a playable animated preview in the video area.
When a matching MP4 exists in this folder, the page automatically uses it instead.

Filename format:

`compliment-castle.mp4`

To generate videos with the local tool:

1. Copy `.env.example` to `.env.local`.
2. Put your MiniMax API key in `.env.local` as `MINIMAX_API_KEY`.
3. Run:

```bash
python3 tools/download_game_videos.py
```

Keep real API keys out of browser JavaScript files.

The generator uses MiniMax text-to-video by default:

- Create task: `POST https://api.minimax.io/v1/video_generation`
- Poll task: `GET https://api.minimax.io/v1/query/video_generation?task_id=...`
- Retrieve download URL: `GET https://api.minimax.io/v1/files/retrieve?file_id=...`
