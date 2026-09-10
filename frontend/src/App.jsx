import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CampDetail from './pages/CampDetail.jsx';
import Alerts from './pages/Alerts.jsx';
import Assets from './pages/Assets.jsx';
import Personnel from './pages/Personnel.jsx';
import MapView from './pages/MapView.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/camps/:id"
        element={
          <ProtectedRoute>
            <CampDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <Alerts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/map"
        element={
          <ProtectedRoute>
            <MapView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assets"
        element={
          <ProtectedRoute>
            <Assets />
          </ProtectedRoute>
        }
      />
      <Route
        path="/personnel"
        element={
          <ProtectedRoute>
            <Personnel />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
