import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      toast.error('Google login failed.');
      navigate('/login');
      return;
    }
    // Store token then fetch user
    localStorage.setItem('splito_token', token);
    api.get('/auth/me')
      .then((res) => {
        login(token, res.data.user);
        toast.success(`Welcome, ${res.data.user.name}! 🎉`);
        navigate('/dashboard');
      })
      .catch(() => {
        localStorage.removeItem('splito_token');
        toast.error('Authentication failed. Please try again.');
        navigate('/login');
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Completing sign-in...</p>
      </div>
    </div>
  );
}
