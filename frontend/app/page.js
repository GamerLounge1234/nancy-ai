"use client";

import { useState, useRef, useEffect } from "react";

export default function NancyDashboard() {
  const [query, setQuery] = useState("");
  const [responseStream, setResponseStream] = useState("");
  const [botState, setBotState] = useState("idle"); // 'idle', 'thinking', 'answering', 'cute'
  const terminalRef = useRef(null);

  // Auto-scroll the terminal as NANCY types
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [responseStream]);

  const askNancy = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setResponseStream("");
    setBotState("thinking"); // Nancy is processing the request

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }), 
      });

      if (!res.ok) throw new Error("Entity interference detected.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";
      let isFirstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          setBotState("cute"); // Finished! Show the cute/resolved GIF
          break;
        }

        if (isFirstChunk) {
          setBotState("answering"); // Start talking GIF!
          isFirstChunk = false;
        }

        fullResponse += decoder.decode(value, { stream: true });
        setResponseStream(fullResponse); 
      }

    } catch (error) {
      console.error(error);
      setBotState("idle"); 
      setResponseStream("ERROR: Connection to the Entity's Realm was severed.");
    }
  };

  // Dynamically switch the GIF based on Nancy's current state
  const getAvatarImage = () => {
    switch(botState) {
      case "thinking": return "/assets/nancy-thinking.gif";
      case "answering": return "/assets/nancy-answering.gif";
      case "cute": return "/assets/nancy-cute.gif";
      default: return "/assets/nancy-greeting.gif";
    }
  };

  // Custom inline Markdown parser for a premium UI feel
  const renderFormattedText = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, index) => {
      // Headers
      if (line.startsWith('### ')) return <h3 key={index} className="text-lg font-bold text-auric-gold mt-4 mb-2">{line.replace('### ', '')}</h3>;
      if (line.startsWith('## ')) return <h2 key={index} className="text-xl font-bold text-red-500 mt-5 mb-2 border-b border-red-900/30 pb-1">{line.replace('## ', '')}</h2>;
      if (line.startsWith('# ')) return <h1 key={index} className="text-2xl font-black text-red-600 mt-6 mb-3 uppercase tracking-wider">{line.replace('# ', '')}</h1>;
      
      // Lists
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const listText = line.substring(2);
        return <li key={index} className="ml-5 list-disc text-gray-300 my-1 marker:text-red-600">{formatBoldText(listText)}</li>;
      }
      
      // Standard Paragraphs
      return <p key={index} className="mb-3 text-gray-300 leading-relaxed">{formatBoldText(line)}</p>;
    });
  };

  // Helper to make **bold** text actually bold and bright white
  const formatBoldText = (str) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="min-h-screen text-gray-100 font-sans p-4 md:p-8 selection:bg-red-900 selection:text-white relative overflow-hidden">
      
      {/* HUD Header */}
      <header className="max-w-7xl mx-auto mb-10 border-b border-red-900/50 pb-5 flex items-end justify-between relative z-10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500 drop-shadow-lg">
            NANCY AI <span className="text-red-700 text-2xl">v1.0</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1 tracking-widest font-mono">DEAD BY DAYLIGHT INTELLIGENCE</p>
        </div>
        <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-full border border-red-900/30">
          <div className={`h-2.5 w-2.5 rounded-full ${botState !== 'idle' ? 'bg-orange-500 animate-pulse' : 'bg-red-600'}`}></div>
          <span className="text-xs font-mono font-bold text-gray-300 tracking-wider">
            {botState === 'idle' ? "SYSTEM IDLE" : botState === 'thinking' ? "ANALYZING..." : "STREAMING DATA"}
          </span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">

        {/* Left Column: Dynamic Avatar & Input */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* Premium Glassmorphism Avatar Frame */}
          <div className="bg-black/40 backdrop-blur-md border border-red-900/50 rounded-2xl p-2 shadow-blood animate-float relative group">
            
            {/* Aesthetic Corner Accents */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-red-500"></div>
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-red-500"></div>
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-red-500"></div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-red-500"></div>

            <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-900 border border-gray-800">
              <img
                src={getAvatarImage()}
                alt="Nancy AI Avatar"
                className="w-full h-full object-cover transition-opacity duration-300"
              />
              <div className="absolute inset-0 bg-red-900/10 pointer-events-none mix-blend-overlay"></div>
            </div>
            
            <div className="mt-4 px-2 pb-2 flex justify-between items-center">
               <span className="text-xs text-gray-500 font-mono">CONNECTION: STABLE</span>
               <span className="text-xs text-orange-500 font-mono">MMR: IRIDESCENT</span>
            </div>
          </div>

          {/* Tactical User Input Dashboard */}
          <div className="bg-black/40 backdrop-blur-md border border-red-900/40 p-5 rounded-2xl shadow-xl">
            <h2 className="text-xs font-bold text-gray-400 mb-4 tracking-widest flex items-center gap-2">
              <span className="text-red-500">▶</span> SUBMIT QUERY
            </h2>
            <form onSubmit={askNancy} className="flex flex-col gap-4">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask for a build, counter-strategy, or patch notes..."
                className="w-full bg-gray-950/80 border border-gray-800 rounded-lg p-4 text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/50 transition-all resize-none h-28 text-gray-200 placeholder-gray-600 font-mono"
              />
              <button
                type="submit"
                disabled={botState === 'thinking' || botState === 'answering'}
                className="relative overflow-hidden bg-red-950/40 text-red-100 border border-red-800 py-3 rounded-lg hover:bg-red-800 hover:text-white transition-all font-bold tracking-wider disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <span className="relative z-10">
                  {botState === 'thinking' ? "EXTRACTING DATA..." : botState === 'answering' ? "RECEIVING..." : "INITIATE PROTOCOL"}
                </span>
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 h-full w-0 bg-red-600 transition-all duration-300 ease-out group-hover:w-full opacity-20"></div>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: NANCY's Output Terminal */}
        <div className="lg:col-span-8 flex flex-col h-[700px]">
          
          {/* Terminal Header */}
          <div className="bg-gradient-to-r from-red-950 to-black border-t border-x border-red-900/50 rounded-t-2xl p-3 px-6 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
               <span className="text-red-500 animate-pulse">●</span>
               <span className="text-sm font-mono tracking-widest text-gray-300">DATA_STREAM_VISUALIZER</span>
            </div>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-700"></div>
              <div className="w-2 h-2 rounded-full bg-gray-700"></div>
              <div className="w-2 h-2 rounded-full bg-red-600"></div>
            </div>
          </div>

          {/* Terminal Body */}
          <div
            ref={terminalRef}
            className="flex-1 bg-black/60 backdrop-blur-xl border-x border-b border-red-900/50 rounded-b-2xl p-6 md:p-8 overflow-y-auto shadow-2xl relative"
          >
            {/* Subtle watermark logo in background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
               <h1 className="text-9xl font-black text-red-500 transform -rotate-12">NANCY</h1>
            </div>

            <div className="relative z-10 text-base">
              {responseStream ? (
                <div className="font-sans">
                  {renderFormattedText(responseStream)}
                  {(botState === 'thinking' || botState === 'answering') && (
                    <span className="inline-block w-2.5 h-5 bg-red-500 ml-1 translate-y-1 animate-pulse"></span>
                  )}
                </div>
              ) : (
                <div className="flex flex-col h-full items-center justify-center text-gray-600 font-mono text-center">
                  <div className="w-16 h-16 border-2 border-gray-800 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl text-gray-700">?</span>
                  </div>
                  <p>TERMINAL STANDBY.</p>
                  <p className="text-xs mt-2 opacity-50">Awaiting user input to establish connection to The Entity.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}