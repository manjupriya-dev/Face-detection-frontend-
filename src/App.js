import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import LiveStreaming from './pages/LiveStreaming';
import Enroll from './pages/Enroll';
import EmployeeList from './pages/EmployeeList';
import Delete from './pages/Delete';
import LiveStreamDetail from './pages/LiveStreamDetail';
import Logs from './pages/Logs';
import CapturedImages from './pages/Capturedimages';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="live" element={<LiveStreaming />} />
          <Route path="enroll" element={<Enroll />} />
          <Route path="employees" element={<EmployeeList />} />
          <Route path="delete" element={<Delete />} />
          <Route path="logs" element={<Logs />} />
          <Route path="captured-images" element={<CapturedImages />} />
          <Route path="live-stream/:cameraId" element={<LiveStreamDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
