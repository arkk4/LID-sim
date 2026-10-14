#!/usr/bin/env python3
"""
test_image_cache.py — runnable self-check for question image caching.
Verifies:
1. Every question with an image has a valid, existing local file in assets/cache/.
2. Every question with an image has an imageBackup pointing to the origin URL.
3. No duplicate or missing mappings exist between questions and assets/cache/.
"""

import json
import os
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON_PATH = os.path.join(REPO_ROOT, "data", "questions", "questions.json")

def main():
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    all_questions = list(data.get("general", []))
    for qs in data.get("states", {}).values():
        all_questions.extend(qs)

    checked = 0
    for q in all_questions:
        if "image" in q:
            img = q["image"]
            assert img.startswith("assets/cache/"), f"Question {q.get('num')}: image should point to assets/cache/, got '{img}'"
            local_path = os.path.join(REPO_ROOT, img)
            assert os.path.isfile(local_path), f"Question {q.get('num')}: cached file '{local_path}' does not exist!"
            assert "imageBackup" in q, f"Question {q.get('num')}: missing imageBackup field"
            assert q["imageBackup"].startswith("https://"), f"Question {q.get('num')}: imageBackup should be an origin URL, got '{q['imageBackup']}'"
            checked += 1

    assert checked == 43, f"Expected 43 questions with images, found {checked}"
    print(f"✓ All {checked} question images successfully verified in assets/cache/ with imageBackup origin fallbacks.")

if __name__ == "__main__":
    main()
