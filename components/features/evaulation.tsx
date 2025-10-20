import React, { useState, useCallback } from 'react';
import { scoreConversation } from '../../services/geminiService';
import { fileToBase64 } from '../../utils/fileUtils';
import { UploadIcon } from '../../components/icons/UploadIcon';
import { LoadingSpinner } from '../../components/icons/LoadingSpinner';
import { useConfig } from '../context/ConfigContext';

const PROMPT_TEMPLATE = `SYSTEM ROLE: 
คุณคือ AI Voice Quality Evaluator สำหรับฝ่ายติดตามหนี้ (Phone Collection)
ของธนาคาร / บริษัททางการเงิน โดยทำหน้าที่ประเมินคุณภาพการสนทนา 
ของเจ้าหน้าที่ Collector ตามเกณฑ์ RCC Voice Analytics 2024
... (your original long prompt remains here) ...
`;

const cleanJsonResponse = (raw: string) => {
  return raw
    .replace(/^```json\s*/i, '') // remove leading ```json
    .replace(/^```/, '') // remove just ```
    .replace(/```$/, '') // remove trailing ```
    .trim();
};

const Evaluation: React.FC = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState<string>(PROMPT_TEMPLATE);
  const [scoringResult, setScoringResult] = useState<any | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { config } = useConfig();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setAudioFile(file);
  };

  const handleScore = useCallback(async () => {
    if (!audioFile) {
      setError('Please upload an audio file first.');
      return;
    }
    if (!prompt.trim()) {
      setError('Please provide scoring instructions.');
      return;
    }

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

      // 🧹 Clean and parse JSON safely
      try {
        const clean = cleanJsonResponse(result);
        const parsed = JSON.parse(clean);
        if (parsed && typeof parsed === 'object') {
          setScoringResult(parsed);
        } else {
          setScoringResult(result);
        }
      } catch {
        // fallback: try to extract { ... } section
        const match = result.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            const parsed = JSON.parse(match[0]);
            setScoringResult(parsed);
          } catch {
            setScoringResult(result);
          }
        } else {
          setScoringResult(result);
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(`Failed to score conversation: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [audioFile, prompt, config]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full">
        <main className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* LEFT PANEL */}
            <div className="bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-700 space-y-6">
              <div>
                <label className="text-lg font-semibold text-gray-300 mb-2 block">
                  1. Upload Conversation
                </label>
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-gray-800 border-2 border-gray-600 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-500 focus:outline-none"
                >
                  <UploadIcon />
                  <span className="flex items-center space-x-2 mt-2">
                    <span className="font-medium text-gray-400">
                      {audioFile
                        ? audioFile.name
                        : 'Drop a .wav file or click to upload'}
                    </span>
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
                <label
                  htmlFor="prompt-input"
                  className="text-lg font-semibold text-gray-300 mb-2 block"
                >
                  2. Provide Scoring Instructions
                </label>
                <textarea
                  id="prompt-input"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-48 p-4 bg-gray-800 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 resize-none placeholder-gray-500"
                />
              </div>

              <button
                onClick={handleScore}
                disabled={isLoading || !audioFile || !prompt}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
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

            {/* RIGHT PANEL */}
            <div className="bg-gray-800/50 p-6 rounded-2xl col-span-2 shadow-lg border border-gray-700">
              <h2 className="text-lg font-semibold text-gray-300 mb-4">
                3. Scoring Result
              </h2>
              <div className="bg-gray-900/70 p-4 rounded-md h-[420px] overflow-y-auto prose prose-invert prose-sm max-w-none">
                {isLoading && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <LoadingSpinner />
                    <p className="mt-2">Gemini is analyzing the audio...</p>
                  </div>
                )}

                {error && (
                  <div className="text-red-400 whitespace-pre-wrap">{error}</div>
                )}

                {/* --- RESULT DISPLAY --- */}
                {scoringResult && !isLoading && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm text-gray-400">Result</div>
                      <div>
                        <button
                          onClick={() => setShowRawJson((s) => !s)}
                          className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700"
                        >
                          {showRawJson ? 'Hide raw JSON' : 'View raw JSON'}
                        </button>
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(
                              JSON.stringify(scoringResult, null, 2)
                            )
                          }
                          className="text-xs ml-2 px-2 py-1 rounded bg-gray-800 hover:bg-gray-700"
                        >
                          Copy JSON
                        </button>
                      </div>
                    </div>

                    {showRawJson ? (
                      <pre className="whitespace-pre-wrap text-xs bg-gray-900/50 p-3 rounded-md overflow-auto">
                        {typeof scoringResult === 'string'
                          ? scoringResult
                          : JSON.stringify(scoringResult, null, 2)}
                      </pre>
                    ) : typeof scoringResult === 'object' ? (
                      <div className="space-y-4 text-gray-100">
                        {/* SUMMARY */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="p-3 bg-gray-800 rounded-md border border-gray-700">
                            <div className="text-xs text-gray-400">Agent</div>
                            <div className="font-semibold text-blue-400">
                              {scoringResult.agent_id || '-'}
                            </div>
                          </div>
                          <div className="p-3 bg-gray-800 rounded-md border border-gray-700">
                            <div className="text-xs text-gray-400">
                              Overall Score
                            </div>
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

                        {/* EVALUATION TABLE */}
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
                                {Object.entries(scoringResult.evaluation).map(
                                  ([key, val]: any) => (
                                    <tr
                                      key={key}
                                      className="border-b border-gray-700"
                                    >
                                      <td className="px-3 py-2 font-medium text-gray-200">
                                        {key}
                                      </td>
                                      <td className="px-3 py-2 text-center text-gray-100">
                                        {val?.score ?? '-'}
                                      </td>
                                      <td className="px-3 py-2 text-gray-300">
                                        {val?.remarks ?? ''}
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Keywords / Issues / Recommendations */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="p-3 bg-gray-800 rounded-md border border-gray-700">
                            <div className="text-xs text-gray-400">
                              Keywords
                            </div>
                            <div className="text-sm mt-2">
                              {(scoringResult.keywords_detected || []).join(
                                ', '
                              ) || '-'}
                            </div>
                          </div>
                          <div className="p-3 bg-gray-800 rounded-md border border-gray-700">
                            <div className="text-xs text-gray-400">
                              Issues Found
                            </div>
                            <ul className="list-disc list-inside text-sm mt-2">
                              {(scoringResult.issues_found || []).length
                                ? scoringResult.issues_found.map(
                                    (x: string, i: number) => (
                                      <li key={i}>{x}</li>
                                    )
                                  )
                                : <li>-</li>}
                            </ul>
                          </div>
                          <div className="p-3 bg-gray-800 rounded-md border border-gray-700">
                            <div className="text-xs text-gray-400">
                              Recommendations
                            </div>
                            <ul className="list-disc list-inside text-sm mt-2">
                              {(scoringResult.recommendations || []).length
                                ? scoringResult.recommendations.map(
                                    (x: string, i: number) => (
                                      <li key={i}>{x}</li>
                                    )
                                  )
                                : <li>-</li>}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <pre className="whitespace-pre-wrap text-sm bg-gray-900/50 p-3 rounded-md overflow-auto">
                        {scoringResult}
                      </pre>
                    )}
                  </div>
                )}

                {!isLoading && !error && !scoringResult && (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>Your analysis will appear here.</p>
                  </div>
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
