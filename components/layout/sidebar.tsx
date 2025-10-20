import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const SidebarMenu: React.FC = () => {
  const location = useLocation();
  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const linkClass = (active: boolean) =>
    'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 w-full ' +
    (active
      ? 'bg-cyan-600/20 text-cyan-300'
      : 'text-gray-300 hover:bg-gray-700 hover:text-white');

  return (
    <aside className='w-64 flex-shrink-0 bg-gray-800 flex flex-col p-4 border-r border-gray-700'>
      <div className='flex items-center mb-8 px-2'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth={1.5}
          stroke='currentColor'
          className='h-8 w-8 text-cyan-400'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z'
          />
        </svg>
        <h1 className='text-xl font-bold text-white ml-2 tracking-tight'>
          CEAi
        </h1>
      </div>

      <nav className='flex-1 flex flex-col space-y-2'>
        <h2 className='px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>
          Main Menu
        </h2>

        <Link
          to='/dashboard'
          className={linkClass(isActive('/dashboard'))}
          aria-current={isActive('/dashboard') ? 'page' : undefined}>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
            className='h-6 w-6'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z'
            />
          </svg>
          <span className='ml-3'>Dashboard</span>
        </Link>

        <Link
          to='/evaluation'
          className={linkClass(isActive('/evaluation'))}
          aria-current={isActive('/evaluation') ? 'page' : undefined}>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
            className='h-6 w-6'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M18 18.72a9.094 9.094 0 00-12 0m12 0a9.094 9.094 0 00-12 0m12 0a9.094 9.094 0 01-12 0m12 0v-2.25a4.5 4.5 0 00-9 0v2.25m9 0a9.094 9.094 0 01-12 0'
            />
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M12 12.75a4.5 4.5 0 110-9 4.5 4.5 0 010 9z'
            />
          </svg>
          <span className='ml-3'>Evaluation</span>
        </Link>

        <Link
          to='/all-evaluation'
          className={linkClass(isActive('/all-evaluation'))}
          aria-current={isActive('/all-evaluation') ? 'page' : undefined}>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
            className='h-6 w-6'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z'
            />
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M12 6V3M9 3.51L6 2m0 1.5L9 5.01'
            />
          </svg>
          <span className='ml-3'>All Evaluation</span>
        </Link>

        <div className='pt-4'>
          <h2 className='px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>
            Configuration
          </h2>
          <div className='space-y-2 mt-2'>
            <Link
              to='/configure'
              className={linkClass(isActive('/configure'))}
              aria-current={isActive('/configure') ? 'page' : undefined}>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth={1.5}
                stroke='currentColor'
                className='h-6 w-6'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z'
                />
              </svg>
              <span className='ml-3'>Configure Criteria</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className='mt-auto flex-shrink-0'>
        <div className='space-y-2'>
          <button className='flex items-center px-3 py-2.5 rounded-lg text-sm font-medium w-full text-gray-300 hover:bg-gray-700 hover:text-white'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              strokeWidth={1.5}
              stroke='currentColor'
              className='h-6 w-6'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 006-6v-1a3 3 0 00-3-3H9a3 3 0 00-3 3v1a6 6 0 006 6z'
              />
            </svg>
            <span className='ml-3'>User Management</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default SidebarMenu;
