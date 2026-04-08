import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './Card';
import { Button } from './Button';
import { Leaf, Coffee, Moon, Sun, Wind, Heart, Sparkles, ChevronRight, Info, Search, Loader2 } from 'lucide-react';
import { apiUrl } from '../lib/api';

export const RemediesScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [aiRemedy, setAiRemedy] = useState<string | null>(null);
  const [displayedRemedies, setDisplayedRemedies] = useState<number[]>([0, 1]);
  const [displayedTips, setDisplayedTips] = useState<number[]>([0, 1]);

  const remedyKnowledgeBase: Array<{
    keywords: string[];
    name: string;
    use: string;
    why: string;
  }> = [
    {
      keywords: ['headache', 'migraine'],
      name: 'Peppermint + Hydration Reset',
      use: 'Drink water, rest in a dark room, and apply diluted peppermint oil to temples for 10-15 minutes.',
      why: 'Hydration and muscle relaxation can reduce tension-type headache intensity.',
    },
    {
      keywords: ['cough', 'throat', 'sore throat'],
      name: 'Honey Lemon Warm Drink',
      use: 'Mix 1 tsp honey and a few drops of lemon in warm (not boiling) water, sip slowly 2-3 times daily.',
      why: 'Honey can soothe throat irritation while warm fluids reduce dryness.',
    },
    {
      keywords: ['nausea', 'vomit'],
      name: 'Ginger Tea in Small Sips',
      use: 'Steep fresh ginger in hot water for 5-7 minutes and take small sips every 15-20 minutes.',
      why: 'Ginger may support gastric comfort and reduce mild nausea.',
    },
    {
      keywords: ['cold', 'congestion', 'stuffy', 'sinus'],
      name: 'Steam Inhalation + Warm Fluids',
      use: 'Inhale steam for 5-8 minutes and maintain warm fluid intake through the day.',
      why: 'Steam helps loosen mucus and supports easier breathing.',
    },
    {
      keywords: ['sleep', 'insomnia', 'stress', 'anxiety'],
      name: 'Lavender Wind-Down Routine',
      use: 'Reduce screen light 1 hour before bed, use lavender aroma, and do 4-7-8 breathing for 5 cycles.',
      why: 'A calming routine can reduce arousal and improve sleep onset.',
    },
    {
      keywords: ['burn', 'minor burn'],
      name: 'Cool Water First Aid',
      use: 'Hold under cool running water for 10-20 minutes and keep the area clean and covered.',
      why: 'Immediate cooling can reduce tissue stress in minor burns.',
    },
  ];

  const findRemedy = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const query = searchQuery.toLowerCase().trim();
      let finalText: string | null = null;

      // Primary path: backend AI response with strict safety prompt.
      try {
        const aiRes = await fetch(apiUrl('/claude'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_prompt:
              'You are a conservative health assistant. Provide only low-risk, evidence-informed home-care suggestions. ' +
              'Do not diagnose. Avoid unsafe claims. Keep advice practical and concise. ' +
              'Always include red-flag signs and when to seek urgent medical care.',
            messages: [
              {
                role: 'user',
                content:
                  `Symptom query: "${query}"\n\n` +
                  'Return exactly in this format:\n' +
                  '1) Practical remedy (1-2 options)\n' +
                  '2) How to do it (step-by-step)\n' +
                  '3) Why this is evidence-informed (brief)\n' +
                  '4) What to avoid\n' +
                  '5) Red flags: seek doctor/ER when...\n' +
                  'Use plain language and avoid overpromising.',
              },
            ],
          }),
        });

        if (aiRes.ok) {
          const aiData = (await aiRes.json()) as { reply?: string };
          if (aiData.reply?.trim()) {
            finalText = aiData.reply.trim();
          }
        }
      } catch {
        // If backend AI is unavailable, fallback below.
      }

      // Fallback path: local safe templates so feature always works.
      if (!finalText) {
        const match = remedyKnowledgeBase.find((item) =>
          item.keywords.some((keyword) => query.includes(keyword))
        );

        await new Promise((resolve) => setTimeout(resolve, 350));

        if (match) {
          finalText = [
            `Practical remedy: ${match.name}`,
            '',
            'How to do it:',
            match.use,
            '',
            'Why this is evidence-informed:',
            match.why,
            '',
            'What to avoid:',
            'Avoid self-medicating with new medicines without clinical advice.',
            '',
            // Red flags removed per request
          ].join('\n');
        } else {
          finalText = [
            'I could not confidently match that symptom to a safe home-care template.',
            '',
            'Try a clearer symptom phrase like:',
            '- sore throat',
            '- nausea',
            '- headache',
            '- congestion',
            '',
            'If symptoms are intense or unusual, please consult a medical professional promptly.',
          ].join('\n');
        }
      }

      setAiRemedy(finalText);
    } catch (error) {
      console.error('Failed to find remedy:', error);
      setAiRemedy('Unable to find a remedy right now. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const remedies = [
    {
      title: 'Ginger Tea for Nausea',
      description: 'A natural way to soothe the stomach and reduce nausea. Best consumed warm with a hint of honey.',
      icon: Coffee,
      color: 'bg-orange-100 text-orange-600',
      benefits: ['Anti-inflammatory', 'Digestive aid']
    },
    {
      title: 'Haldi Doodh Night Calm',
      description: 'Warm turmeric milk at night can support recovery and make bedtime feel easier on rough days.',
      icon: Sparkles,
      color: 'bg-amber-100 text-amber-700',
      benefits: ['Soothing', 'Night support']
    },
    {
      title: 'Honey & Lemon for Cough',
      description: 'A classic remedy that coats the throat and provides relief from persistent dry coughs.',
      icon: Heart,
      color: 'bg-yellow-100 text-yellow-600',
      benefits: ['Antibacterial', 'Soothing']
    },
    {
      title: 'Peppermint for Headaches',
      description: 'Applying peppermint oil or drinking tea can help relax muscles and ease tension headaches.',
      icon: Leaf,
      color: 'bg-green-100 text-green-600',
      benefits: ['Muscle relaxant', 'Cooling effect']
    },
    {
      title: 'Ajwain Steam Relief',
      description: 'Ajwain steam inhalation is a traditional option for mild congestion and stuffy breathing days.',
      icon: Wind,
      color: 'bg-cyan-100 text-cyan-700',
      benefits: ['Congestion support', 'Warm relief']
    },
    {
      title: 'Lavender for Sleep',
      description: 'Inhaling lavender scent before bed can improve sleep quality and reduce anxiety.',
      icon: Moon,
      color: 'bg-purple-100 text-purple-600',
      benefits: ['Calming', 'Stress relief']
    },
    {
      title: 'Jeera Water Digestive Ease',
      description: 'Cumin-infused warm water after meals may help with heaviness and mild bloating.',
      icon: Coffee,
      color: 'bg-lime-100 text-lime-700',
      benefits: ['Digestive comfort', 'Post-meal ease']
    }
  ];

  const wellnessTips = [
    {
      title: 'Morning Sunlight',
      text: 'Get 10-15 minutes of direct sunlight in the morning to regulate your circadian rhythm.',
      icon: Sun
    },
    {
      title: 'Deep Breathing',
      text: 'Practice 4-7-8 breathing technique twice a day to lower cortisol levels.',
      icon: Wind
    },
    {
      title: 'Hydration Pulse',
      text: 'Take 3-4 water breaks through the day instead of one big refill at night.',
      icon: Heart
    },
    {
      title: 'Evening Wind-Down',
      text: 'Keep lights warm and low after dinner to signal your brain it is recovery time.',
      icon: Moon
    },
    {
      title: 'Nadi Shodhana Break',
      text: 'Try alternate nostril breathing for 2-3 minutes when your mind feels scattered.',
      icon: Wind
    },
    {
      title: 'Post-Meal Vajrasana',
      text: 'Sit in Vajrasana for 5 minutes after meals if comfortable to support digestion rhythm.',
      icon: Heart
    },
    {
      title: 'Phone Sunset Rule',
      text: 'Set a digital sunset 45 minutes before sleep; your brain loves predictable off-time.',
      icon: Sun
    }
  ];

  const pickUniqueIndexes = (length: number, count: number, exclude: number[]) => {
    const all = Array.from({ length }, (_, i) => i);
    const pool = all.filter((idx) => !exclude.includes(idx));
    const source = pool.length >= count ? pool : all;
    const shuffled = [...source].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, length));
  };

  useEffect(() => {
    setDisplayedRemedies(pickUniqueIndexes(remedies.length, 2, []));
    setDisplayedTips(pickUniqueIndexes(wellnessTips.length, 2, []));
  }, [remedies.length, wellnessTips.length]);

  useEffect(() => {
    const rotationTimer = window.setInterval(() => {
      setDisplayedRemedies((prev) => pickUniqueIndexes(remedies.length, 2, prev));
      setDisplayedTips((prev) => pickUniqueIndexes(wellnessTips.length, 2, prev));
    }, 5000);
    return () => window.clearInterval(rotationTimer);
  }, [remedies.length, wellnessTips.length]);

  const rotatingRemedies = displayedRemedies.map((idx) => remedies[idx]).filter(Boolean);
  const rotatingTips = displayedTips.map((idx) => wellnessTips[idx]).filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-12"
    >
      <header>
        <h2 className="text-3xl font-bold italic mb-2">Natural Care</h2>
        <p className="text-on-surface-variant text-sm">
          From dadi-level hacks to modern wellness moves, all in one chill zone.
        </p>
      </header>

      <Card className="bg-primary/5 border-primary/20 border-2 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="text-primary" size={20} />
          <h3 className="text-xl font-bold italic text-primary">Nani Knows</h3>
        </div>
        <p className="text-xs text-on-surface-variant">Simple home remedies for everyday symptoms.</p>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., sore throat, minor burn..."
              className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && findRemedy()}
            />
          </div>
          <Button 
            onClick={findRemedy} 
            disabled={isSearching || !searchQuery.trim()}
            className="flex-shrink-0 px-4"
          >
            {isSearching ? <Loader2 className="animate-spin" size={18} /> : 'Find'}
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {aiRemedy && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/80 p-4 rounded-xl border border-primary/10 text-sm text-on-surface leading-relaxed whitespace-pre-wrap font-headline"
            >
              {aiRemedy}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold italic">Home Remedies</h3>
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1">
            <Sparkles size={10} /> Live Rotation
          </span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={`remedies-${displayedRemedies.join('-')}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
            className="grid grid-cols-1 gap-4"
          >
            {rotatingRemedies.map((remedy, i) => (
              <Card key={`${remedy.title}-${i}`} className="p-6 flex gap-4 items-start">
                <div className={`p-3 rounded-xl ${remedy.color}`}>
                  <remedy.icon size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-lg">{remedy.title}</h4>
                    <ChevronRight size={16} className="text-on-surface-variant/40" />
                  </div>
                  <p className="text-sm text-on-surface-variant mb-3 leading-relaxed">
                    {remedy.description}
                  </p>
                  <div className="flex gap-2">
                    {remedy.benefits.map((benefit, j) => (
                      <span key={j} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-surface-container-high rounded-md text-on-surface-variant">
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </motion.div>
        </AnimatePresence>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold italic">Daily Wellness Tips</h3>
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1">
            <Sparkles size={10} /> Refreshing
          </span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={`tips-${displayedTips.join('-')}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {rotatingTips.map((tip, i) => (
              <Card key={`${tip.title}-${i}`} className="p-5 bg-primary/5 border-primary/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <tip.icon size={18} />
                  </div>
                  <h4 className="font-bold text-sm">{tip.title}</h4>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {tip.text}
                </p>
              </Card>
            ))}
          </motion.div>
        </AnimatePresence>
      </section>

      <Card className="p-6 bg-surface-container-low border-2 border-primary/10">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary mt-1">
            <Info size={20} />
          </div>
          <div>
            <h4 className="font-bold mb-1">Medical Disclaimer</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              These tips are like your caring friend, not your doctor. They are for guidance only and do not replace professional diagnosis or treatment. If symptoms get serious, please check with a medical professional.
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
