import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import TopicSearchPage from './pages/TopicSearchPage';
import ContentAnalysisPage from './pages/ContentAnalysisPage';
import TopicSuggestionsPage from './pages/TopicSuggestionsPage';
import ContentOutlinePage from './pages/ContentOutlinePage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Routes>
      {/* 主路由 */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/suggestions" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="search" element={<TopicSearchPage />} />
        <Route path="analysis" element={<ContentAnalysisPage />} />
        <Route path="suggestions" element={<TopicSuggestionsPage />} />
        <Route path="outline" element={<ContentOutlinePage />} />
      </Route>
      
      {/* 404页面 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
