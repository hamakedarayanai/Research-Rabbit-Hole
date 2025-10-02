import React, { useState, useRef } from 'react';
import { generateConceptMap, fetchArticleContent } from './services/geminiService';
import type { GraphData } from './types';
import MindMap, { type MindMapHandles } from './components/MindMap';
import Loader from './components/Loader';

// --- Icon Components ---
const LinkIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>);
const GenerateIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>);
const ClearIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const SvgIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>);
const PngIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>);
const TopicIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>);
const Spinner: React.FC<{ className?: string }> = ({ className }) => (<svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [relatedTopics, setRelatedTopics] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loadingTopic, setLoadingTopic] = useState<string | null>(null);
  const mindMapRef = useRef<MindMapHandles>(null);

  const placeholderText = `Paste a complex article or research question here. For example:\n\n"Quantum computing is a revolutionary computing paradigm that leverages principles of quantum mechanics, such as superposition and entanglement, to process information..."`;

  const handleGenerateClick = async (textToAnalyze: string = inputText) => {
    if (!textToAnalyze.trim()) {
      setError("Please enter some text to analyze.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setFetchError(null);
    if (textToAnalyze === inputText) { // only clear graph if it's a new main search
        setGraphData(null);
        setRelatedTopics([]);
    }

    try {
      const result = await generateConceptMap(textToAnalyze);
      setGraphData({ nodes: result.concepts, links: result.relationships });
      setRelatedTopics(result.relatedTopics);
    } catch (err: any) {
      setError(err.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchClick = async () => {
    if (!url.trim()) {
        setFetchError("Please enter a URL.");
        return;
    }
    try { new URL(url); } catch (_) {
        setFetchError("Please enter a valid URL.");
        return;
    }

    setIsFetching(true);
    setFetchError(null);
    setError(null);
    setInputText(''); 

    try {
        const content = await fetchArticleContent(url);
        if (content && content.trim()) {
            setInputText(content);
            await handleGenerateClick(content); // Auto-generate map after fetching
        } else {
            setFetchError("Could not retrieve content from the URL. The page might be protected, a video, or require a login.");
        }
    } catch (err: any) {
        setFetchError(err.message || "An unknown error occurred while fetching the article.");
    } finally {
        setIsFetching(false);
    }
  };
  
  const handleRelatedTopicClick = async (topic: string) => {
    setLoadingTopic(topic);
    setUrl('');
    setInputText(topic);
    await handleGenerateClick(topic);
    setLoadingTopic(null);
  };

  const handleClear = () => {
    setInputText('');
    setUrl('');
    setGraphData(null);
    setRelatedTopics([]);
    setError(null);
    setFetchError(null);
    setIsLoading(false);
    setIsFetching(false);
  };

  const handleExportSVG = () => mindMapRef.current?.exportAsSVG();
  const handleExportPNG = () => mindMapRef.current?.exportAsPNG();

  const WelcomeState = () => (
    <div className="text-center text-gray-500 py-16 animate-fade-in">
        <div className="inline-block p-4 bg-gray-800/50 rounded-full">
            <svg className="w-16 h-16" viewBox="0 0 100 100"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#22d3ee"/><stop offset="100%" stop-color="#3b82f6"/></linearGradient></defs><style>{`.line { stroke: url(#grad); stroke-width: 4; } .circle { fill: url(#grad); }`}</style><line className="line" x1="50" y1="50" x2="25" y2="25"/><line className="line" x1="50" y1="50" x2="75" y2="25"/><line className="line" x1="50" y1="50" x2="25" y2="75"/><line className="line" x1="50" y1="50" x2="75" y2="75"/><line className="line" x1="25" y1="25" x2="50" y2="15"/><line className="line" x1="75" y1="25" x2="50" y2="15"/><circle className="circle" cx="50" cy="50" r="10"/><circle className="circle" cx="25" cy="25" r="8"/><circle className="circle" cx="75" cy="25" r="8"/><circle className="circle" cx="25" cy="75" r="8"/><circle className="circle" cx="75" cy="75" r="8"/><circle className="circle" cx="50" cy="15" r="6"/></svg>
        </div>
      <p className="text-2xl mt-4">Your concept map will appear here.</p>
      <p>Enter some text or a URL above to begin your exploration.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            Research Rabbit Hole
          </h1>
          <p className="mt-3 text-lg text-gray-400 max-w-2xl mx-auto">
            Paste an article or question to visualize key concepts and their connections.
          </p>
        </header>

        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-2xl border border-gray-700">
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Or paste an article URL to summarize..." className="flex-grow p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors duration-200" disabled={isLoading || isFetching} aria-label="Article URL" />
            <button onClick={handleFetchClick} disabled={isLoading || isFetching} className="px-5 py-3 bg-gray-700 text-white font-bold rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105">
              {isFetching ? <><Spinner className="h-5 w-5" /> Fetching...</> : <><LinkIcon className="h-5 w-5" /> Fetch & Map</>}
            </button>
          </div>
          {fetchError && <div className="mt-3 bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg text-sm"><p><span className="font-bold">Error:</span> {fetchError}</p></div>}
          <div className="relative flex py-4 items-center"><div className="flex-grow border-t border-gray-600"></div><span className="flex-shrink mx-4 text-gray-500 text-sm font-semibold">OR PASTE TEXT BELOW</span><div className="flex-grow border-t border-gray-600"></div></div>
          <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder={placeholderText} className="w-full h-48 p-4 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-y transition-colors duration-200" disabled={isLoading || isFetching} aria-label="Text to analyze"/>
          <div className="mt-4 flex flex-col sm:flex-row justify-end gap-3">
            <button onClick={handleClear} disabled={isLoading || isFetching} className="px-5 py-3 bg-gray-700 text-white font-bold rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105">
                <ClearIcon className="h-5 w-5" /> Clear
            </button>
            <button onClick={() => handleGenerateClick()} disabled={isLoading || isFetching || !inputText.trim()} className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg shadow-lg hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105">
              {isLoading && !loadingTopic ? <><Spinner className="h-5 w-5" /> Analyzing...</> : <><GenerateIcon className="h-5 w-5" /> Generate Map</>}
            </button>
          </div>
        </div>

        <div className="mt-12">
          {isLoading && <Loader />}
          {error && <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg text-center animate-fade-in"><p className="font-bold">An Error Occurred</p><p>{error}</p></div>}
          {!isLoading && !error && !graphData && <WelcomeState />}

          {graphData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
              <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-cyan-300">Concept Map</h2>
                  <div className="flex gap-2">
                    <button onClick={handleExportSVG} className="px-4 py-2 text-sm bg-gray-700 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-colors flex items-center gap-2"><SvgIcon className="h-4 w-4" /> SVG</button>
                    <button onClick={handleExportPNG} className="px-4 py-2 text-sm bg-gray-700 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-colors flex items-center gap-2"><PngIcon className="h-4 w-4" /> PNG</button>
                  </div>
                </div>
                <MindMap ref={mindMapRef} data={graphData} />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-4 text-cyan-300">Further Exploration</h2>
                <div className="bg-gray-800/60 p-4 rounded-lg border border-gray-700">
                  <ul className="space-y-2">
                    {relatedTopics.map((topic, index) => (
                      <li key={index}>
                        <button onClick={() => handleRelatedTopicClick(topic)} disabled={!!loadingTopic} className="w-full text-left p-3 rounded-md hover:bg-cyan-500/10 focus:bg-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all duration-200 disabled:opacity-60 disabled:hover:bg-transparent flex items-center gap-3">
                          {loadingTopic === topic ? <Spinner className="w-5 h-5 text-cyan-400 flex-shrink-0" /> : <TopicIcon className="w-5 h-5 text-cyan-400 flex-shrink-0" />}
                          <span className="text-gray-300">{topic}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;