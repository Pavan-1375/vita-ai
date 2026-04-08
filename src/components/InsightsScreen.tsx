import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './Card';
import { Button } from './Button';
import { Pill, Wind, Droplets, ChevronRight, AlertTriangle, MessageSquare, Sparkles, Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

interface InsightsScreenProps {
  onStartConsult: (voice?: boolean) => void;
}

interface HistoryItem {
  id: string;
  symptoms: string;
  analysis: string;
  timestamp: string;
}

interface InsightData {
  disease: string;
  confidence: number;
  triage: 'low' | 'moderate' | 'high';
  precautions: string[];
  remedies: string[];
}

const defaultInsight: InsightData = {
  disease: 'Not enough recent data',
  confidence: 0,
  triage: 'low',
  precautions: [],
  remedies: [],
};

const parseLatestInsight = (): InsightData => {
  try {
    const raw = localStorage.getItem('consult_history');
    if (!raw) return defaultInsight;
    const history = JSON.parse(raw) as HistoryItem[];
    if (!history.length) return defaultInsight;

    const latest = history[0]?.analysis ?? '';
    const disease = latest.match(/Disease:\s*(.+)/i)?.[1]?.trim() ?? defaultInsight.disease;
    const confidenceRaw = latest.match(/Confidence:\s*([\d.]+)/i)?.[1] ?? '0';
    const triageRaw = latest.match(/Triage:\s*([A-Z]+)/i)?.[1]?.toLowerCase() ?? 'low';
    const triage = (triageRaw === 'high' || triageRaw === 'moderate' ? triageRaw : 'low') as InsightData['triage'];

    const precautionsMatch = latest.match(/Precautions:\s*([\s\S]*?)\n\s*Home Remedies:/i)?.[1] ?? '';
    const remediesMatch = latest.match(/Home Remedies:\s*([\s\S]*?)(\n\s*Urgent Actions:|\n\s*Note:|$)/i)?.[1] ?? '';
    const splitList = (text: string) =>
      text
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

    return {
      disease,
      confidence: Number(confidenceRaw) || 0,
      triage,
      precautions: splitList(precautionsMatch),
      remedies: splitList(remediesMatch),
    };
  } catch {
    return defaultInsight;
  }
};

export const InsightsScreen = ({ onStartConsult }: InsightsScreenProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [insightData, setInsightData] = useState<InsightData>(defaultInsight);

  useEffect(() => {
    setInsightData(parseLatestInsight());
  }, []);

  const riskMeta = useMemo(() => {
    if (insightData.triage === 'high') {
      return { label: 'High', progress: 85, color: 'text-error', bar: 'bg-error' };
    }
    if (insightData.triage === 'moderate') {
      return { label: 'Moderate', progress: 58, color: 'text-tertiary', bar: 'bg-tertiary-fixed' };
    }
    return { label: 'Low', progress: 28, color: 'text-primary', bar: 'bg-primary' };
  }, [insightData.triage]);

  const generateSummary = async () => {
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const topPrecautions = insightData.precautions.slice(0, 3).join(', ') || 'Log more symptoms for better precision';
    const topRemedy = insightData.remedies[0] ?? 'Hydration, rest, and symptom tracking';
    const summary = [
      `Current Pattern: Your latest predicted condition is "${insightData.disease}" with ${Math.round(insightData.confidence)}% confidence and ${riskMeta.label.toLowerCase()} triage.`,
      `Priority Focus: ${topPrecautions}.`,
      `Supportive Care: ${topRemedy}.`,
      'Motivation: Consistent daily tracking improves prediction quality and helps catch meaningful changes earlier.',
    ].join('\n\n');
    setAiSummary(summary);
    setIsGenerating(false);
  };

  const recommendations = [
    {
      id: 'p1',
      title: insightData.precautions[0] ?? 'Log 2-3 clear symptoms',
      description:
        insightData.precautions[0]
          ? 'Primary precaution from your latest analysis.'
          : 'Better symptom specificity improves prediction quality and lowers false alarms.',
      icon: ShieldCheck,
      color: 'text-primary',
    },
    {
      id: 'p2',
      title: insightData.precautions[1] ?? 'Hydrate and monitor changes',
      description:
        insightData.precautions[1]
          ? 'Secondary action recommended by the latest analysis.'
          : 'Track severity every few hours and note any new symptoms.',
      icon: Pill,
      color: 'text-primary',
    },
    {
      id: 'r1',
      title: insightData.remedies[0] ?? '5-minute breathing reset',
      description:
        insightData.remedies[0]
          ? 'Supportive home-care option from your latest prediction.'
          : 'Use a brief calming routine and adequate rest to reduce stress load.',
      icon: Wind,
      color: 'text-primary',
    },
    {
      id: 'r2',
      title: insightData.remedies[1] ?? 'Hydration target',
      description:
        insightData.remedies[1]
          ? 'Additional recovery support from analysis insights.'
          : 'Drink water steadily during the day to support recovery.',
      icon: Droplets,
      color: 'text-primary',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-12"
    >
      <header className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary-container/60">
          Your Health Overview
        </p>
        <h1 className="text-4xl italic font-semibold text-primary">Health Insights</h1>
      </header>

      <div className="grid grid-cols-1 gap-4">
        <Card variant="low" className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-error" size={18} fill="currentColor" />
            <h3 className="text-xs font-bold uppercase tracking-wide">Risk Assessment</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-end mb-1">
                <span className="text-xs font-semibold">Current Health Risk</span>
                <span className={cn('text-xs font-bold', riskMeta.color)}>{riskMeta.label}</span>
              </div>
              <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                <div className={cn('h-full', riskMeta.bar)} style={{ width: `${riskMeta.progress}%` }} />
              </div>
            </div>
            <p className="text-xs text-on-surface-variant italic">
              Based on your latest prediction: <span className="font-bold">{insightData.disease}</span> at{' '}
              <span className="font-bold">{Math.round(insightData.confidence)}%</span> confidence.
            </p>
          </div>
        </Card>
      </div>

      <Card className="bg-primary/5 border-primary/20 border-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary" size={20} />
            <h2 className="text-xl italic font-semibold text-primary">AI Health Report</h2>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={generateSummary}
            disabled={isGenerating}
            className="text-[10px] h-8"
          >
            {isGenerating ? <Loader2 className="animate-spin" size={14} /> : 'Generate Report'}
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {aiSummary ? (
            <motion.div
              key="summary"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap font-headline bg-white/50 p-4 rounded-xl border border-primary/10"
            >
              {aiSummary}
            </motion.div>
          ) : !isGenerating && (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-on-surface-variant italic text-center py-4"
            >
              Click "Generate Report" for a personalized AI analysis of your recent metrics.
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <Card className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl italic font-semibold text-on-surface">Vitality Trend</h2>
          <div className="flex bg-surface-container-low p-1 rounded-full">
            <button className="px-4 py-1 text-[10px] font-bold uppercase bg-white shadow-sm rounded-full text-primary">
              7 Days
            </button>
            <button className="px-4 py-1 text-[10px] font-bold uppercase text-on-surface-variant">
              30 Days
            </button>
          </div>
        </div>

        {(() => {
          const readRecords = (key: string) => {
            try {
              const raw = localStorage.getItem(key);
return raw ? JSON.parse(raw) as any[] : [];
            } catch {
              return [];
            }
          };

          const hydration = readRecords('hydration_records');
          const breathing = readRecords('breathing_records');
          const mood = readRecords('mood_records');
          const sleep = readRecords('sleep_records');
          const history = readRecords('consult_history');

          const now = new Date();
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const days = Array(7).fill(0).map((_, i) => {
            const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);

            const hydCount = hydration.filter(r => new Date(r.completedAt) > dayStart && new Date(r.completedAt) < dayEnd).length;
            const breathAvg = breathing.filter(r => new Date(r.completedAt) > dayStart && new Date(r.completedAt) < dayEnd).reduce((sum, r) => sum + (r.rounds || 0), 0) / Math.max(1, breathing.length);
            const moodAvg = mood.filter(r => new Date(r.completedAt) > dayStart && new Date(r.completedAt) < dayEnd).reduce((sum, r) => sum + (r.mood === 'happy' ? 100 : r.mood === 'neutral' ? 50 : 0), 0) / Math.max(1, mood.length);
            const sleepAvg = sleep.filter(r => new Date(r.completedAt) > dayStart && new Date(r.completedAt) < dayEnd).reduce((sum, r) => sum + (r.hours * 10 + (r.quality === 'good' ? 30 : r.quality === 'okay' ? 15 : 0)), 0) / Math.max(1, sleep.length);
            const consultScore = history.filter(r => new Date(r.timestamp) > dayStart && new Date(r.timestamp) < dayEnd).reduce((sum, _) => sum + 30, 0) / Math.max(1, history.length * 2);

            return Math.min(100, Math.round(hydCount * 20 + breathAvg * 10 + moodAvg * 0.2 + sleepAvg + consultScore));
          }).reverse();

          const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
          const peakIndex = days.indexOf(Math.max(...days));
          const hasData = days.some(d => d > 0);

          return (
            <>
              <div className="h-48 flex items-end justify-between gap-2 px-2">
                {days.map((height, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                    <div
                      className={cn(
                        'w-full rounded-t-lg transition-all duration-500',
                        i === peakIndex ? 'brand-gradient shadow-lg' : 'bg-primary/20 group-hover:bg-primary/40'
                      )}
                      style={{ height: `${height}%` }}
                    />
                    <span className={cn('text-[10px] font-bold', i === peakIndex ? 'text-primary' : 'text-on-surface-variant')}>
                      {dayNames[i]}
                    </span>
                  </div>
                ))}
              </div>
              {hasData ? (
                <div className="pt-4 text-center">
                  <p className="text-sm text-on-surface-variant">
                    Vitality peak: <span className="text-primary font-bold">{dayNames[peakIndex]}</span> ({Math.max(...days).toFixed(0)}%)
                  </p>
                </div>
              ) : (
                <div className="pt-4 text-center">
                  <p className="text-sm text-on-surface-variant">
                    Log hydration, breathing, mood & sleep for trends!
                  </p>
                </div>
              )}
            </>
          );
        })()}

      </Card>

      <section className="space-y-6">
        <h2 className="text-2xl italic font-semibold text-on-surface">Recommendations</h2>
        <div className="grid grid-cols-1 gap-4">
            {recommendations.map((rec) => {
              const Icon = rec.icon;
              return (
                <div
                  key={rec.id}
                  className="flex items-center gap-6 p-4 bg-surface-container-low rounded-xl hover:bg-surface-container-lowest hover:shadow-md transition-all cursor-pointer"
                  onClick={() => {
                    navigator.clipboard.writeText(`${rec.title}\n\n${rec.description}`);
                  }}
                >
                  <div className="w-12 h-12 flex-shrink-0 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Icon className={rec.color} size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-on-surface">{rec.title}</h4>
                    <p className="text-xs text-on-surface-variant">{rec.description}</p>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-primary bg-white rounded-full px-3 py-1.5 border border-primary/10 cursor-default">
                    Applied
                  </div>
                  <ChevronRight className="text-outline-variant group-hover:text-primary transition-colors" size={20} />
                </div>
              );
            })}
        </div>
      </section>

      <section className="pt-8 pb-12">
        <Button className="w-full flex items-center justify-center gap-3" onClick={() => onStartConsult(false)}>
          <MessageSquare size={18} fill="currentColor" />
          Start Consultation
        </Button>
        <p className="text-[10px] text-center text-on-surface-variant mt-4 opacity-60">
          AI health insights are for informational purposes only. Always consult a professional.
        </p>
      </section>
    </motion.div>
  );
};
