# Agent-testing

A minimal Flask sample application.

## Setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
python app.py
```

The app runs at http://localhost:5000

## Routes

- `/` — welcome page
- `/health` — returns `{"status": "ok"}`
