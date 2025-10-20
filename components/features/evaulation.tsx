import React, { useState, useCallback } from 'react';
import { scoreConversation } from '../../services/geminiService';
import { fileToBase64 } from '../../utils/fileUtils';
import { UploadIcon } from '../../components/icons/UploadIcon';
import { LoadingSpinner } from '../../components/icons/LoadingSpinner';
import { useConfig } from '../context/ConfigContext';

const PROMPT_TEMPLATE = `SYSTEM ROLE:
คุณคือ AI Voice Quality Evaluator สำหรับฝ่ายติดตามหนี้ (Phone Collection)
... (your original long template here) ...
`;

// --- Clean JSON wrapper from Gemini output ---
const extractCleanJSON = (raw: string): any | null => {
  try {
    // Remove markdown code fences like ```json ... ```
    let cleaned = raw
      .replace(/^[\s\S]*?```json/i, '') // remove everything before ```json
      .replace(/```$/, '') // remove trailing ```
      .replace(/```/g, '') // remove stray ```
      .trim();

    // Try direct parse
    return JSON.parse(cleaned);
  } catch {
    try {
      // Fallback: extract substring between first { and last }
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
  return null;
};

const Evaluation: React.FC = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState<string>(PROMPT_TEMPLATE);
  const [scoringResult, setScoringResult] = useState<any | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { config } = useConfig();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setAudioFile(file);
  };

  const handleScore = useCallback(async () => {
    if (!audioFile) return setError('Please upload an audio file first.');
    if (!prompt.trim()) return setError('Please provide scoring instructions.');

    setIsLoading(true);
    setError(null);
    setScoringResult(null);

    try {
      const audioBase64 = await fileToBase64(audioFile);
      const activeCriteria = config.criteria
        .filter((c) => c.enabled)
        .map((c) => ({ key: c.key, weight: c.weight }));

      const promptWithConfig = `${prompt}\n\nCONFIG: ${JSON.stringify({
        criteria: activeCriteria,
      })}`;

      const result = await scoreConversation(
        promptWithConfig,
        audioBase64,
        audioFile.type
      );

      const parsed = extractCleanJSON(result);
      setScoringResult(parsed ?? result);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(`Failed to score conversation: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  }, [audioFile, prompt, config]);

  // --- Render ---
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full">
        <main className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-700 space-y-6">
              <div>
                <label className="text-lg font-semibold text-gray-300 mb-2 block">
                  1. Upload Conversation
                </label>
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-gray-800 border-2 border-gray-600 border-dashed rounded-md cursor-pointer hover:border-gray-500 focus:outline-none"
                >
                  <UploadIcon />
                  <span className="font-medium text-gray-400 mt-2">
                    {audioFile ? audioFile.name : 'Drop a .wav file or click to upload'}
                  </span>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".wav,audio/wav"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              <div>
                <label className="text-lg font-semibold text-gray-300 mb-2 block">
                  2. Provide Scoring Instructions
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-48 p-4 bg-gray-800 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 transition-shadow resize-none placeholder-gray-500"
                />
              </div>

              <button
                onClick={handleScore}
                disabled={isLoading || !audioFile || !prompt}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner /> Scoring...
                  </>
                ) : (
                  'Score Conversation'
                )}
              </button>
            </div>

            {/* Right Column */}
            <div className="bg-gray-800/50 p-6 rounded-2xl col-span-2 shadow-lg border border-gray-700">
              <h2 className="text-lg font-semibold text-gray-300 mb-4">
                3. Scoring Result
              </h2>
              <div className="bg-gray-900/70 p-4 rounded-md h-[420px] overflow-y-auto">
                {isLoading && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <LoadingSpinner />
                    <p className="mt-2">Gemini is analyzing the audio...</p>
                  </div>
                )}

                {error && <div className="text-red-400">{error}</div>}

                {!isLoading && scoringResult && typeof scoringResult === 'object' && (
                  <div className="space-y-4 text-gray-100">
                    {/* Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 bg-gray-800 rounded-md border border-gray-700">
                        <div className="text-xs text-gray-400">Agent</div>
                        <div className="font-semibold text-blue-400">
                          {scoringResult.agent_id || '-'}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-800 rounded-md border border-gray-700">
                        <div className="text-xs text-gray-400">Overall Score</div>
                        <div className="font-semibold text-green-400">
                          {scoringResult.overall_score ?? '-'}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-800 rounded-md border border-gray-700">
                        <div className="text-xs text-gray-400">Grade</div>
                        <div className="font-semibold text-yellow-400">
                          {scoringResult.grade || '-'}
                        </div>
                      </div>
                    </div>

                    {/* Evaluation Table */}
                    {scoringResult.evaluation && (
                      <div className="p-3 bg-gray-800 rounded-md border border-gray-700">
                        <div className="text-sm font-semibold mb-2 text-blue-300">
                          Evaluation Criteria
                        </div>
                        <table className="w-full table-auto text-left text-sm border-collapse">
                          <thead>
                            <tr className="text-xs text-gray-400 border-b border-gray-700">
                              <th className="px-3 py-2">Criterion</th>
                              <th className="px-3 py-2">Score</th>
                              <th className="px-3 py-2">Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(scoringResult.evaluation).map(([key, val]: any) => (
                              <tr key={key} className="border-b border-gray-700">
                                <td className="px-3 py-2 font-medium">{key}</td>
                                <td className="px-3 py-2 text-center">
                                  {val?.score ?? '-'}
                                </td>
                                <td className="px-3 py-2 text-gray-300">
                                  {val?.remarks ?? ''}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Keywords / Issues / Recommendations */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 bg-gray-800 rounded-md border border-gray-700">
                        <div className="text-xs text-gray-400">Keywords</div>
                        <div className="text-sm mt-2">
                          {(scoringResult.keywords_detected || []).join(', ') || '-'}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-800 rounded-md border border-gray-700">
                        <div className="text-xs text-gray-400">Issues Found</div>
                        <ul className="list-disc list-inside text-sm mt-2">
                          {(scoringResult.issues_found || []).length
                            ? scoringResult.issues_found.map((x: string, i: number) => (
                                <li key={i}>{x}</li>
                              ))
                            : <li>-</li>}
                        </ul>
                      </div>
                      <div className="p-3 bg-gray-800 rounded-md border border-gray-700">
                        <div className="text-xs text-gray-400">Recommendations</div>
                        <ul className="list-disc list-inside text-sm mt-2">
                          {(scoringResult.recommendations || []).length
                            ? scoringResult.recommendations.map((x: string, i: number) => (
                                <li key={i}>{x}</li>
                              ))
                            : <li>-</li>}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {!isLoading && !error && !scoringResult && (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>Your analysis will appear here.</p>
                  </div>
                )}

                {/* Raw JSON toggle */}
                {!isLoading && typeof scoringResult === 'string' && (
                  <pre className="whitespace-pre-wrap text-xs bg-gray-900/50 p-3 rounded-md overflow-auto">
                    {scoringResult}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Evaluation;
