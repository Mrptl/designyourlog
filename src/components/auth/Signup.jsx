import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useStore from '../../store/useStore';
import { UserPlus, Mail, Lock, User } from 'lucide-react';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const signup = useStore(state => state.signup);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await signup(username, email, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="auth-container glass">
      <div className="auth-card">
        <div className="auth-header">
          <UserPlus size={40} className="auth-icon" />
          <h2>Create Account</h2>
          <p>Join the wooden structure community</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          
          <div className="form-group">
            <label><User size={16} /> Username</label>
            <input 
              type="text" 
              className="input-field" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="CoolWoodworker"
              required 
            />
          </div>

          <div className="form-group">
            <label><Mail size={16} /> Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="name@example.com"
              required 
            />
          </div>

          <div className="form-group">
            <label><Lock size={16} /> Password</label>
            <input 
              type="password" 
              className="input-field" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p>Already have an account? <Link to="/login">Login</Link></p>
          <div style={{ marginTop: '1rem', opacity: 0.6, fontSize: '0.7rem' }}>
            <p>© {new Date().getFullYear()} Dev Patel. All Rights Reserved.</p>
            <p>Developed by Suchna Tech & Solutions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
