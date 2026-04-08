import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Card } from './Card';
import { Button } from './Button';
import {
  Send,
  Mic,
  Sparkles,
  Stethoscope,
  History,
  Trash2,
  WandSparkles,
  Loader2,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { apiUrl } from '../lib/api';

interface Message {
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
}

interface HistoryItem {
  id: string;
  symptoms: string;
  analysis: string;
  timestamp: string;
}

interface PredictionResult {
  ['Predicted Disease']?: string;
  ['Confidence']?: number;
  ['Triage']?: string;
  ['Precautions']?: string[];
  ['Home Remedies']?: string[];
  ['Urgent Actions']?: string[];
}

interface ClaudeResponse {
  reply?: string;
  response?: string;
}

const normalizePredictionResult = (raw?: any): PredictionResult | undefined => {
  if (!raw) return undefined;

  const normalizeStringArray = (value: any): string[] | undefined => {
    if (Array.isArray(value)) return value.filter((item) => typeof item === 'string');
    if (typeof value === 'string') {
      const parts = value
        .split(/\r?\n|;|\||\.|,/)
        .map((item) => item.trim())
        .filter(Boolean);
      return parts.length ? parts : undefined;
    }
    return undefined;
  };

  const disease =
    raw['Predicted Disease'] ?? raw.predicted_disease ?? raw.predictedDisease ?? raw.disease ?? raw.condition;
  const confidenceRaw = raw['Confidence'] ?? raw.confidence ?? raw.score ?? raw.confidence_score;
  const confidence = Number(confidenceRaw);
  const triage = raw['Triage'] ?? raw.triage ?? raw.severity;
  const precautions = normalizeStringArray(raw['Precautions'] ?? raw.precautions ?? raw.safety ?? raw.recommendations);
  const remedies = normalizeStringArray(raw['Home Remedies'] ?? raw.home_remedies ?? raw.homeRemedies ?? raw.remedies ?? raw['Remedies']);
  const urgentActions = normalizeStringArray(raw['Urgent Actions'] ?? raw.urgent_actions ?? raw.urgentActions ?? raw.urgent ?? raw.actions);

  return {
    ...(disease ? { 'Predicted Disease': String(disease) } : {}),
    ...(Number.isFinite(confidence) ? { Confidence: confidence } : {}),
    ...(triage ? { Triage: String(triage) } : {}),
    ...(precautions ? { Precautions: precautions } : {}),
    ...(remedies ? { 'Home Remedies': remedies } : {}),
    ...(urgentActions ? { 'Urgent Actions': urgentActions } : {}),
  };
};

interface ConsultScreenProps {
  autoGreet?: boolean;
  autoVoice?: boolean;
  onGreeted?: () => void;
  onVoiceStarted?: () => void;
}

const readStoredHistory = (): HistoryItem[] => {
  try {
    const saved = localStorage.getItem('consult_history');
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? (parsed as HistoryItem[]) : [];
  } catch {
    return [];
  }
};

export const ConsultScreen = (_props: ConsultScreenProps) => {
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Welcome. Share your symptoms and I will give a clean, structured prediction with precautions.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [autoSpeakReplies, setAutoSpeakReplies] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>(() => readStoredHistory());
  const [showHistory, setShowHistory] = useState(false);
  
  // NEW: State for Autocomplete
  const [allKnownSymptoms, setAllKnownSymptoms] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const quickPrompts = [
    'Should I see a doctor today?',
    'What should I avoid right now?',
    'Give me a short recovery routine.',
  ];

  // NEW: Fetch all symptoms from backend when app loads
  useEffect(() => {
    const fetchSymptoms = async () => {
      try {
        const res = await fetch(apiUrl('/symptoms'));
        if (res.ok) {
          const data = await res.json();
          setAllKnownSymptoms(data.symptoms || []);
        }
      } catch (err) {
        console.error("Could not fetch symptom list", err);
      }
    };
    fetchSymptoms();
  }, []);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    return () => {
      recognitionRef.current?.stop?.();
      synthRef.current?.cancel?.();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('consult_history', JSON.stringify(history));
  }, [history]);

  const getTimestamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // NEW: Autocomplete Logic
  const handleSymptomChange = (text: string) => {
    setSymptoms(text);
    // Find the word currently being typed (after the last comma)
    const parts = text.split(',');
    const currentWord = parts[parts.length - 1].trim().toLowerCase();
    setShowSuggestions(currentWord.length > 0);
  };

  const getSuggestions = () => {
    const parts = symptoms.split(',');
    const currentWord = parts[parts.length - 1].trim().toLowerCase();
    if (currentWord.length === 0) return [];
    return allKnownSymptoms
      .filter(s => s.toLowerCase().includes(currentWord))
      .slice(0, 5); // Only show top 5 suggestions
  };

  const selectSuggestion = (suggestion: string) => {
    const parts = symptoms.split(',');
    parts[parts.length - 1] = ` ${suggestion}`; // Replace last typed word
    setSymptoms(parts.join(',') + ', '); // Add comma to prepare for next symptom
    setShowSuggestions(false);
  };

  const speakMessage = (text: string) => {
    if (!autoSpeakReplies || !synthRef.current || !('SpeechSynthesisUtterance' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text.replace(/\n/g, '. '));
    utterance.rate = 1;
    utterance.pitch = 1;
    synthRef.current!.cancel();
    synthRef.current!.speak(utterance);
  };

  const generateAssistantReply = (userText: string) => {
    const msg = userText.toLowerCase();
    const hasAnalysis = !!analysisResult;
    const diseaseMatch = analysisResult?.match(/Predicted Disease:\s*(.+)/i)?.[1]?.trim() || '';
    const triageMatch = analysisResult?.match(/Triage:\s*(.+)/i)?.[1]?.trim() || '';

    if (msg.includes('work') || msg.includes('school') || msg.includes('go out') || msg.includes('go to')) {
      if (hasAnalysis && triageMatch.toLowerCase() === 'low' && diseaseMatch) {
        return `Based on your ${diseaseMatch} analysis (low triage), light work may be manageable if symptoms are mild. However, listen to your body — if the condition worsens or affects focus, rest is better. Prioritize recovery over pushing through.`;
      }
      if (triageMatch.toLowerCase() === 'high') {
        return 'Your triage level is high. Avoid work and seek medical attention before resuming normal activities.';
      }
      return 'If symptoms are mild and not worsening, light activity may be fine. But if you feel fatigued or distracted, rest is the safer choice. Monitor and decide based on how you feel.';
    }

    if (msg.includes('doctor') || msg.includes('hospital') || msg.includes('urgent')) {
      if (triageMatch.toLowerCase() === 'high') {
        return `Your analysis shows ${triageMatch} triage. Seek medical care promptly — do not delay.`;
      }
      return `Your current triage is ${triageMatch || 'low'}. If symptoms persist beyond 48 hours or worsen, consult a doctor. For now, follow the precautions from your analysis.`;
    }

    if (msg.includes('avoid') || msg.includes('dont') || msg.includes("don't")) {
      if (hasAnalysis) {
        return `Based on your analysis, general safe precautions:\n• Avoid self-medicating without guidance\n• Avoid screens and bright light if headache persists\n• Stay hydrated and avoid skipping meals\n• Avoid intense physical exertion`;
      }
      return 'Safe precautions:\n• Avoid new medications without guidance\n• Stay hydrated\n• Rest & monitor symptoms';
    }

    if (msg.includes('routine') || msg.includes('plan') || msg.includes('recovery')) {
      if (hasAnalysis) {
        return `Recovery plan for your case:\n• Follow the listed precautions consistently\n• Use the suggested home remedies\n• Hydrate well and eat light meals\n• Re-assess in 24-48 hours\n• See a doctor if no improvement`;
      }
      return 'Recovery plan:\n• Hydrate regularly\n• Light meals\n• Monitor 24-48h\n• Doctor if no improvement';
    }

    if (msg.includes('food') || msg.includes('eat') || msg.includes('diet')) {
      return 'Stick to light, nutritious meals — avoid oily, spicy, or heavy food. Hydration is more important than eating heavy. Small frequent meals are easier to digest when unwell.';
    }

    if (msg.includes('sleep') || msg.includes('rest')) {
      return 'Rest is one of the most effective recovery tools. Aim for 7-9 hours of sleep. If headache is disturbing sleep, try a dark quiet room and cold compress as suggested in your remedies.';
    }

    if (hasAnalysis) {
      return `Regarding your ${diseaseMatch || 'symptoms'} — continue following the precautions and remedies from your analysis. Track any changes and seek care if symptoms worsen or new red flags appear.`;
    }

    return 'Monitoring your symptoms. Key steps:\n• Track intensity/pattern\n• Follow prior precautions\n• Medical help for red flags';
  };

  const enqueueAssistantReply = async (prompt: string) => {
    setIsAssistantTyping(true);
    setIsSending(true);

    try {
      const contextBlock = analysisResult
        ? `\n\n[User's latest symptom analysis result]\n${analysisResult}\n[End of analysis]`
        : '';

      const aiRes = await fetch(apiUrl('/claude'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_prompt:
            'You are a helpful health assistant. You have access to the user\'s latest symptom analysis result provided below. Use it to give specific, contextual answers. Do NOT re-analyze or change the predicted disease. Just answer the user\'s follow-up question based on the given analysis. Never diagnose. Keep replies concise (2-4 sentences).' + contextBlock,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      let reply = '';
      if (aiRes.ok) {
        const aiData = await aiRes.json() as ClaudeResponse;
        reply = (aiData.reply ?? aiData.response ?? '').trim();
      }

      if (!reply) reply = generateAssistantReply(prompt);

      const assistantMessage: Message = {
        role: 'assistant',
        content: reply,
        timestamp: getTimestamp(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      speakMessage(reply);
    } catch {
      const fallback = generateAssistantReply(prompt);
      const assistantMessage: Message = {
        role: 'assistant',
        content: fallback,
        timestamp: getTimestamp(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsAssistantTyping(false);
      setIsSending(false);
    }
  };

  const startListening = (target: 'chat' | 'symptoms' = 'chat') => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return alert('Speech not supported');

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      if (target === 'chat') setInput(transcript);
      else setSymptoms(transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
    setIsListening(true);
  };

  const handleSend = () => {
    if (!input.trim() || isSending) return;

    const newMessage: Message = {
      role: 'user' as const,
      content: input,
      timestamp: getTimestamp(),
    };
    setMessages(prev => [...prev, newMessage]);
    enqueueAssistantReply(input);
    setInput('');
  };

  const analyzeSymptoms = async () => {
    if (!symptoms.trim()) return;
    setIsAnalyzing(true);
    setShowSuggestions(false); // Hide dropdown when analyzing

    try {
      const symptomList = symptoms
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(s => s.length > 0);

      const aiRes = await fetch(apiUrl('/predict'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: symptomList }),
      });

      let finalResult: PredictionResult | null = null;

      if (aiRes.ok) {
        const data: any = await aiRes.json();
        finalResult = normalizePredictionResult(data);
      }

      if (!finalResult) {
        setAnalysisResult('Error connecting to analysis engine. Please try again.');
        setIsAnalyzing(false);
        return;
      }

      const analysisText = [
        `Predicted Disease: ${finalResult['Predicted Disease']}`,
        `Confidence: ${(finalResult.Confidence || 0).toFixed(0)}%`,
        `Triage: ${finalResult.Triage || 'low'}`,
        '',
        'Precautions:',
        ...(finalResult.Precautions || []).map((p: string) => `  • ${p}`),
        '',
        'Home Remedies:',
        ...(finalResult['Home Remedies'] || []).map((r: string) => `  • ${r}`),
      ].join('\n');

      setAnalysisResult(analysisText);

      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        symptoms,
        analysis: analysisText,
        timestamp: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      };
      setHistory(prev => [newHistoryItem, ...prev.slice(0, 9)]);
    } catch {
      setAnalysisResult('Error analyzing symptoms. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    if (confirm('Clear history?')) setHistory([]);
  };

  const suggestions = getSuggestions();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full w-full p-4 space-y-4">
      {/* Symptom Analysis Card */}
      <Card className="border-2 border-primary/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Stethoscope className="text-primary" size={24} />
          <h2 className="text-xl font-bold text-primary">Symptom Analysis</h2>
        </div>
        
        {/* NEW: Relative container for textarea + dropdown */}
        <div className="relative">
          <textarea
            value={symptoms}
            onChange={(e) => handleSymptomChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Hide after clicking
            placeholder="Type symptoms separated by commas (e.g. headache, fever)..."
            className="w-full h-32 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            rows={4}
          />
          
          {/* NEW: Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-40 overflow-y-auto">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-gray-700 border-b border-gray-100 last:border-0"
                  onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
                  onClick={() => selectSuggestion(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={analyzeSymptoms}
          disabled={isAnalyzing || !symptoms.trim()}
          className="w-full mt-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90"
        >
          {isAnalyzing ? (
            <Loader2 className="animate-spin mr-2 h-4 w-4" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {isAnalyzing ? 'Analyzing...' : 'Analyze Symptoms'}
        </Button>
        
        {analysisResult && (
          <div className="mt-6 p-6 bg-gradient-to-b from-gray-50 to-white border border-gray-200 rounded-2xl shadow-sm">
            <div className="text-sm leading-relaxed whitespace-pre-wrap font-mono text-gray-800">
              {analysisResult}
            </div>
          </div>
        )}
      </Card>

      {/* Chat Section */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 pb-20">
          {messages.map((msg, i) => (
            <div key={i} className={cn(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}>
              <div className={cn(
                'max-w-[80%] p-4 rounded-2xl shadow-md',
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                  : 'bg-white border border-gray-200'
              )}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                <span className="text-xs opacity-60 mt-1 block text-right">{msg.timestamp}</span>
              </div>
            </div>
          ))}
          {isAssistantTyping && (
            <div className="flex justify-start">
              <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-md">
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0s]" />
                  <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce [animation-delay:100ms]" />
                  <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce [animation-delay:200ms]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick prompts */}
        {!isAssistantTyping && (
          <div className="flex gap-2 flex-wrap pb-4 pt-2">
            {quickPrompts.map(prompt => (
              <button
                key={prompt}
                onClick={() => setInput(prompt)}
                className="px-4 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-all border border-gray-200"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="bg-white border-t p-4 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-3">
            <button
              className="p-3 rounded-xl hover:bg-gray-100 transition-colors"
              onClick={() => setInput(quickPrompts[0])}
              title="Quick prompt"
            >
              <WandSparkles size={20} />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isSending && handleSend()}
              placeholder="Ask anything about your health..."
              className="flex-1 bg-transparent outline-none text-lg py-3 placeholder-gray-500"
              disabled={isSending}
            />
            <button
              onClick={() => startListening('chat')}
              className="p-3 rounded-xl hover:bg-gray-100 disabled:opacity-50"
              disabled={isListening}
              title="Voice input"
            >
              <Mic size={20} />
            </button>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              size="lg"
              className="!rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 shadow-lg !px-6"
            >
              <Send size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* History modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-h-[80vh] w-full max-w-md overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Consult History</h3>
              <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {history.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <History className="mx-auto h-12 w-12 mb-4 opacity-40" />
                  <p>No consultations yet</p>
                </div>
              ) : (
                history.map(item => (
                  <div key={item.id} className="p-4 bg-gray-50 rounded-xl border">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-gray-500">{item.timestamp}</span>
                      <button
                        onClick={() => deleteHistoryItem(item.id)}
                        className="text-red-400 hover:text-red-500 p-1 -m-1 rounded-full hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="text-sm font-medium mb-1 whitespace-pre-wrap">Symptoms: {item.symptoms}</div>
                    <div className="text-xs leading-relaxed text-gray-700 max-h-20 overflow-y-auto whitespace-pre-wrap">{item.analysis}</div>
                  </div>
                ))
              )}
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors"
                >
                  Clear All History
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
