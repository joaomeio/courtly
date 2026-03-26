import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { supabase } from './supabaseClient';
import { SubscriptionProvider } from './contexts/SubscriptionContext';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Students from './pages/Students';
import Payments from './pages/Payments';
import Courts from './pages/Courts';
import StudentProfile from './pages/StudentProfile';
import Auth from './pages/Auth';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import Drills from './pages/Drills';
import Programs from './pages/Programs';
import ProgramDetail from './pages/ProgramDetail';
import Pricing from './pages/Pricing';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-primary">Loading ServeFlow...</div>;
  }

  // If not logged in, only show Auth page
  if (!session) {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    );
  }

  // If logged in, show app layout
  return (
    <Router>
      <SubscriptionProvider session={session}>
        <Routes>
          <Route path="/" element={<Layout session={session} />}>
            <Route index element={<Dashboard />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="students" element={<Students />} />
            <Route path="students/:id" element={<StudentProfile />} />
            <Route path="payments" element={<Payments />} />
            <Route path="courts" element={<Courts />} />
            <Route path="settings" element={<Settings />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="drills" element={<Drills />} />
            <Route path="programs" element={<Programs />} />
            <Route path="programs/:id" element={<ProgramDetail />} />
            <Route path="pricing" element={<Pricing />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SubscriptionProvider>
    </Router>
  );
}

export default App;
