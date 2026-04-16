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
  const token = useStore(state => state.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
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

