# YouOkay? Health PWA - Presentation Script

## Slide 1: Intro
**"Hi everyone! Today I'll demo YouOkay? - your pocket health companion."**

"YouOkay? is a **Progressive Web App (PWA)** that helps track wellness, analyze symptoms, and get safe recommendations. **No doctor replacement** - think daily health journal with AI insights."

**Key Screens**: Home (trackers), Consult (AI analysis), Insights (trends/recs).

## Slide 2: Tech Stack
**"Modern web stack for speed & offline."**
```
Frontend: React 19 + Vite + Tailwind + PWA
Backend: Python FastAPI + ML Model + Gemini AI
Connection: Vite proxy /api → backend:5000
Data: localStorage (offline trackers/history)
```

**Run**: `npm run dev:all` → auto-stack + browser.

## Slide 3: Architecture
**"Frontend-heavy with smart backend."**
```
User: localhost:3000 (PWA)
  ↓ Home trackers → localStorage
  ↓ Consult symptoms
    → Local fallback (9 cases)
    → /api/predict (ML) OR /api/claude (Gemini)
    → JSON: Disease/Conf/Triage/Precautions/Remedies
    → Save history
  ↓ Insights: Parse history → trends/recs (clipboard)
```

**Models**:
- **ML**: Symptom dataset → predictions
- **Gemini**: Reasoning fallback
- **localStorage**: Trends (7d weighted: sleep 40%, mood 20%...)

## Slide 4: Home Screen Demo
**Live demo**:
- Hydration (2.5L goal)
- Breathing timer (4-4-6)
- Mood picker (😊/😐/😞)
- Sleep log (hours + quality)
- Rotating tips ("throat scratch? Warm water")

**Data → Insights trends.**

## Slide 5: Consult - AI Core
**"Voice/text symptoms → instant analysis."**
```
"headache fever" → 
Disease: Tension Headache (70%)
Triage: Low
Precautions: Rest dark room, hydrate
Remedies: Compress, massage, sleep
Urgent: Worst ever? → ER
```

**Safe**: No pharma, lifestyle remedies.
**Voice**: Web Speech API.
**Fallbacks**: Local/ML/AI.

## Slide 6: Insights - Trends & Recs
**"See patterns, get actions."**
- **Risk Bar**: Triage/confidence
- **Vitality Trend**: 7d chart (sleep/mood/hydrate...)
- **Recs**: From history, click → clipboard copy
- **Report**: AI summary

**No consult redirect** - actionable.

## Slide 7: Safety & PWA
**"Safe + installable."**
- **Disclaimers** everywhere ("not diagnosis").
- **Offline**: Trackers/local remedies.
- **PWA**: Install, app-window, SW cache.
- **Clipboard recs**: Easy notes/actions.

## Slide 8: Run & Deploy
**Demo** `npm run dev:all`
```
Backend: hackathon/api.py (FastAPI:5000)
Frontend: vite:3000 (proxy)
Gemini: .env key
Build: npm run build → static host
```

## Slide 9: Why Great?
**"Personal health OS."**
- Daily tracking → trends
- Symptom AI → safe first steps
- Voice → hands-free
- Offline → always ready
- Clipboard → instant action

**Q&A**

---

**Print this Markdown → PDF** for slides!
```
pandoc PRESENTATION.md -o presentation.pdf
```

