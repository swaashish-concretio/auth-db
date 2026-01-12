import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, logout } from '../utils/api';

function Dashboard({ setIsAuthenticated }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setUser(data.user);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      // Still log out locally even if API call fails
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="dashboard">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="dashboard">
        <h2>User Dashboard</h2>

        {user && (
          <div className="user-info">
            <p><strong>Full Name:</strong> {user.name}</p>
            <p><strong>Email Address:</strong> {user.email}</p>
            <p><strong>Account Created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        )}

        <button onClick={handleLogout} className="btn btn-logout">
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
