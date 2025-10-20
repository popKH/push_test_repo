import React, { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { scoreConversation } from '../../services/geminiService';
import { fileToBase64 } from '../../utils/fileUtils';
import { UploadIcon } from '../../components/icons/UploadIcon';
import { LoadingSpinner } from '../../components/icons/LoadingSpinner';
import { useConfig } from '../context/ConfigContext';

const PROMPT_TEMPLATE = `
SYSTEM ROLE:  
คุณคือ AI Voice Quality Evaluator สำหรับฝ่ายติดตามหนี้ (Phone Collection)  
ของธนาคาร / บริษัททางการเงิน โดยทำหน้าที่ประเมินคุณภาพการสนทนา  
ของเจ้าหน้าที่ Collector ตามเกณฑ์ RCC Voice Analytics 2024  

OBJECTIVE:  
ทำการวิเคราะห์บทสนทนาที่ได้จากการถอดเสียง (.wav → transcript)  
เพื่อประเมินพฤติกรรม การปฏิบัติตามกฎ ระดับความสุภาพ การใช้สคริปต์มาตรฐาน  
และการสื่อสารตาม พ.ร.บ.การติดตามทวงถามหนี้  

OUTPUT FORMAT:  
ให้ส่งผลลัพธ์เป็น JSON พร้อมรายละเอียดคะแนน เหตุผล และคำแนะนำพัฒนา  

-------------------------------------------  
EVALUATION CRITERIA (RCC Voice Analytics 2024)  
-------------------------------------------  

### 1. Standard Script  
ตรวจว่าพนักงานปฏิบัติตามสคริปต์มาตรฐานในการสนทนาหรือไม่  
- 1.1 กล่าว “สวัสดี” เปิดสาย และ “ขอบคุณ” ปิดสายสนทนา  
- 1.2 ประสานงานไปยังหน่วยงานที่เกี่ยวข้อง (ถ้ามี)  
- 1.3 กล่าวพักสายตามมาตรฐานที่กำหนด  

**โฟกัสการตรวจ:**  
Keyword detection ("สวัสดี", "ขอบคุณ", "ขออนุญาตพักสาย")  
และลำดับการพูด (ต้องมีตอนต้นและตอนจบ)  

---  

### 2. Presenting & Manners  
ตรวจสอบท่าทีและมารยาทของเจ้าหน้าที่  
- 2.1 น้ำเสียงสุภาพ เหมาะสม  
- 2.2 ภาษาสุภาพ ไม่ประชดประชัน ยอกย้อน หรือเสียดสี  
- 2.3 การรับฟังลูกค้า ไม่พูดแทรกหรือพูดชน  

**โฟกัสการตรวจ:**  
Emotion, tone, pause detection, speech overlap, sentiment polarity  

---  

### 3. Call Handling Skill  
ตรวจสอบทักษะในการจัดการสาย  
- 3.1 แจ้งข้อมูลครบถ้วน เช่น ค่างวด, ค่าปรับล่าช้า, ค่าติดตามทวงถาม  
- 3.2 จับประเด็นและวิเคราะห์ความต้องการของลูกค้าได้อย่างรวดเร็ว  
- 3.3 สอบถามชื่อคู่สนทนา และความสัมพันธ์บุคคลที่ 3  
- 3.4 ถ่ายทอดข้อมูลเป็นลำดับขั้นตอนและเข้าใจง่าย  
- 3.5 แก้ปัญหา แสดงความช่วยเหลือ หรือเสนอทางเลือกที่เหมาะสม  

**โฟกัสการตรวจ:**  
Keyword completeness, reasoning, empathy, coherence  

---  

### 4. Collection ACT (กฎหมายทวงถามหนี้)  
ตรวจว่าพนักงานปฏิบัติตามข้อกำหนดของ พ.ร.บ. ติดตามทวงถามหนี้  
- 4.1 ติดต่อเฉพาะช่องทางที่ลูกหนี้ให้ไว้เท่านั้น  
- 4.2 แจ้งชื่อตัว-สกุลของตนเองก่อนเริ่มแจ้งข้อมูลลูกค้า  
- 4.3 ยืนยันตัวตนลูกหนี้ (เช่น ถามชื่อ-นามสกุล หรือผู้ค้ำ)  
- 4.4 ไม่พูดข่มขู่ ดูหมิ่น หรือทำให้ลูกหนี้เสียหาย  
- 4.5 แจ้งข้อมูลกับผู้เกี่ยวข้องเท่าที่จำเป็นเท่านั้น  

**โฟกัสการตรวจ:**  
Keyword & tone compliance, emotion detection, script conformity  

---  

### 5. Work Process  
ตรวจการปฏิบัติตามขั้นตอนงาน (อิงตาม transcript ที่ปรากฏ)  
- 5.1 การบันทึกข้อมูลหรือสรุปการดำเนินการในระบบครบถ้วน  
- 5.2 การประสานงานกับหน่วยงานอื่นถูกต้องครบถ้วน  

**โฟกัสการตรวจ:**  
Action confirmation phrases เช่น “จะบันทึกข้อมูลให้ค่ะ”, “จะส่งเรื่องให้หน่วยงานที่เกี่ยวข้อง”  

---  

### 6. Emotional Detection  
วิเคราะห์อารมณ์ของพนักงานและลูกค้าในแต่ละช่วง  
- 6.1 ระบุ tone เช่น สุภาพ, เครียด, ก้าวร้าว, เหนื่อยล้า  
- 6.2 ตรวจว่าพนักงานควบคุมอารมณ์ได้ดีหรือไม่  

---  

### 7. Keyword & Noise Detection  
- 7.1 ตรวจจับ Keyword ตามสคริปต์ เช่น Greeting, Product Name, ค่างวด, การชำระหนี้  
- 7.2 ตรวจจับเสียงแทรก เช่น คนที่สาม, เสียงทีวี, เสียงรบกวน  
- 7.3 ระบุว่ามีการพูดชน / ความเงียบยาวผิดปกติหรือไม่  

---  

### 8. Scoring Criteria  
ให้คะแนนในแต่ละหมวด 0–5 (หรือ “Y/N” สำหรับผ่าน–ไม่ผ่าน)  
พร้อมคำนวณเปอร์เซ็นต์รวมตามเกณฑ์:  
- A: >95.00% (ดีเยี่ยม)  
- B: 90.00–94.99% (ดี)  
- C: 85.00–89.99% (ผ่านเกณฑ์มาตรฐาน)  
- D: 80.00–84.99% (ต่ำกว่าเกณฑ์)  
- F: <=79.99% (ต้องปรับปรุง)  
- Complaint: หากพบพฤติกรรมผิดจริง  

---  

### 9. Expected JSON Output Example  

{
  "agent_id": "AG001",
  "overall_score": 92.5,
  "grade": "B",
  "evaluation": {
    "1. Standard Script": {
      "score": 5,
      "remarks": "กล่าวสวัสดีและขอบคุณครบถ้วน",
      "subcriteria": {
        "1.1 Greeting & Closing": {"score": 5, "remarks": "มีการกล่าวสวัสดีและขอบคุณครบ"},
        "1.2 Coordination": {"score": 5, "remarks": "ประสานงานตามขั้นตอนถูกต้อง"},
        "1.3 Hold Script": {"score": 4, "remarks": "มีการพักสายแต่ไม่แจ้งเวลาโดยประมาณ"}
      }
    },
    "2. Presenting & Manners": {
      "score": 5,
      "remarks": "น้ำเสียงและภาษาที่ใช้สุภาพ เหมาะสม",
      "subcriteria": {
        "2.1 Tone": {"score": 5, "remarks": "สุภาพและชัดเจน"},
        "2.2 Language": {"score": 5, "remarks": "ไม่มีการประชดประชัน"},
        "2.3 Listening": {"score": 5, "remarks": "ตั้งใจรับฟัง ไม่พูดชน"}
      }
    },
    "3. Call Handling Skill": {
      "score": 4,
      "remarks": "ตอบคำถามครบแต่พูดเร็วบางช่วง",
      "subcriteria": {
        "3.1 Information Accuracy": {"score": 5, "remarks": "แจ้งข้อมูลครบถ้วน"},
        "3.2 Comprehension": {"score": 4, "remarks": "เข้าใจประเด็นลูกค้าได้ถูกต้อง"},
        "3.3 Identification": {"score": 4, "remarks": "สอบถามชื่อและความสัมพันธ์ลูกค้าชัดเจน"},
        "3.4 Explanation": {"score": 3, "remarks": "การอธิบายเร็วเล็กน้อย"},
        "3.5 Problem Solving": {"score": 4, "remarks": "เสนอแนวทางช่วยเหลือที่เหมาะสม"}
      }
    },
    "4. Collection ACT": {
      "score": 5,
      "remarks": "ปฏิบัติตามกฎหมายครบถ้วน",
      "subcriteria": {
        "4.1 Contact Channel": {"score": 5, "remarks": "โทรตามช่องทางที่ลูกค้าอนุญาต"},
        "4.2 Self-Identification": {"score": 5, "remarks": "แจ้งชื่อตนเองครบถ้วน"},
        "4.3 Customer Verification": {"score": 5, "remarks": "ยืนยันตัวลูกหนี้ก่อนเปิดเผยข้อมูล"},
        "4.4 Tone Compliance": {"score": 5, "remarks": "ไม่มีการข่มขู่หรือดูหมิ่น"},
        "4.5 Information Disclosure": {"score": 5, "remarks": "ไม่เปิดเผยข้อมูลเกินจำเป็น"}
      }
    },
    "5. Work Process": {
      "score": 4,
      "remarks": "ยังไม่ยืนยันการบันทึกข้อมูลในระบบ",
      "subcriteria": {
        "5.1 Record Keeping": {"score": 4, "remarks": "แจ้งว่าจะบันทึกข้อมูลแต่ยังไม่ยืนยัน"},
        "5.2 Coordination": {"score": 5, "remarks": "ประสานงานกับหน่วยงานถูกต้อง"}
      }
    },
    "6. Emotional Detection": {
      "score": 5,
      "remarks": "ทั้งคู่มีอารมณ์สุภาพตลอดการสนทนา",
      "subcriteria": {
        "6.1 Tone Identification": {"score": 5, "remarks": "ระบุ tone ได้ถูกต้อง"},
        "6.2 Control": {"score": 5, "remarks": "ควบคุมอารมณ์ได้ดี"}
      }
    },
    "7. Keyword & Noise Detection": {
      "score": 4,
      "remarks": "มีเสียงรบกวนบางช่วง แต่ไม่กระทบความเข้าใจ",
      "subcriteria": {
        "7.1 Keyword Detection": {"score": 5, "remarks": "ตรวจจับ keyword ครบ"},
        "7.2 Noise Detection": {"score": 4, "remarks": "มีเสียงรบกวนเล็กน้อย"},
        "7.3 Overlap/Silence": {"score": 4, "remarks": "มีพูดชนเล็กน้อย"}
      }
    }
  },
  "keywords_detected": ["สวัสดี", "ขอบคุณ", "ค่างวด", "ส่งเรื่องประสานงาน"],
  "issues_found": ["พูดเร็วในช่วงกลาง", "เสียงแทรกจากบุคคลที่สาม"],
  "recommendations": [
    "ปรับจังหวะการพูดให้ช้าลงเล็กน้อย",
    "เพิ่มการยืนยันการบันทึกข้อมูลก่อนจบสาย"
  ]
}
`;



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
    setAudioFile(file);
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

      // 🧹 Clean Gemini response
      const cleanedResult = result
        .replace(/```json/i, '')
        .replace(/```/g, '')
        .trim();

      try {
        const parsed = JSON.parse(cleanedResult);
        setScoringResult(parsed);
      } catch {
        setScoringResult(cleanedResult);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(`Failed to score conversation: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [audioFile, prompt, config]);

  // --- Markdown renderer (kept from your version, safe to keep) ---
  const renderMarkdown = (text: string) => (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {text}
    </ReactMarkdown>
  );

  // --- UI ---
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full">
        <main className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column: Input */}
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
                    {audioFile
                      ? audioFile.name
                      : 'Drop a .wav file or click to upload'}
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
                  className="w-full h-48 p-4 bg-gray-800 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 resize-none placeholder-gray-500"
                />
              </div>

              <button
                onClick={handleScore}
                disabled={isLoading || !audioFile || !prompt}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
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

            {/* Right Column: Output */}
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

                {error && (
                  <div className="text-red-400 whitespace-pre-wrap">{error}</div>
                )}

                {scoringResult && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm text-gray-400">Result</div>
                      <button
                        onClick={() => setShowRawJson((s) => !s)}
                        className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700"
                      >
                        {showRawJson ? 'Hide Raw' : 'View Raw'}
                      </button>
                    </div>

                    {/* --- Raw String --- */}
                    {!showRawJson && typeof scoringResult === 'string' && (
                      <div className="space-y-4 text-sm leading-relaxed text-gray-100">
                        <h3 className="text-lg font-bold text-blue-400 mb-2">
                          AI Evaluation Summary
                        </h3>
                        <pre className="bg-gray-800/80 rounded-lg p-4 text-gray-200 whitespace-pre-wrap border border-gray-700 shadow-inner">
                          {scoringResult
                            .replace(/["{}]/g, '')
                            .replace(/\\n/g, '\n')
                            .replace(/,(?=\s*[A-Za-z0-9_"]+:)/g, '\n')}
                        </pre>
                      </div>
                    )}

                    {/* --- JSON Result --- */}
                    {!showRawJson && typeof scoringResult === 'object' && (
                      <div className="space-y-6 text-gray-100">
                        {/* Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="p-3 bg-gray-800 border border-gray-700 rounded-xl">
                            <div className="text-xs text-gray-400 uppercase">Agent</div>
                            <div className="font-semibold text-blue-400 text-lg">
                              {scoringResult.agent_id || '-'}
                            </div>
                          </div>
                          <div className="p-3 bg-gray-800 border border-gray-700 rounded-xl">
                            <div className="text-xs text-gray-400 uppercase">
                              Overall Score
                            </div>
                            <div className="font-bold text-green-400 text-lg">
                              {scoringResult.overall_score ?? '-'}
                            </div>
                          </div>
                          <div className="p-3 bg-gray-800 border border-gray-700 rounded-xl">
                            <div className="text-xs text-gray-400 uppercase">Grade</div>
                            <div className="font-bold text-yellow-400 text-lg">
                              {scoringResult.grade || '-'}
                            </div>
                          </div>
                        </div>

                        {/* Evaluation Table */}
                        {scoringResult.evaluation && (
                          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-md">
                            <h3 className="text-md font-semibold text-blue-300 mb-3">
                              Evaluation Details
                            </h3>
                            <table className="w-full text-left text-sm border-collapse">
                              <thead>
                                <tr className="border-b border-gray-700 text-gray-400 text-xs">
                                  <th className="py-2 px-3">Criterion</th>
                                  <th className="py-2 px-3 text-center">Score</th>
                                  <th className="py-2 px-3">Remarks</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(scoringResult.evaluation).map(
                                  ([key, val]: any) => (
                                    <React.Fragment key={key}>
                                      <tr className="border-b border-gray-700 hover:bg-gray-900/40 transition">
                                        <td className="py-2 px-3 font-medium text-gray-100">
                                          {key}
                                        </td>
                                        <td className="py-2 px-3 text-center text-green-300 font-semibold">
                                          {val?.score ?? '-'}
                                        </td>
                                        <td className="py-2 px-3 text-gray-300">
                                          {val?.remarks || '-'}
                                        </td>
                                      </tr>

                                      {val?.subcriteria &&
                                        Object.entries(val.subcriteria).map(
                                          ([subKey, subVal]: any) => (
                                            <tr
                                              key={subKey}
                                              className="border-b border-gray-800 bg-gray-800/60 hover:bg-gray-800/80 transition"
                                            >
                                              <td className="py-2 px-6 text-gray-300 text-sm">
                                                ↳ {subKey}
                                              </td>
                                              <td className="py-2 px-3 text-center text-blue-300 text-sm font-semibold">
                                                {subVal?.score ?? '-'}
                                              </td>
                                              <td className="py-2 px-3 text-gray-400 text-sm">
                                                {subVal?.remarks || '-'}
                                              </td>
                                            </tr>
                                          )
                                        )}
                                    </React.Fragment>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Keywords / Issues / Recommendations */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="p-3 bg-gray-800 border border-gray-700 rounded-xl">
                            <div className="text-xs text-gray-400 uppercase">Keywords</div>
                            <div className="text-sm mt-2 text-blue-200">
                              {(scoringResult.keywords_detected || []).join(', ') || '-'}
                            </div>
                          </div>
                          <div className="p-3 bg-gray-800 border border-gray-700 rounded-xl">
                            <div className="text-xs text-gray-400 uppercase">Issues Found</div>
                            <ul className="list-disc list-inside mt-2 text-sm text-red-300">
                              {(scoringResult.issues_found || []).length
                                ? scoringResult.issues_found.map((x: string, i: number) => (
                                    <li key={i}>{x}</li>
                                  ))
                                : <li>-</li>}
                            </ul>
                          </div>
                          <div className="p-3 bg-gray-800 border border-gray-700 rounded-xl">
                            <div className="text-xs text-gray-400 uppercase">
                              Recommendations
                            </div>
                            <ul className="list-disc list-inside mt-2 text-sm text-emerald-300">
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

                    {/* Raw JSON */}
                    {showRawJson && (
                      <pre className="whitespace-pre-wrap text-xs bg-gray-900/50 p-3 rounded-md overflow-auto border border-gray-700">
                        {typeof scoringResult === 'string'
                          ? scoringResult
                          : JSON.stringify(scoringResult, null, 2)}
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
