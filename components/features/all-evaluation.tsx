import React, { useMemo, useState } from 'react';
import { useConfig } from '../context/ConfigContext';

type EvalRecord = {
  id: string;
  agent_id: string;
  date: string;
  overall_score: number;
  grade: string;
  evaluation: Record<string, { score: number; remarks?: string }>;
  keywords_detected: string[];
  issues_found: string[];
  recommendations: string[];
  transcript?: { speaker: 'agent' | 'customer'; text: string; time?: string }[];
};

const MOCK_EVALS: EvalRecord[] = [
  {
    id: 'EVAL-001',
    agent_id: 'AG001',
    date: '2025-10-10',
    overall_score: 92.5,
    grade: 'B',
    evaluation: {
      standard_script: { score: 5, remarks: 'Greeting + close OK' },
      presenting_manners: { score: 5, remarks: 'Polite, patient' },
      call_handling: { score: 4, remarks: 'Missing minor detail' },
      collection_act: { score: 5, remarks: 'Law-compliant' },
      work_process: { score: 4, remarks: 'Did not confirm system save' },
      emotional_detection: { score: 4, remarks: 'Calm but slightly rushed' },
      keyword_noise: { score: 4, remarks: 'Small background noise' },
      scoring_criteria: { score: 5, remarks: 'All meta checks passed' },
    },
    keywords_detected: ['สวัสดี', 'ขอบคุณ', 'ค่างวด'],
    issues_found: ['พูดเร็วบางช่วง'],
    recommendations: ['ชะลอจังหวะการพูด', 'ยืนยันการบันทึกข้อมูลก่อนวางสาย'],
    transcript: [
      {
        speaker: 'agent',
        text: 'สวัสดีค่ะ ผมชื่อสมชาย จากบริษัทไฟแนนซ์ ยืนยันตัวตนได้ไหมคะ',
        time: '09:01',
      },
      { speaker: 'customer', text: 'ใช่ ครับ ผมคือสมชาย', time: '09:02' },
      {
        speaker: 'agent',
        text: 'รายการคงค้างของคุณคือ 5,000 บาท ค้างมานาน 2 เดือน',
        time: '09:03',
      },
      {
        speaker: 'customer',
        text: 'ผมกำลังติดปัญหาชั่วคราว ขอผ่อนจ่ายได้ไหม',
        time: '09:04',
      },
      {
        speaker: 'agent',
        text: 'ได้ค่ะ ทางเรามีแผนผ่อน 3 เดือน ...',
        time: '09:05',
      },
    ],
  },
  {
    id: 'EVAL-002',
    agent_id: 'AG002',
    date: '2025-10-11',
    overall_score: 86.0,
    grade: 'C',
    evaluation: {
      standard_script: { score: 4, remarks: 'Missing formal close' },
      presenting_manners: { score: 4, remarks: 'Tone OK' },
      call_handling: { score: 4, remarks: 'Could probe more' },
      collection_act: { score: 5, remarks: 'OK' },
      work_process: { score: 3, remarks: 'No action recorded' },
      emotional_detection: { score: 4, remarks: 'Customer frustrated' },
      keyword_noise: { score: 5, remarks: 'Clean audio' },
      scoring_criteria: { score: 4, remarks: 'Minor deviations' },
    },
    keywords_detected: ['ค่างวด', 'ส่งเรื่อง'],
    issues_found: ['ไม่ยืนยันข้อมูลหลังแก้ไข'],
    recommendations: ['เพิ่มการสรุปก่อนจบสาย'],
    transcript: [
      {
        speaker: 'agent',
        text: 'สวัสดีค่ะ ติดต่อจากบริษัท ABC ค่ะ',
        time: '11:10',
      },
      { speaker: 'customer', text: 'รับทราบ มีอะไรครับ', time: '11:11' },
      { speaker: 'agent', text: 'ตรวจสอบยอดค้างชำระของท่าน...', time: '11:12' },
    ],
  },
  {
    id: 'EVAL-003',
    agent_id: 'AG003',
    date: '2025-10-12',
    overall_score: 78.2,
    grade: 'F',
    evaluation: {
      standard_script: { score: 2, remarks: 'No greeting' },
      presenting_manners: { score: 3, remarks: 'Abrupt tone' },
      call_handling: { score: 3, remarks: 'Missed key data' },
      collection_act: { score: 2, remarks: 'Potential compliance issue' },
      work_process: { score: 3, remarks: 'Missing notes' },
      emotional_detection: { score: 2, remarks: 'Escalating tone' },
      keyword_noise: { score: 3, remarks: 'Background voices' },
      scoring_criteria: { score: 2, remarks: 'Multiple deviations' },
    },
    keywords_detected: ['ทีวี', 'คนที่สาม'],
    issues_found: ['เสียงรบกวน อาจไม่ควรติดต่อ'],
    recommendations: ['ยกเลิกติดต่อในสภาพแวดล้อมนี้', 'ฝึกการใช้สคริปต์'],
    transcript: [
      { speaker: 'agent', text: 'สวัสดีค่ะ', time: '14:20' },
      { speaker: 'customer', text: '...', time: '14:21' },
      {
        speaker: 'agent',
        text: 'ผมจะติดต่อเกี่ยวกับยอดค้างชำระ',
        time: '14:22',
      },
      {
        speaker: 'customer',
        text: 'มีเสียงทีวีและคนเยอะ ๆ นะ ขอคุยต่ออีกทีได้ไหม',
        time: '14:23',
      },
    ],
  },
];

const AllEvaluation: React.FC = () => {
  const { config } = useConfig();
  const [selectedId, setSelectedId] = useState<string | null>(MOCK_EVALS[0].id);
  const [showTranscript, setShowTranscript] = useState(false);

  const selected = useMemo(
    () => MOCK_EVALS.find((m) => m.id === selectedId) || null,
    [selectedId]
  );

  const enabledCriteria = useMemo(
    () => config.criteria.filter((c) => c.enabled),
    [config]
  );

  return (
    <div className='min-h-screen bg-gray-900 text-gray-200 p-6'>
      <div className='max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-1 bg-gray-800 rounded-lg border border-gray-700 p-4'>
          <h2 className='text-lg font-semibold mb-3'>Evaluations</h2>
          <div className='space-y-2'>
            {MOCK_EVALS.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelectedId(e.id)}
                className={`w-full text-left p-3 rounded-md flex items-center justify-between hover:bg-gray-700/60 transition ${
                  selectedId === e.id
                    ? 'bg-cyan-700/20 ring-1 ring-cyan-600'
                    : ''
                }`}>
                <div>
                  <div className='font-medium'>
                    {e.agent_id} — {e.id}
                  </div>
                  <div className='text-xs text-gray-400'>{e.date}</div>
                </div>
                <div className='text-right'>
                  <div className='font-semibold'>{e.overall_score}%</div>
                  <div className='text-xs text-gray-400'>Grade {e.grade}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className='lg:col-span-2 bg-gray-800 rounded-lg border border-gray-700 p-6'>
          {!selected && (
            <div className='text-gray-400'>
              Select an evaluation to view details.
            </div>
          )}

          {selected && (
            <div className='space-y-4'>
              <div className='flex items-start justify-between'>
                <div>
                  <h3 className='text-2xl font-bold'>
                    {selected.agent_id} — {selected.id}
                  </h3>
                  <div className='text-sm text-gray-400'>{selected.date}</div>
                </div>
                <div className='text-right'>
                  <div className='text-3xl font-extrabold'>
                    {selected.overall_score}%
                  </div>
                  <div className='text-sm text-gray-400'>
                    Grade {selected.grade}
                  </div>
                </div>
              </div>

              <div className='flex space-x-2'>
                <button
                  onClick={() => setShowTranscript(true)}
                  className='px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-sm font-medium'>
                  View Transcript
                </button>
              </div>

              <section className='bg-gray-900/60 p-4 rounded-md border border-gray-700'>
                <h4 className='font-semibold mb-3'>Per-criterion scores</h4>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                  {enabledCriteria.map((c) => {
                    const rec = (selected.evaluation as any)[c.key];
                    const score = rec ? rec.score : null;
                    return (
                      <div
                        key={c.key}
                        className='p-3 bg-gray-800 rounded-md border border-gray-700'>
                        <div className='flex items-baseline justify-between'>
                          <div>
                            <div className='font-medium'>{c.label}</div>
                            <div className='text-xs text-gray-400'>
                              Weight: {c.weight}%
                            </div>
                          </div>
                          <div className='text-right'>
                            <div className='text-lg font-semibold'>
                              {score !== null ? score : '-'}/5
                            </div>
                            <div className='text-xs text-gray-400'>
                              Contrib:{' '}
                              {score !== null
                                ? ((Number(score) * c.weight) / 5).toFixed(1)
                                : '-'}
                            </div>
                          </div>
                        </div>
                        {rec?.remarks && (
                          <div className='mt-2 text-sm text-gray-300'>
                            {rec.remarks}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='bg-gray-900/60 p-4 rounded-md border border-gray-700'>
                  <h5 className='font-semibold mb-2'>Keywords</h5>
                  <div className='text-sm text-gray-300'>
                    {selected.keywords_detected.join(', ') || '-'}
                  </div>
                </div>
                <div className='bg-gray-900/60 p-4 rounded-md border border-gray-700'>
                  <h5 className='font-semibold mb-2'>Issues Found</h5>
                  <ul className='list-disc list-inside text-sm text-gray-300'>
                    {selected.issues_found.map((i, idx) => (
                      <li key={idx}>{i}</li>
                    ))}
                  </ul>
                </div>
                <div className='bg-gray-900/60 p-4 rounded-md border border-gray-700'>
                  <h5 className='font-semibold mb-2'>Recommendations</h5>
                  <ul className='list-disc list-inside text-sm text-gray-300'>
                    {selected.recommendations.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

      {/* Transcript Modal */}
      {showTranscript && selected && (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          <div
            className='absolute inset-0 bg-black/60'
            onClick={() => setShowTranscript(false)}
          />
          <div className='relative w-full max-w-3xl max-h-[80vh] bg-gray-900 rounded-lg border border-gray-700 overflow-hidden'>
            <div className='flex items-center justify-between p-4 border-b border-gray-800'>
              <div className='font-semibold'>Transcript — {selected.id}</div>
              <button
                onClick={() => setShowTranscript(false)}
                className='text-sm px-3 py-1 rounded bg-gray-800 hover:bg-gray-700'>
                Close
              </button>
            </div>
            <div className='p-4 overflow-y-auto h-[60vh] space-y-3'>
              {selected.transcript?.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    m.speaker === 'agent' ? 'justify-end' : 'justify-start'
                  }`}>
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-lg ${
                      m.speaker === 'agent'
                        ? 'bg-cyan-600 text-white rounded-br-none'
                        : 'bg-gray-800 text-gray-200 rounded-bl-none'
                    }`}>
                    <div className='text-sm'>{m.text}</div>
                    <div className='text-xs text-gray-400 mt-1 text-right'>
                      {m.time || ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllEvaluation;
