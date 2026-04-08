import { MessageSquare, BarChart3, Home, Leaf } from 'lucide-react';
import { Screen } from '../types';
import { cn } from '../lib/utils';

interface BottomNavProps {
  activeScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}

export const BottomNav = ({ activeScreen, onScreenChange }: BottomNavProps) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'consult', label: 'Consult', icon: MessageSquare },
    { id: 'remedies', label: 'Remedies', icon: Leaf },
    { id: 'insights', label: 'Insights', icon: BarChart3 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-outline-variant/10 px-4 pb-8 pt-2 lg:hidden">
      <div className="flex justify-around items-center w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onScreenChange(item.id as Screen)}
              className={cn(
                'flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all active:scale-90',
                isActive ? 'bg-primary/10 text-primary' : 'text-on-surface-variant/60'
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold uppercase tracking-tighter mt-1">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
