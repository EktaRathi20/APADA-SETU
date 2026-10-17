import React, { useState } from 'react';
import { 
  Navigation, RefreshCw, UserCheck, Send, MapPin
} from 'lucide-react';
import { ChatMessage, CityLocation } from '../../types';
import { INITIAL_CHAT } from '../../data/mockData';

interface LandfallRescueModeViewProps {
  city: CityLocation;
  isLightMode?: boolean;
}

export const LandfallRescueModeView: React.FC<LandfallRescueModeViewProps> = ({
  city,
  isLightMode = true,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Quick chips that pre-fill the input box
  const quickChips = [
    '/shelter current loc - ',
    '/safe-route to Hospital from - ',
    '/flood-status at - ',
    '/convoy-clearance from - '
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'officer',
      senderName: 'Officer Dispatch',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST'
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await fetch('https://ciivf-monorepo-backend-6kiw4q5z7q-ew.a.run.app/api/dispatch-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: query.trim(),
          region: city.id
        }),
      });

      if (!response.ok) throw new Error('Network response was not ok');
      const aiData = await response.json();

      const systemMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'system',
        senderName: 'ClimaGuard Verified Dispatch',
        text: aiData.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST',
        verifiedRoute: aiData.verifiedRoute
      };

      setMessages(prev => [...prev, systemMsg]);
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'system',
        senderName: 'System Error',
        text: 'Telemetry failed. Switch to manual radio.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST',
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className={`border rounded-xl overflow-hidden shadow-sm flex flex-col h-[520px] transition-colors ${
        isLightMode ? 'bg-white border-slate-200/90' : 'bg-slate-900 border-slate-800'
      }`}>
        
        {/* Chat Header */}
        <div className={`px-4 py-3 border-b flex items-center justify-between ${
          isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${
              isLightMode ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-blue-600/20 border-blue-500/40 text-blue-400'
            }`}>
              <UserCheck size={16} />
            </div>
            <div>
              <div className={`text-xs font-bold flex items-center gap-1.5 ${
                isLightMode ? 'text-slate-900' : 'text-white'
              }`}>
                <span>Tactical Action Terminal</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className={`text-[11px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Manual GPS Override Active
              </div>
            </div>
          </div>
        </div>

        {/* Chat Message History */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-3.5 ${
          isLightMode ? 'bg-slate-50/50' : 'bg-slate-950/40'
        }`}>
          {messages.map((msg) => {
            const isOfficer = msg.sender === 'officer';
            return (
              <div key={msg.id} className={`flex flex-col ${isOfficer ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className={`text-[11px] font-bold font-mono ${
                    isLightMode ? 'text-slate-700' : 'text-slate-300'
                  }`}>
                    {msg.senderName}
                  </span>
                  <span className={`text-[10px] font-mono ${
                    isLightMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {msg.timestamp}
                  </span>
                </div>

                <div className={`max-w-xl rounded-xl p-3.5 text-xs ${
                  isOfficer
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-sm'
                    : isLightMode
                    ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-xs'
                    : 'bg-slate-900 border border-slate-700/80 text-slate-200 rounded-tl-none shadow-md'
                }`}>
                  <p className="leading-relaxed">{msg.text}</p>

                  {/* Verified Route Data Card */}
                  {msg.verifiedRoute && (
                    <div className={`mt-3 p-3 rounded-lg border text-xs space-y-2 ${
                      isLightMode ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
                    }`}>
                      <div className={`flex items-center justify-between pb-1.5 border-b ${
                        isLightMode ? 'border-slate-200' : 'border-slate-800'
                      }`}>
                        <div className="flex items-center gap-1.5 font-bold">
                          <Navigation size={13} className={isLightMode ? 'text-emerald-700' : 'text-emerald-400'} />
                          <span>Routing Telemetry</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                          msg.verifiedRoute.clearanceStatus === 'VERIFIED_CLEAR'
                            ? (isLightMode ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-950 text-emerald-300 border border-emerald-800')
                            : msg.verifiedRoute.clearanceStatus === 'CAUTION_RESTRICTED'
                            ? (isLightMode ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-950 text-amber-300 border border-amber-800')
                            : (isLightMode ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-950 text-rose-300 border border-rose-800')
                        }`}>
                          {msg.verifiedRoute.clearanceStatus.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className={isLightMode ? 'text-slate-500' : 'text-slate-400'}>Max Water Depth:</span>
                          <div className={`font-mono font-bold mt-0.5 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                            {msg.verifiedRoute.waterDepth}
                          </div>
                        </div>
                        <div>
                          <span className={isLightMode ? 'text-slate-500' : 'text-slate-400'}>Validity Window:</span>
                          <div className={`font-mono font-semibold mt-0.5 ${isLightMode ? 'text-blue-700' : 'text-cyan-300'}`}>
                            {msg.verifiedRoute.validityWindow}
                          </div>
                        </div>
                      </div>

                      <div>
                        <span className={`text-[11px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Recommended Path:</span>
                        <div className={`font-semibold text-xs mt-0.5 leading-snug ${
                          isLightMode ? 'text-emerald-800' : 'text-emerald-300'
                        }`}>
                          {msg.verifiedRoute.recommendedPath}
                        </div>
                      </div>

                      <div>
                        <span className={`text-[11px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Cleared Waypoints:</span>
                        <ul className={`mt-1 space-y-1 text-[11px] list-disc list-inside ${
                          isLightMode ? 'text-slate-700' : 'text-slate-300'
                        }`}>
                          {msg.verifiedRoute.waypoints.map((wp, idx) => (
                            <li key={idx}>{wp}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className={`flex items-center gap-2 text-xs italic p-2.5 rounded-lg max-w-xs ${
              isLightMode ? 'bg-white border border-slate-200 text-slate-600 shadow-xs' : 'bg-slate-900 border border-slate-800 text-slate-400'
            }`}>
              <RefreshCw size={13} className="animate-spin text-blue-600" />
              <span>Analyzing tactical routing...</span>
            </div>
          )}
        </div>

        {/* Quick Command Chips */}
        <div className={`px-4 py-2 border-t flex items-center gap-2 overflow-x-auto text-xs ${
          isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/90 border-slate-800'
        }`}>
          <span className={`text-[10px] font-mono uppercase shrink-0 ${
            isLightMode ? 'text-slate-500' : 'text-slate-400'
          }`}>Quick Commands:</span>
          {quickChips.map((chip, i) => (
            <button
              key={i}
              onClick={() => setInputText(chip)}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap text-[11px] transition-colors shrink-0 cursor-pointer ${
                isLightMode
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-medium'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              {chip.replace(' - ', '')}
            </button>
          ))}
        </div>

        {/* Manual Input Bar */}
        <div className={`p-3 border-t flex items-center gap-2 ${
          isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your command and location..."
            className={`flex-1 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 ${
              isLightMode
                ? 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400'
                : 'bg-slate-900 border border-slate-700 text-white placeholder-slate-400'
            }`}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isTyping}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <span>Dispatch</span>
            <Send size={13} />
          </button>
        </div>
        
      </div>
    </div>
  );
};
