import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SidebarMenu from './components/layout/sidebar';
import Evaluation from './components/features/evaulation';
import Dashboard from './components/features/dashboard';
import AllEvaluation from './components/features/all-evaluation';
import Configure from './components/features/configure';
import { ConfigProvider } from './components/context/ConfigContext';

const App: React.FC = () => {
  return (
    <ConfigProvider>
      <BrowserRouter>
        <div className='flex'>
          <SidebarMenu />
          <div className='w-full'>
            <Routes>
              <Route path='/' element={<Navigate to='/dashboard' replace />} />
              <Route path='/dashboard' element={<Dashboard />} />
              <Route path='/evaluation' element={<Evaluation />} />
              <Route path='/all-evaluation' element={<AllEvaluation />} />
              <Route path='/configure' element={<Configure />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
