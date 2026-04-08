import argparse
import os
import subprocess
import sys
import time
from pathlib import Path
from typing import Dict


WATCH_EXTENSIONS = {".py", ".json", ".yaml", ".yml", ".env"}
IGNORE_DIRS = {"__pycache__", ".git", ".venv", "venv", "node_modules"}


def snapshot(directory: Path) -> Dict[str, float]:
    state: Dict[str, float] = {}
    for root, dirs, files in os.walk(directory):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for file_name in files:
            file_path = Path(root) / file_name
            if file_path.suffix.lower() not in WATCH_EXTENSIONS:
                continue
            try:
                state[str(file_path)] = file_path.stat().st_mtime
            except OSError:
                continue
    return state


def has_changed(prev: Dict[str, float], current: Dict[str, float]) -> bool:
    if prev.keys() != current.keys():
        return True
    for path, mtime in current.items():
        if prev.get(path) != mtime:
            return True
    return False


def spawn(command: str, cwd: Path) -> subprocess.Popen:
    return subprocess.Popen(command, shell=True, cwd=str(cwd))


def main() -> int:
    parser = argparse.ArgumentParser(description="Simple backend auto-restart watcher.")
    parser.add_argument("--dir", required=True, help="Backend directory to watch")
    parser.add_argument("--cmd", required=True, help="Backend command to run")
    parser.add_argument("--interval", type=float, default=1.0, help="Polling interval seconds")
    args = parser.parse_args()

    watch_dir = Path(args.dir).resolve()
    if not watch_dir.exists():
      print(f"[backend-runner] Watch directory not found: {watch_dir}", file=sys.stderr)
      return 1

    print(f"[backend-runner] Watching: {watch_dir}")
    print(f"[backend-runner] Command: {args.cmd}")
    proc = spawn(args.cmd, watch_dir)
    prev_state = snapshot(watch_dir)

    try:
        while True:
            time.sleep(args.interval)
            current_state = snapshot(watch_dir)
            if has_changed(prev_state, current_state):
                print("[backend-runner] Change detected, restarting backend...")
                if proc.poll() is None:
                    proc.terminate()
                    try:
                        proc.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        proc.kill()
                proc = spawn(args.cmd, watch_dir)
                prev_state = current_state
                continue

            if proc.poll() is not None:
                print("[backend-runner] Backend exited, restarting...")
                proc = spawn(args.cmd, watch_dir)
                prev_state = current_state
    except KeyboardInterrupt:
        print("[backend-runner] Stopping watcher...")
        if proc.poll() is None:
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

