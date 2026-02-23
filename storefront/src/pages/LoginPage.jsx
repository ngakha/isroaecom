import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || '/account';

  const validate = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Enter a valid email address';
    }
    if (!password) {
      errs.password = 'Password is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid credentials';
      if (msg.toLowerCase().includes('credential') || msg.toLowerCase().includes('password')) {
        setFormError('Incorrect email or password. Please try again.');
      } else if (msg.toLowerCase().includes('deactivated')) {
        setFormError('Your account has been deactivated. Contact support.');
      } else if (msg.toLowerCase().includes('locked')) {
        setFormError(msg);
      } else {
        setFormError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-container mx-auto px-4 lg:px-6 py-16">
      <div className="max-w-sm mx-auto">
        <h1 className="text-2xl font-semibold text-primary-900 text-center mb-2">Sign In</h1>
        <p className="text-sm text-muted text-center mb-8">
          Welcome back. Enter your credentials to access your account.
        </p>

        {formError && (
          <div className="flex items-start gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle size={16} className="text-error mt-0.5 flex-shrink-0" />
            <p className="text-sm text-error">{formError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: null })); setFormError(''); }}
            placeholder="you@example.com"
            error={errors.email}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: null })); setFormError(''); }}
            placeholder="Enter your password"
            error={errors.password}
            required
          />
          <Button type="submit" fullWidth loading={loading}>
            Sign In
          </Button>
        </form>

        <p className="text-sm text-muted text-center mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-900 font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
