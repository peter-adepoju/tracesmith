"""Find and verify YouTube videos for lesson topics.

Searches YouTube, pulls candidate videos out of the server-rendered JSON, then
confirms each one really exists through the public oEmbed endpoint. Only videos
that oEmbed resolves are printed, so nothing invented reaches a lesson.

    python -I scripts/find-videos.py "topic one" "topic two"
"""

import json
import re
import sys
import urllib.parse
import urllib.request

# Windows consoles default to cp1252, which cannot print the emoji that appear
# in plenty of video titles. Force UTF-8 so a title never crashes the run.
for stream in (sys.stdout, sys.stderr):
    try:
        stream.reconfigure(encoding="utf-8", errors="replace")
    except AttributeError:
        pass

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", "replace")


def search(query, limit=6):
    """Return candidate videos from YouTube's search results HTML."""
    url = "https://www.youtube.com/results?search_query=" + urllib.parse.quote(query)
    html = get(url)
    match = re.search(r"var ytInitialData = (\{.*?\});</script>", html)
    if not match:
        return []
    data = json.loads(match.group(1))
    out, seen = [], set()

    def walk(node):
        if len(out) >= limit:
            return
        if isinstance(node, dict):
            vr = node.get("videoRenderer")
            if isinstance(vr, dict):
                vid = vr.get("videoId")
                title = ""
                runs = vr.get("title", {}).get("runs") or []
                if runs:
                    title = runs[0].get("text", "")
                channel = ""
                owner = vr.get("ownerText", {}).get("runs") or []
                if owner:
                    channel = owner[0].get("text", "")
                length = vr.get("lengthText", {}).get("simpleText", "")
                views = vr.get("viewCountText", {}).get("simpleText", "")
                if vid and vid not in seen:
                    seen.add(vid)
                    out.append(
                        {
                            "id": vid,
                            "title": title,
                            "channel": channel,
                            "length": length,
                            "views": views,
                        }
                    )
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    walk(data)
    return out


def verify(video_id):
    """Confirm a video exists. Returns its canonical title and author, or None."""
    url = (
        "https://www.youtube.com/oembed?url="
        + urllib.parse.quote(f"https://www.youtube.com/watch?v={video_id}", safe="")
        + "&format=json"
    )
    try:
        info = json.loads(get(url))
    except Exception:
        return None
    return {"title": info.get("title", ""), "author": info.get("author_name", "")}


def main(queries):
    for query in queries:
        print(f"\n=== {query}")
        try:
            candidates = search(query)
        except Exception as exc:
            print(f"  search failed: {exc}")
            continue
        if not candidates:
            print("  no candidates")
            continue
        for cand in candidates:
            ok = verify(cand["id"])
            if not ok:
                continue
            print(
                f"  {cand['id']}  {cand['length']:>8}  {cand['views']:>16}  "
                f"{ok['author'][:28]:<28}  {ok['title'][:70]}"
            )


if __name__ == "__main__":
    main(sys.argv[1:] or ["http status codes explained"])
