import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useStore from './store/useStore';
import Sidebar from './components/Sidebar';
import Controls from './components/Controls';
import Viewport from './components/Viewport';
import Header from './components/Header';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Preview from './Preview';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const session = useStore(state => state.session);
  const isAuthReady = useStore(state => state.isAuthReady);

  if (!isAuthReady) {
    return (
      <div className="loading-screen" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loader" style={{ marginBottom: '1rem', border: '3px solid #f3f3f3', borderTop: '3px solid var(--accent-color)', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 2s linear infinite', margin: '0 auto' }}></div>
          <p>Restoring session...</p>
        </div>
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const initAuth = useStore(state => state.initAuth);

  React.useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/preview" element={<Preview />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <div className="app-container">
                <Header />
                <Sidebar />
                <Viewport />
                <Controls />
              </div>
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
