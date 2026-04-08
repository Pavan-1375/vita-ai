import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Card } from './Card';
import { Button } from './Button';
import { Droplets, Wind, AlertTriangle, ChevronRight, Mic, Sparkles, Heart, RotateCcw, Play, Pause, CheckCircle2 } from 'lucide-react';

interface HomeScreenProps {
  onStartConsult: (voice?: boolean) => void;
  key?: string;
}

interface HydrationRecord {
  id: string;
  completedAt: string;
}

interface BreathingRecord {
  id: string;
  completedAt: string;
  rounds: number;
}

interface MoodRecord {
  id: string;
  mood: 'happy' | 'neutral' | 'low';
  note?: string;
  completedAt: string;
}

interface SleepRecord {
  id: string;
  hours: number;
  quality: 'good' | 'okay' | 'poor';
  completedAt: string;
}
const readStoredArray = <T,>(key: string): T[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

const BREATHING_SEQUENCE: Array<{ phase: 'inhale' | 'hold' | 'exhale'; duration: number }> = [
  { phase: 'inhale', duration: 4 },
  { phase: 'hold', duration: 4 },
  { phase: 'exhale', duration: 6 },
];

export const HomeScreen = ({ onStartConsult }: HomeScreenProps) => {
  const [hydrationMl, setHydrationMl] = useState(1200);
  const [precautionIndex, setPrecautionIndex] = useState(0);
  const [isBreathingRunning, setIsBreathingRunning] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>(BREATHING_SEQUENCE[0].phase);
  const [breathSecondsLeft, setBreathSecondsLeft] = useState(BREATHING_SEQUENCE[0].duration);
  const [breathingRounds, setBreathingRounds] = useState(0);

  const [hydrationRecords, setHydrationRecords] = useState<HydrationRecord[]>(() =>
    readStoredArray<HydrationRecord>('hydration_records')
  );

  const [breathingRecords, setBreathingRecords] = useState<BreathingRecord[]>(() =>
    readStoredArray<BreathingRecord>('breathing_records')
  );

  const [moodRecords, setMoodRecords] = useState<MoodRecord[]>(() =>
    readStoredArray<MoodRecord>('mood_records')
  );

  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>(() =>
    readStoredArray<SleepRecord>('sleep_records')
  );

  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [showSleepInput, setShowSleepInput] = useState(false);
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState<'good' | 'okay' | 'poor'>('okay');
  const [moodNote, setMoodNote] = useState('');

  const safetyPrecautions = [
    {
      condition: 'That random throat scratch at 2 AM',
      precaution: 'Warm water mode on, skip ice-cold chaos, and let your throat chill.',
      icon: AlertTriangle,
    },
    {
      condition: 'Mild headache + low energy combo',
      precaution: 'Hydrate first, snack a little, then take a short no-screen breather.',
      icon: Heart,
    },
    {
      condition: 'Stuffy nose / mini cold vibes',
      precaution: "Steam, warm fluids, and don't pretend 4 hours sleep is enough.",
      icon: Wind,
    },
    {
      condition: 'Tummy feels sus after spicy food',
      precaution: 'Go easy on meals, sip water slowly, and avoid spicy round 2.',
      icon: Droplets,
    },
  ];

  useEffect(() => {
    const precautionTimer = window.setInterval(() => {
      setPrecautionIndex((prev) => (prev + 1) % safetyPrecautions.length);
    }, 5000);
    return () => window.clearInterval(precautionTimer);
  }, [safetyPrecautions.length]);

  useEffect(() => {
    localStorage.setItem('hydration_records', JSON.stringify(hydrationRecords));
  }, [hydrationRecords]);

useEffect(() => {
    localStorage.setItem('breathing_records', JSON.stringify(breathingRecords));
  }, [breathingRecords]);

  useEffect(() => {
    localStorage.setItem('mood_records', JSON.stringify(moodRecords));
  }, [moodRecords]);

  useEffect(() => {
    localStorage.setItem('sleep_records', JSON.stringify(sleepRecords));
  }, [sleepRecords]);

  useEffect(() => {
    if (!isBreathingRunning) return;
    const timer = window.setInterval(() => {
      setBreathSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;

        let nextDuration = BREATHING_SEQUENCE[0].duration;
        setBreathPhase((current) => {
          const currentIndex = BREATHING_SEQUENCE.findIndex((item) => item.phase === current);
          const nextIndex = (currentIndex + 1) % BREATHING_SEQUENCE.length;
          const nextPhase = BREATHING_SEQUENCE[nextIndex].phase;
          nextDuration = BREATHING_SEQUENCE[nextIndex].duration;
          if (current === 'exhale') {
            setBreathingRounds((rounds) => rounds + 1);
          }
          return nextPhase;
        });
        return nextDuration;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isBreathingRunning]);

  const activePrecaution = safetyPrecautions[precautionIndex];
  const nextPrecaution = safetyPrecautions[(precautionIndex + 1) % safetyPrecautions.length];
  const ActivePrecautionIcon = activePrecaution.icon;
  const hydrationGoal = 2500;
  const hydrationPercent = Math.min(100, Math.round((hydrationMl / hydrationGoal) * 100));
  const completedTodayCount = hydrationRecords.filter((record) => {
    const today = new Date();
    const recordDate = new Date(record.completedAt);
    return (
      today.getFullYear() === recordDate.getFullYear() &&
      today.getMonth() === recordDate.getMonth() &&
      today.getDate() === recordDate.getDate()
    );
  }).length;

  const logHydration = () => {
    const nextMl = Math.min(hydrationGoal, hydrationMl + 250);
    if (nextMl >= hydrationGoal) {
      const now = new Date();
      const newRecord: HydrationRecord = {
        id: `${now.getTime()}`,
        completedAt: now.toISOString(),
      };
      setHydrationRecords((prev) => [newRecord, ...prev].slice(0, 8));
      setHydrationMl(0);
      return;
    }
    setHydrationMl(nextMl);
  };

  const finishBreathingSession = () => {
    if (breathingRounds > 0) {
      const now = new Date();
      const newRecord: BreathingRecord = {
        id: `${now.getTime()}`,
        completedAt: now.toISOString(),
        rounds: breathingRounds,
      };
      setBreathingRecords((prev) => [newRecord, ...prev].slice(0, 8));
    }
    setIsBreathingRunning(false);
    setBreathPhase(BREATHING_SEQUENCE[0].phase);
    setBreathSecondsLeft(BREATHING_SEQUENCE[0].duration);
    setBreathingRounds(0);
  };

  const resetBreathing = () => {
    setIsBreathingRunning(false);
    setBreathPhase(BREATHING_SEQUENCE[0].phase);
    setBreathSecondsLeft(BREATHING_SEQUENCE[0].duration);
    setBreathingRounds(0);
  };

  const breathingPhaseTheme =
    breathPhase === 'inhale'
      ? {
          card: 'bg-emerald-100/90 border-emerald-200',
          orb: 'bg-emerald-300/50 border-emerald-400/60',
          label: 'text-emerald-800',
        }
      : breathPhase === 'hold'
      ? {
          card: 'bg-amber-100/90 border-amber-200',
          orb: 'bg-amber-300/50 border-amber-400/60',
          label: 'text-amber-800',
        }
      : {
          card: 'bg-sky-100/90 border-sky-200',
          orb: 'bg-sky-300/50 border-sky-400/60',
          label: 'text-sky-800',
        };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-10 pb-12"
    >
      <section>
        <div className="relative overflow-hidden p-8 rounded-3xl brand-gradient text-white shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
          <h2 className="text-3xl font-bold mb-3 leading-tight italic">Health Forecast</h2>
          <p className="text-white/90 text-lg font-medium">
            Today your body says: "I need water, a nap, and absolutely no drama."
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6 bg-surface-container-low border-2 border-primary/10 h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="text-primary" size={20} />
            </div>
            <h3 className="font-bold text-primary">AI Prediction Hub</h3>
          </div>
          <p className="text-sm text-on-surface-variant mb-6">
            Drop your symptoms, catch the vibe check for your body, and get smart precautions before things get messy.
          </p>
          <Button onClick={() => onStartConsult(false)} className="w-full flex items-center justify-center gap-2">
            Analyze Symptoms <ChevronRight size={18} />
          </Button>
        </Card>

        <Card className="p-5 bg-surface-container-low border border-outline-variant/10 h-full min-h-[220px]">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="text-xl font-bold italic">Safety Precautions</h3>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Live (5s)</span>
          </div>

          <div className="flex items-start gap-4">
            <div className="mt-1 w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
              <ActivePrecautionIcon size={20} />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-on-surface text-sm mb-0.5">
                Safety Precaution For: {activePrecaution.condition}
              </div>
              <p className="text-sm text-on-surface-variant opacity-90 leading-relaxed">
                {activePrecaution.precaution}
              </p>

              <div className="mt-4 rounded-xl border border-primary/15 bg-white/70 px-3 py-2">
                <p className="text-xs text-on-surface-variant">
                  Quick tip: if symptoms spike, last more than 24h, or feel unusual, get a real doctor check.
                </p>
              </div>

              <p className="mt-3 text-[11px] font-semibold text-primary/80">
                Up Next: {nextPrecaution.condition}
              </p>
            </div>
          </div>
        </Card>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      <section className="xl:col-span-8">
        <h3 className="text-xl font-bold italic mb-4 px-1">Recommended Actions</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-2">
          <Card className="p-6 flex flex-col justify-between min-h-[290px]">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Droplets className="text-primary" size={24} fill="currentColor" />
            </div>
            <div>
              <div className="font-bold text-lg mb-2 leading-tight">Hydration Glow-Up</div>
              <p className="text-sm text-on-surface-variant mb-4">
                Tiny sips, big aura. You are at {(hydrationMl / 1000).toFixed(2)}L of your 2.5L goal ({hydrationPercent}%).
              </p>
              <Button variant="secondary" size="sm" className="w-full" onClick={logHydration}>
                {hydrationMl >= hydrationGoal - 250 ? 'Hit Goal + Reset' : 'Log +250ml'}
              </Button>
            </div>
          </Card>

          <Card className="p-5 flex flex-col justify-between min-h-[290px]">
            <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center mb-3">
              <Wind className="text-tertiary" size={24} fill="currentColor" />
            </div>
            <div>
              <div className="font-bold text-lg mb-1 leading-tight">Breathing Reset</div>
              <p className="text-[12px] text-on-surface-variant mb-3">
                Compact flow: Inhale 4s, Hold 4s, Exhale 6s.
              </p>
            </div>

            <div className={`rounded-xl border p-3 ${breathingPhaseTheme.card}`}>
              <div className="flex items-center gap-3 mb-2">
                <motion.div
                  className={`w-12 h-12 rounded-full border ${breathingPhaseTheme.orb}`}
                  animate={{ scale: isBreathingRunning ? (breathPhase === 'inhale' ? 1.2 : breathPhase === 'hold' ? 1.2 : 0.78) : 1 }}
                  transition={{ duration: breathPhase === 'exhale' ? 6 : 4, ease: 'easeInOut' }}
                />
                <div>
                  <div className={`text-xs font-bold ${breathingPhaseTheme.label}`}>
                    {breathPhase.toUpperCase()}
                  </div>
                  <div className="text-sm font-semibold text-on-surface">{breathSecondsLeft}s</div>
                </div>
              </div>
              <p className="text-[10px] text-on-surface-variant/80 mb-2">
                {breathPhase === 'inhale' ? 'Fill lungs slowly.' : breathPhase === 'hold' ? 'Stay steady, no strain.' : 'Release gently and fully.'}
              </p>
              <div className="flex gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full flex items-center justify-center"
                  onClick={() => setIsBreathingRunning((prev) => !prev)}
                >
                  {isBreathingRunning ? <Pause size={14} /> : <Play size={14} />}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full flex items-center justify-center"
                  onClick={resetBreathing}
                >
                  <RotateCcw size={14} />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full flex items-center justify-center gap-1.5"
                  onClick={finishBreathingSession}
                >
                  <CheckCircle2 size={14} />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="xl:col-span-4 pt-0">
        <h3 className="text-xl font-bold italic mb-4 px-1">Wellness Tracker</h3>
        <Card className="p-5 bg-surface-container-low border border-primary/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest font-bold text-primary/70">Hydration Wins Today</div>
              <div className="text-3xl font-bold text-primary">{completedTodayCount}</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-widest font-bold text-on-surface-variant/70">Current Vibe Fuel</div>
              <div className="text-lg font-bold text-on-surface">{(hydrationMl / 1000).toFixed(2)}L / 2.5L</div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-outline-variant/10 pt-3">
            <div>
              <div className="text-xs uppercase tracking-widest font-bold text-primary/70">Breathing Sessions</div>
              <div className="text-2xl font-bold text-primary">{breathingRecords.length}</div>
            </div>
            <div className="text-right text-xs text-on-surface-variant">
              Last calm streak: {breathingRecords[0]?.rounds ?? 0} rounds
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="w-full text-xs"
            onClick={() => setShowMoodPicker(true)}
          >
            Log Mood Today
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="w-full text-xs"
            onClick={() => setShowSleepInput(true)}
          >
            Log Sleep
          </Button>

          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/70 mb-2">
              Recent Activity
            </div>
            {hydrationRecords.length === 0 && breathingRecords.length === 0 ? (
              <p className="text-xs text-on-surface-variant">No tracker activity yet. Start small, stack wins, stay iconic.</p>
            ) : (
              <div className="space-y-1.5">
                {hydrationRecords.slice(0, 3).map((record) => (
                  <div key={record.id} className="text-xs text-on-surface-variant">
                    Hydration goal hit at {new Date(record.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                ))}
                {breathingRecords.slice(0, 2).map((record) => (
                  <div key={record.id} className="text-xs text-on-surface-variant">
                    Breathing session saved ({record.rounds} rounds) at {new Date(record.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                ))}
              </div>
            )}
          </div>
          {showMoodPicker && (
            <Card className="space-y-3 p-4">
              <h4 className="text-sm font-bold">Today's Mood</h4>
              <div className="flex gap-2">
                {(['happy', 'neutral', 'low'] as const).map((mood) => (
                  <button
                    key={mood}
                    className={
                      mood === 'happy' ? 'flex-1 p-3 rounded-xl font-bold text-sm bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-all' :
                      mood === 'neutral' ? 'flex-1 p-3 rounded-xl font-bold text-sm bg-amber-100 text-amber-800 hover:bg-amber-200 transition-all' :
                      'flex-1 p-3 rounded-xl font-bold text-sm bg-red-100 text-red-800 hover:bg-red-200 transition-all'
                    }
                    onClick={() => {
                      const now = new Date();
                      const newRecord: MoodRecord = {
                        id: now.getTime().toString(),
                        mood,
                        completedAt: now.toISOString(),
                      };
                      setMoodRecords(prev => [newRecord, ...prev].slice(0, 30));
                      setShowMoodPicker(false);
                    }}
                  >
                    {mood === 'happy' ? '😊 Great' : mood === 'neutral' ? '😐 Okay' : '😞 Low'}
                  </button>
                  ))}
                </div>
              <input
                type="text"
                placeholder="Optional note"
                value={moodNote}
                onChange={(e) => setMoodNote(e.target.value)}
                className="w-full p-2 text-xs border rounded-lg"
                maxLength={50}
              />
              <Button variant="secondary" className="w-full text-xs" onClick={() => setShowMoodPicker(false)}>
                Cancel
              </Button>
            </Card>
          )}

          {showSleepInput && (
            <Card className="space-y-3 p-4">
              <h4 className="text-sm font-bold">Last Night's Sleep</h4>
              <div>
                <label className="text-xs block mb-1">Hours Slept</label>
                <input
                  type="number"
                  min="0"
                  max="14"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(Math.max(0, Math.min(14, Number(e.target.value))))}
                  className="w-full p-3 text-sm border rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs block mb-1">Quality</label>
                <select
                  value={sleepQuality}
                  onChange={(e) => setSleepQuality(e.target.value as 'good' | 'okay' | 'poor')}
                  className="w-full p-3 text-sm border rounded-lg"
                >
                  <option value="good">Restful</option>
                  <option value="okay">Average</option>
                  <option value="poor">Restless</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 text-xs"
                onClick={() => {
                  const now = new Date();
                  const newRecord: SleepRecord = {
                    id: now.getTime().toString(),
                    hours: sleepHours,
                    quality: sleepQuality,
                    completedAt: now.toISOString(),
                  };
                  setSleepRecords(prev => [newRecord, ...prev].slice(0, 30));
                  setShowSleepInput(false);
                  setSleepHours(7);
                }}
                >
                  Save
                </Button>
                <Button variant="secondary" className="flex-1 text-xs" onClick={() => setShowSleepInput(false)}>
                  Cancel
                </Button>
              </div>
            </Card>
          )}
        </Card>
      </section>
      </div>

      <div className="fixed bottom-28 lg:bottom-8 left-1/2 -translate-x-1/2 lg:left-auto lg:right-10 lg:translate-x-0 z-50">
        <button
          onClick={() => onStartConsult(true)}
          className="flex items-center justify-center w-16 h-16 rounded-full brand-gradient text-white shadow-2xl shadow-primary/30 ring-4 ring-white/80 active:scale-90 transition-transform duration-150"
        >
          <Mic size={28} fill="currentColor" />
        </button>
      </div>
    </motion.div>
  );
};

