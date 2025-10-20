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
- ระบุ tone เช่น สุภาพ, เครียด, ก้าวร้าว, เหนื่อยล้า
- ตรวจว่าพนักงานควบคุมอารมณ์ได้ดีหรือไม่

---

### 7. Keyword & Noise Detection
- ตรวจจับ Keyword ตามสคริปต์ เช่น Greeting, Product Name, ค่างวด, การชำระหนี้
- ตรวจจับเสียงแทรก เช่น คนที่สาม, เสียงทีวี, เสียงรบกวน
- ระบุว่ามีการพูดชน / ความเงียบยาวผิดปกติหรือไม่

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
    "Standard Script": {"score": 5, "remarks": "กล่าวสวัสดีและขอบคุณครบถ้วน"},
    "Presenting & Manners": {"score": 5, "remarks": "สุภาพ ไม่พูดชนลูกค้า"},
    "Call Handling Skill": {"score": 4, "remarks": "ตอบคำถามครบแต่พูดเร็วบางช่วง"},
    "Collection ACT": {"score": 5, "remarks": "ปฏิบัติตามกฎหมายครบ"},
    "Work Process": {"score": 4, "remarks": "ยังไม่ยืนยันการบันทึกข้อมูล"},
    "Emotional Detection": {
      "agent_tone": "สุภาพ",
      "customer_tone": "ไม่พอใจบางช่วง"
    }
  },
  "keywords_detected": ["สวัสดี", "ขอบคุณ", "ค่างวด", "ส่งเรื่องประสานงาน"],
  "issues_found": ["พูดเร็วในช่วงกลาง", "เสียงแทรกจากบุคคลที่สาม"],
  "recommendations": [
    "ปรับจังหวะการพูดให้ช้าลงเล็กน้อย",
    "เพิ่มการยืนยันการบันทึกข้อมูลก่อนจบสาย"
  ]
}

---

INSTRUCTION:
1. อ่าน transcript ทั้งหมด (Agent / Customer)
2. ประเมินตามหัวข้อ 1–9 ข้างต้น
3. ให้ผลลัพธ์เป็น JSON เดียวตามโครงสร้างตัวอย่าง
4. ใช้ภาษากลาง (ไม่ใช้คำสั่ง markdown หรือ bullet point เพิ่มเติม)`;

const Evaluation: React.FC = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState<string>(PROMPT_TEMPLATE);
  const [scoringResult, setScoringResult] = useState<any | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // if (file) {
    //   if (
    //     file.type === 'audio/wav' ||
    //     file.type === 'audio/wave' ||
    //     file.type === 'audio/mp4' ||
    //     file.type === 'video/mp4' ||
    //     file.type === 'audio/mp3'
    //   ) {
    //     setAudioFile(file);
    //     setError(null);
    //   } else {
    //     setError('Please upload a valid .wav/mp4 file.');
    //     setAudioFile(null);
    //   }
    // }
    setAudioFile(file);
  };

  const { config } = useConfig();

  const handleScore = useCallback(async () => {
    if (!audioFile) {
      setError('Please upload an audio file first.');
      return;
    }
    if (!prompt.trim()) {
      setError('Please provide scoring instructions.');
      return;
    }
    if (!process.env.GEMINI_API_KEY) {
      setError('API_KEY environment variable not found.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setScoringResult(null);

    try {
      const audioBase64 = await fileToBase64(audioFile);

      // Append the active configuration to the prompt so the scoring service
      // knows which criteria and weights to apply.
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
      // Try to parse JSON result. If parsing fails, keep raw string.
      try {
        const parsed = JSON.parse(result);
        setScoringResult(parsed);
      } catch {
        setScoringResult(result);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(`Failed to score conversation: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [audioFile, prompt]);

  return (
    <>
      <div className='min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8'>
        <div className='w-full'>
          <main className='space-y-8'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
              {/* Left Column: Input */}
              <div className='bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-700 space-y-6'>
                <div>
                  <label className='text-lg font-semibold text-gray-300 mb-2 block'>
                    1. Upload Conversation
                  </label>
                  <label
                    htmlFor='file-upload'
                    className='flex flex-col items-center justify-center w-full h-32 px-4 transition bg-gray-800 border-2 border-gray-600 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-500 focus:outline-none'>
                    <UploadIcon />
                    <span className='flex items-center space-x-2 mt-2'>
                      <span className='font-medium text-gray-400'>
                        {audioFile
                          ? audioFile.name
                          : 'Drop a .wav file or click to upload'}
                      </span>
                    </span>
                    <input
                      id='file-upload'
                      type='file'
                      accept='.wav,audio/wav'
                      className='hidden'
                      onChange={handleFileChange}
                    />
                  </label>
                </div>

                <div>
                  <label
                    htmlFor='prompt-input'
                    className='text-lg font-semibold text-gray-300 mb-2 block'>
                    2. Provide Scoring Instructions
                  </label>
                  <textarea
                    id='prompt-input'
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Score the agent's empathy on a scale of 1-10. Did the agent resolve the customer's issue? Was the tone professional?"
                    className='w-full h-48 p-4 bg-gray-800 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 resize-none placeholder-gray-500'
                  />
                </div>

                <button
                  onClick={handleScore}
                  disabled={isLoading || !audioFile || !prompt}
                  className='w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors'>
                  {isLoading ? (
                    <>
                      <LoadingSpinner />
                      Scoring...
                    </>
                  ) : (
                    'Score Conversation'
                  )}
                </button>
              </div>

              {/* Right Column: Output */}
              <div className='bg-gray-800/50 p-6 rounded-2xl col-span-2 shadow-lg border border-gray-700'>
                <h2 className='text-lg font-semibold text-gray-300 mb-4'>
                  3. Scoring Result
                </h2>
                <div className='bg-gray-900/70 p-4 rounded-md h-[420px] overflow-y-auto prose prose-invert prose-sm max-w-none'>
                  {isLoading && (
                    <div className='flex flex-col items-center justify-center h-full text-gray-400'>
                      <LoadingSpinner />
                      <p className='mt-2'>Gemini is analyzing the audio...</p>
                    </div>
                  )}
                  {error && (
                    <div className='text-red-400 whitespace-pre-wrap'>
                      {error}
                    </div>
                  )}
                  {scoringResult && (
                    <div>
                      <div className='flex items-center justify-between mb-3'>
                        <div className='text-sm text-gray-400'>Result</div>
                        <div>
                          <button
                            onClick={() => setShowRawJson((s) => !s)}
                            className='text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700'>
                            {showRawJson ? 'Hide raw JSON' : 'View raw JSON'}
                          </button>
                        </div>
                      </div>

                      {showRawJson && (
                        <pre className='whitespace-pre-wrap text-xs bg-gray-900/50 p-3 rounded-md overflow-auto'>
                          {typeof scoringResult === 'string'
                            ? scoringResult
                            : JSON.stringify(scoringResult, null, 2)}
                        </pre>
                      )}

                      {!showRawJson && typeof scoringResult === 'object' && (
                        <div className='space-y-4'>
                          {/* Summary row */}
                          <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                            <div className='p-3 bg-gray-800 rounded-md border border-gray-700'>
                              <div className='text-xs text-gray-400'>Agent</div>
                              <div className='font-semibold'>
                                {scoringResult.agent_id || '-'}
                              </div>
                            </div>
                            <div className='p-3 bg-gray-800 rounded-md border border-gray-700'>
                              <div className='text-xs text-gray-400'>
                                Overall Score
                              </div>
                              <div className='font-semibold'>
                                {scoringResult.overall_score ?? '-'}
                              </div>
                            </div>
                            <div className='p-3 bg-gray-800 rounded-md border border-gray-700'>
                              <div className='text-xs text-gray-400'>Grade</div>
                              <div className='font-semibold'>
                                {scoringResult.grade || '-'}
                              </div>
                            </div>
                          </div>

                          {/* Per-criterion table */}
                          <div className='p-3 bg-gray-800 rounded-md border border-gray-700'>
                            <div className='text-sm font-semibold mb-2'>
                              Per-criterion Scores
                            </div>
                            <div className='w-full overflow-auto'>
                              <table className='w-full table-auto text-left text-sm'>
                                <thead>
                                  <tr className='text-xs text-gray-400'>
                                    <th className='px-3 py-2'>Criterion</th>
                                    <th className='px-3 py-2'>Score</th>
                                    <th className='px-3 py-2'>Remarks</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {scoringResult.evaluation &&
                                    Object.entries(
                                      scoringResult.evaluation
                                    ).map(([key, val]: any) => (
                                      <tr
                                        key={key}
                                        className='even:bg-gray-900/40'>
                                        <td className='px-3 py-2 align-top'>
                                          {key}
                                        </td>
                                        <td className='px-3 py-2 align-top'>
                                          {val &&
                                          typeof val === 'object' &&
                                          'score' in val
                                            ? val.score
                                            : typeof val === 'number'
                                            ? val
                                            : '-'}
                                        </td>
                                        <td className='px-3 py-2 align-top text-sm text-gray-300'>
                                          {val &&
                                          typeof val === 'object' &&
                                          val.remarks
                                            ? val.remarks
                                            : typeof val === 'string'
                                            ? val
                                            : ''}
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Keywords / Issues / Recommendations */}
                          <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                            <div className='p-3 bg-gray-800 rounded-md border border-gray-700'>
                              <div className='text-xs text-gray-400'>
                                Keywords
                              </div>
                              <div className='text-sm text-gray-200 mt-2'>
                                {(scoringResult.keywords_detected || []).join(
                                  ', '
                                ) || '-'}
                              </div>
                            </div>
                            <div className='p-3 bg-gray-800 rounded-md border border-gray-700'>
                              <div className='text-xs text-gray-400'>
                                Issues Found
                              </div>
                              <ul className='text-sm text-gray-200 list-disc list-inside mt-2'>
                                {(scoringResult.issues_found || []).length >
                                0 ? (
                                  (scoringResult.issues_found || []).map(
                                    (it: string, i: number) => (
                                      <li key={i}>{it}</li>
                                    )
                                  )
                                ) : (
                                  <li>-</li>
                                )}
                              </ul>
                            </div>
                            <div className='p-3 bg-gray-800 rounded-md border border-gray-700'>
                              <div className='text-xs text-gray-400'>
                                Recommendations
                              </div>
                              <ul className='text-sm text-gray-200 list-disc list-inside mt-2'>
                                {(scoringResult.recommendations || []).length >
                                0 ? (
                                  (scoringResult.recommendations || []).map(
                                    (it: string, i: number) => (
                                      <li key={i}>{it}</li>
                                    )
                                  )
                                ) : (
                                  <li>-</li>
                                )}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* fallback for non-JSON result */}
                      {!showRawJson && typeof scoringResult === 'string' && (
                        <pre className='whitespace-pre-wrap text-sm bg-gray-900/50 p-3 rounded-md overflow-auto'>
                          {scoringResult}
                        </pre>
                      )}
                    </div>
                  )}
                  {!isLoading && !error && !scoringResult && (
                    <div className='flex items-center justify-center h-full text-gray-500'>
                      <p>Your analysis will appear here.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default Evaluation;
