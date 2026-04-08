/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Screen } from './types';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen.tsx';
import { InsightsScreen } from './components/InsightsScreen';
import { ConsultScreen } from './components/ConsultScreen';
import { RemediesScreen } from './components/RemediesScreen';
import { Settings } from 'lucide-react';
import { AnimatePresence } from 'motion/react';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [shouldGreet, setShouldGreet] = useState(false);
  const [shouldStartVoice, setShouldStartVoice] = useState(false);
  const desktopNavItems: Array<{ id: Screen; label: string }> = [
    { id: 'home', label: 'Home' },
    { id: 'consult', label: 'Consult' },
    { id: 'remedies', label: 'Remedies' },
    { id: 'insights', label: 'Insights' },
  ];

  const handleStartConsult = (voice = false) => {
    setShouldGreet(true);
    setShouldStartVoice(voice);
    setActiveScreen('consult');
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'home':
        return <HomeScreen key="home" onStartConsult={handleStartConsult} />;
      case 'insights':
        return <InsightsScreen key="insights" onStartConsult={handleStartConsult} />;
      case 'remedies':
        return <RemediesScreen key="remedies" />;
      case 'consult':
        return (
          <ConsultScreen
            key="consult"
            autoGreet={shouldGreet}
            autoVoice={shouldStartVoice}
            onGreeted={() => setShouldGreet(false)}
            onVoiceStarted={() => setShouldStartVoice(false)}
          />
        );
      default:
        return <HomeScreen key="home" onStartConsult={handleStartConsult} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body selection:bg-primary/20">
      {/* Top Navigation Bar (desktop stays visible even on Consult for tab switching) */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl px-4 sm:px-6 lg:px-10 py-4 justify-between items-center ${
          activeScreen === 'consult' ? 'hidden lg:flex' : 'flex'
        }`}
      >
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-[#ff9a5a] via-[#ff6d8a] to-[#7a68ff] shadow-lg shadow-[#ff6d8a]/35 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.45),transparent_60%)]" />
              <div className="relative text-white text-sm font-black tracking-tight rotate-[-7deg]">vc</div>
              <div className="absolute -bottom-1 -right-1 text-[8px] font-black text-[#5a2b7a] bg-white rounded-full px-1.5 py-0.5 leading-none">zzz</div>
            </div>
            <div className="flex items-center gap-1 text-primary">
              <span className="font-headline italic text-2xl font-bold">YouOkay?</span>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-2 bg-white/80 rounded-full px-2 py-1 border border-primary/10">
            {desktopNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveScreen(item.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                  activeScreen === item.id
                    ? 'bg-primary text-white'
                    : 'text-on-surface-variant hover:bg-primary/10 hover:text-primary'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 lg:hidden">
            <button
              onClick={() => setActiveScreen('insights')}
              className="text-primary-container/60 hover:text-primary transition-colors cursor-pointer"
              title="Open insights"
              aria-label="Open insights"
            >
              <Settings size={24} />
            </button>
          </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-10 pt-24 pb-32 lg:pb-10">
        <AnimatePresence mode="wait">
          {renderScreen()}
        </AnimatePresence>
      </main>

      <BottomNav activeScreen={activeScreen} onScreenChange={setActiveScreen} />
    </div>
  );
}
