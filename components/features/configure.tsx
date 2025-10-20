import React from 'react';
import { useConfig } from '../context/ConfigContext';

const Configure: React.FC = () => {
  const { config, updateCriterion, resetConfig } = useConfig();

  const totalWeight = config.criteria.reduce(
    (s, c) => s + (c.enabled ? c.weight : 0),
    0
  );

  return (
    <div className='min-h-screen bg-gray-900 text-gray-200 p-6'>
      <div className='max-w-3xl mx-auto'>
        <h1 className='text-2xl font-bold mb-4'>Configure RCC Criteria</h1>

        <p className='text-sm text-gray-400 mb-6'>
          Toggle criteria on/off and adjust weights. Settings are saved to
          localStorage.
        </p>

        <div className='space-y-4'>
          {config.criteria.map((c) => (
            <div
              key={c.key}
              className='flex items-center justify-between bg-gray-800 p-3 rounded-md border border-gray-700'>
              <div>
                <div className='font-medium'>{c.label}</div>
                <div className='text-xs text-gray-400'>Key: {c.key}</div>
              </div>
              <div className='flex items-center space-x-3'>
                <label className='flex items-center space-x-2 text-sm'>
                  <input
                    type='checkbox'
                    checked={c.enabled}
                    onChange={(e) =>
                      updateCriterion(c.key, { enabled: e.target.checked })
                    }
                  />
                  <span className='text-sm'>Enabled</span>
                </label>
                <input
                  type='number'
                  min={0}
                  max={100}
                  value={c.weight}
                  onChange={(e) =>
                    updateCriterion(c.key, {
                      weight: Number(e.target.value || 0),
                    })
                  }
                  className='w-20 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm'
                />
              </div>
            </div>
          ))}

          <div className='flex items-center justify-between bg-gray-800 p-3 rounded-md border border-gray-700'>
            <div className='text-sm text-gray-300'>
              Total weight of enabled criteria
            </div>
            <div
              className={`font-medium ${
                totalWeight !== 100 ? 'text-yellow-300' : 'text-green-300'
              }`}>
              {totalWeight}%
            </div>
          </div>

          <div className='flex space-x-2'>
            <button
              onClick={() => resetConfig()}
              className='px-4 py-2 bg-gray-700 rounded text-sm hover:bg-gray-600'>
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configure;
