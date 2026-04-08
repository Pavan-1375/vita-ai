# Vitality Trend Improvement

**Problem**: Static hardcoded bars, no real data.

**Plan**:
**Information Gathered**: InsightsScreen.tsx hardcoded [40,55,75,90,60,45,30], "peak Thursday".

**New Feature**: **Real 7-day Wellness Score Trend** from localStorage:
- Data: Hydration records + breathing rounds + consult confidence.
- Score/day: (hydration count * 20) + (avg breathing rounds * 10) + (consult confidence/10).
- Bars: Real heights (0-100).
- Peak day highlight.
- Empty → "Start tracking for trends".

**Code Plan** (InsightsScreen.tsx):
1. parseHistory + hydration/breathing records → 7-day scores.
2. Dynamic bars array from scores.
3. Highlight max day.
4. "No data" placeholder.

**Benefits**: Functional, personal, motivates tracking.

**Plan** (User approved "all"):
- Real trend from hydration/breathing/consults.
- **New**: Mood (emoji), Sleep (hours) trackers in HomeScreen.
- Score: Hydration(20) + Breathing(10) + Mood(20) + Sleep(30) + Consult(20).

**Steps**:
- [ ] Edit HomeScreen: Add mood/sleep localStorage logs.
- [ ] Edit InsightsScreen: parse all data → dynamic 7-day bars.
- [ ] Test
- [ ] Complete

