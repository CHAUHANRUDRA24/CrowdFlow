import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Loader2 } from 'lucide-react';
import { Type, FunctionDeclaration, Content } from '@google/genai';

import { TelemetryData } from '../types';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: TelemetryData;
  onTriggerEvacDrill: () => void;
  onEndEvacDrill: () => void;
  onBroadcastMessage: (message: string) => void;
  onDispatchUnit: (unitId: string, location: string) => void;
}

const triggerEvacDrillDeclaration: FunctionDeclaration = {
  name: 'triggerEvacDrill',
  description: 'Triggers the venue-wide evacuation drill scenario.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  }
};

const endEvacDrillDeclaration: FunctionDeclaration = {
  name: 'endEvacDrill',
  description: 'Ends the venue-wide evacuation drill scenario and returns to normal operations.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  }
};

const broadcastMessageDeclaration: FunctionDeclaration = {
  name: 'broadcastMessage',
  description: 'Broadcasts a global alert message to all screens and PA systems.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      message: { type: Type.STRING, description: 'The message to broadcast.' }
    },
    required: ['message']
  }
};

const dispatchUnitDeclaration: FunctionDeclaration = {
  name: 'dispatchUnit',
  description: 'Dispatches a security or medical unit to a specific location.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      unitId: { type: Type.STRING, description: 'The ID of the unit to dispatch (e.g., u-7, emt-4).' },
      location: { type: Type.STRING, description: 'The location to dispatch the unit to (e.g., Gate C, Sector 102).' }
    },
    required: ['unitId', 'location']
  }
};

export default function AIAssistant({ isOpen, onClose, telemetry, onTriggerEvacDrill, onEndEvacDrill, onBroadcastMessage, onDispatchUnit }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: 'Hello. I am the CrowdFlow Neural Core. How can I assist you with venue management today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const systemPrompt = `You are the "CrowdFlow Neural Core", an advanced AI assistant for a Venue Command Center dashboard. 
      You help venue managers handle crowd control, staffing, and emergencies.
      Current live venue status:
      - Total Attendance: ${telemetry.attendance.toLocaleString()}
      - Weather: ${telemetry.weather.condition}, ${telemetry.weather.temp}°C, Wind: ${telemetry.weather.wind}km/h
      - Active Incidents: ${telemetry.activeIncidents}
      - Critical Alerts: ${telemetry.criticalAlerts}
      - Gate Throughput: ${telemetry.gateThroughput}/min
      - Active Flow: ${telemetry.activeFlow}%
      - Crowd Density: ${telemetry.crowdDensity}%
      - Latency: ${telemetry.latency}ms
      
      Respond concisely and professionally, using a slightly technical/sci-fi tone appropriate for a high-tech command center. If there are critical alerts or severe weather, prioritize safety and evacuation protocols. You have access to tools to trigger drills, broadcast messages, and dispatch units. Use them when appropriate.`;

      let currentContents: Content[] = [
        ...messages.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
        { role: 'user', parts: [{ text: userMessage }] }
      ];

      const fetchGeminiResponse = async (contents: Content[]) => {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents, systemInstruction: systemPrompt })
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch response from server');
        }
        return await res.json();
      };

      let response = await fetchGeminiResponse(currentContents);

      let functionCalls = response.functionCalls;
      
      while (functionCalls && functionCalls.length > 0) {
        currentContents.push(response.candidates![0].content);
        
        const functionResponses: any[] = [];
        
        for (const call of functionCalls) {
          let result: any = { status: 'success' };
          try {
            if (call.name === 'triggerEvacDrill') {
              onTriggerEvacDrill();
              result = { status: 'Evacuation drill triggered successfully.' };
            } else if (call.name === 'endEvacDrill') {
              onEndEvacDrill();
              result = { status: 'Evacuation drill ended successfully.' };
            } else if (call.name === 'broadcastMessage') {
              const args = call.args as any;
              onBroadcastMessage(args.message);
              result = { status: `Message broadcasted: ${args.message}` };
            } else if (call.name === 'dispatchUnit') {
              const args = call.args as any;
              onDispatchUnit(args.unitId, args.location);
              result = { status: `Unit ${args.unitId} dispatched to ${args.location}.` };
            }
          } catch (e) {
            result = { error: String(e) };
          }
          
          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: result
            }
          });
        }
        
        currentContents.push({
          role: 'user',
          parts: functionResponses
        });
        
        response = await fetchGeminiResponse(currentContents);
        
        functionCalls = response.functionCalls;
      }

      if (response.text) {
        setMessages(prev => [...prev, { role: 'model', content: response.text }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', content: 'Action completed.' }]);
      }
    } catch (error) {
      console.error('Error calling Gemini:', error);
      setMessages(prev => [...prev, { role: 'model', content: 'System error: Unable to connect to Neural Core.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-surface-container-low border-l border-outline-variant/30 shadow-2xl flex flex-col z-50 transform transition-transform duration-300">
      <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="font-headline font-bold text-white text-sm uppercase tracking-wider">Neural Core</h3>
            <p className="text-[10px] text-primary-container uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
              Online
            </p>
          </div>
        </div>
        <button onClick={onClose} aria-label="Close AI Assistant" className="text-slate-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${
              msg.role === 'user' 
                ? 'bg-primary-container text-on-primary-container rounded-tr-sm' 
                : 'bg-surface-container-high text-slate-200 rounded-tl-sm border border-white/5'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-surface-container-high text-slate-400 rounded-2xl rounded-tl-sm p-3 border border-white/5 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-xs uppercase tracking-widest">Processing</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-outline-variant/30 bg-surface-container">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Query Neural Core..."
            aria-label="Message input"
            className="w-full bg-surface-container-highest border border-outline-variant/50 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-container/50 transition-colors"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-primary-container hover:bg-primary-container/10 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
