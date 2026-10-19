import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ProtectedGameRoute from './components/ProtectedGameRoute.jsx'; 
import EmptyState from './components/EmptyState.jsx';

import HomePage from './pages/public/HomePage.jsx';
import ClassSchedulePage from './pages/public/ClassSchedulePage.jsx';
import PeriodSchedulePage from './pages/public/PeriodSchedulePage.jsx';
import AnnouncementsPage from './pages/public/AnnouncementsPage.jsx';

import GameLoginPage from './pages/public/GameLoginPage.jsx'; 
import GameHubPage from './pages/public/GameHubPage.jsx';
import GamePage from './pages/public/GamePage.jsx';
import WordGamePage from './pages/public/WordGamePage.jsx';
import SnakeGamePage from './pages/public/SnakeGamePage.jsx'; 
import MemoryGamePage from './pages/public/MemoryGamePage.jsx'; 
import CountryGamePage from './pages/public/CountryGamePage.jsx';
import ChessGamePage from './pages/public/ChessGamePage.jsx'; 
import BreakerGamePage from './pages/public/BreakerGamePage.jsx'; 

import LoginPage from './pages/admin/LoginPage.jsx';
import Overview from './pages/admin/Overview.jsx';
import ClassesAdminPage from './pages/admin/ClassesAdminPage.jsx';
import MasterDataPage from './pages/admin/MasterDataPage.jsx';
import ScheduleAdminListPage from './pages/admin/ScheduleAdminListPage.jsx';
import ScheduleEditorPage from './pages/admin/ScheduleEditorPage.jsx';
import AnnouncementsAdminPage from './pages/admin/AnnouncementsAdminPage.jsx';
import ChangeLogsPage from './pages/admin/ChangeLogsPage.jsx';
import SettingsPage from './pages/admin/SettingsPage.jsx';
import AdminsPage from './pages/admin/AdminsPage.jsx';
import GameAdminPage from './pages/admin/GameAdminPage.jsx'; 

const Placeholder = ({ title }) => (
  <EmptyState title={title} description="Halaman ini akan diimplementasikan pada tahap berikutnya." />
);

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="tanggal/:date" element={<HomePage />} />
        <Route path="kelas/:classId" element={<ClassSchedulePage />} />
        <Route path="sesi/:periodCode" element={<PeriodSchedulePage />} />
        <Route path="pengumuman" element={<AnnouncementsPage />} />
        
        {/* RUTE GAME: WAJIB LOGIN */}
        <Route path="game/login" element={<GameLoginPage />} />
        <Route path="game" element={<ProtectedGameRoute><GameHubPage /></ProtectedGameRoute>} />
        <Route path="game/math" element={<ProtectedGameRoute><GamePage /></ProtectedGameRoute>} />
        <Route path="game/word" element={<ProtectedGameRoute><WordGamePage /></ProtectedGameRoute>} />
        <Route path="game/snake" element={<ProtectedGameRoute><SnakeGamePage /></ProtectedGameRoute>} />
        <Route path="game/memory" element={<ProtectedGameRoute><MemoryGamePage /></ProtectedGameRoute>} />
        <Route path="game/country" element={<ProtectedGameRoute><CountryGamePage /></ProtectedGameRoute>} />
        <Route path="game/chess" element={<ProtectedGameRoute><ChessGamePage /></ProtectedGameRoute>} />
        <Route path="game/breaker" element={<ProtectedGameRoute><BreakerGamePage /></ProtectedGameRoute>} />
      </Route>

      <Route path="/admin/login" element={<LoginPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="jadwal" element={<ScheduleAdminListPage />} />
        <Route path="jadwal/:date" element={<ScheduleEditorPage />} />
        <Route path="kelas" element={<ClassesAdminPage />} />
        <Route path="master" element={<MasterDataPage />} />
        <Route path="pengumuman" element={<AnnouncementsAdminPage />} />
        <Route path="riwayat" element={<ChangeLogsPage />} />
        <Route path="pengaturan" element={<SettingsPage />} />
        <Route path="admins" element={<AdminsPage />} />
        <Route path="game" element={<GameAdminPage />} /> 
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}