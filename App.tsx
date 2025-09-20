import React, { useState, useRef } from 'react';
import { generateConceptMap, fetchArticleContent } from './services/geminiService';
import type { GraphData } from './types';
import MindMap, { type MindMapHandles } from './components/MindMap';
import Loader from './components/Loader';

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [relatedTopics, setRelatedTopics] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const mindMapRef = useRef<MindMapHandles>(null);

  const placeholderText = `Paste a complex article or research question here. For example:

"Quantum computing is a revolutionary computing paradigm that leverages principles of quantum mechanics, such as superposition and entanglement, to process information. Unlike classical computers that use bits (0s and 1s), quantum computers use qubits, which can exist in multiple states simultaneously. This allows them to perform complex calculations at speeds unattainable by classical machines. Key algorithms include Shor's algorithm for factoring large numbers and Grover's algorithm for searching unstructured databases. The development of stable, fault-tolerant quantum computers is a major challenge, with decoherence being a primary obstacle."`;

  const handleFetchClick = async () => {
    if (!url.trim()) {
        setFetchError("Please enter a URL.");
        return;
    }
    try {
        new URL(url);
    } catch (_) {
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
        } else {
            setFetchError("Could not retrieve any content from the URL. The page might be protected, a video, a PDF, or require a login.");
        }
    } catch (err: any) {
        setFetchError(err.message || "An unknown error occurred while fetching the article.");
    } finally {
        setIsFetching(false);
    }
  };

  const handleGenerateClick = async () => {
    if (!inputText.trim()) {
      setError("Please enter some text to analyze.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setFetchError(null);
    setGraphData(null);
    setRelatedTopics([]);

    try {
      const result = await generateConceptMap(inputText);
      setGraphData({
        nodes: result.concepts,
        links: result.relationships,
      });
      setRelatedTopics(result.relatedTopics);
    } catch (err: any) {
      setError(err.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportSVG = () => {
    mindMapRef.current?.exportAsSVG();
  };

  const handleExportPNG = () => {
    mindMapRef.current?.exportAsPNG();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
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
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Or paste an article URL to summarize..."
              className="flex-grow p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors duration-200"
              disabled={isLoading || isFetching}
              aria-label="Article URL"
            />
            <button
              onClick={handleFetchClick}
              disabled={isLoading || isFetching}
              className="px-6 py-3 bg-gray-700 text-white font-bold rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center transform hover:scale-105"
            >
              {isFetching ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Fetching...
                </>
              ) : 'Fetch & Summarize'}
            </button>
          </div>
          {fetchError && (
            <div className="mt-3 bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg text-sm">
              <p><span className="font-bold">Error:</span> {fetchError}</p>
            </div>
          )}

          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-gray-600"></div>
            <span className="flex-shrink mx-4 text-gray-500 text-sm font-semibold">OR PASTE TEXT BELOW</span>
            <div className="flex-grow border-t border-gray-600"></div>
          </div>
          
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={placeholderText}
            className="w-full h-48 p-4 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-y transition-colors duration-200"
            disabled={isLoading || isFetching}
            aria-label="Text to analyze"
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleGenerateClick}
              disabled={isLoading || isFetching || !inputText.trim()}
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg shadow-lg hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
            >
              {isLoading ? 'Analyzing...' : 'Generate Map'}
            </button>
          </div>
        </div>

        <div className="mt-12">
          {isLoading && <Loader />}
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg text-center">
              <p className="font-bold">An Error Occurred</p>
              <p>{error}</p>
            </div>
          )}
          
          {!isLoading && !error && !graphData && (
            <div className="text-center text-gray-500 py-16">
              <p className="text-2xl">Your concept map will appear here.</p>
              <p>Enter some text or a URL above and click "Generate Map" to begin your exploration.</p>
            </div>
          )}

          {graphData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-cyan-300">Concept Map</h2>
                  <div className="flex gap-2">
                    <button onClick={handleExportSVG} className="px-4 py-2 text-sm bg-gray-700 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-colors">
                      Export SVG
                    </button>
                    <button onClick={handleExportPNG} className="px-4 py-2 text-sm bg-gray-700 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-colors">
                      Export PNG
                    </button>
                  </div>
                </div>
                <MindMap ref={mindMapRef} data={graphData} />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-4 text-cyan-300">Related Topics</h2>
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <ul className="space-y-3">
                    {relatedTopics.map((topic, index) => (
                      <li key={index} className="flex items-start">
                         <svg className="w-5 h-5 mr-3 mt-1 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span className="text-gray-300">{topic}</span>
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
