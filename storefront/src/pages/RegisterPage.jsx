import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
    setFormError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    if (!form.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errs.email = 'Enter a valid email address';
    }
    if (!form.password) {
      errs.password = 'Password is required';
    } else if (form.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    if (!form.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    if (form.phone && !/^\+?[\d\s\-()]{7,20}$/.test(form.phone)) {
      errs.phone = 'Enter a valid phone number';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    const p = form.password;
    if (!p) return null;
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^a-zA-Z0-9]/.test(p)) score++;

    if (score <= 2) return { label: 'Weak', color: 'text-error', bg: 'bg-error', width: '33%' };
    if (score <= 3) return { label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-500', width: '66%' };
    return { label: 'Strong', color: 'text-green-600', bg: 'bg-green-500', width: '100%' };
  };

  const passwordStrength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      });
      toast.success('Account created successfully!');
      navigate('/account');
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('exists')) {
        setErrors((prev) => ({ ...prev, email: 'This email is already registered' }));
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
        <h1 className="text-2xl font-semibold text-primary-900 text-center mb-2">Create Account</h1>
        <p className="text-sm text-muted text-center mb-8">
          Sign up to start shopping and track your orders.
        </p>

        {formError && (
          <div className="flex items-start gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle size={16} className="text-error mt-0.5 flex-shrink-0" />
            <p className="text-sm text-error">{formError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={form.firstName}
              onChange={handleChange('firstName')}
              error={errors.firstName}
              required
            />
            <Input
              label="Last Name"
              value={form.lastName}
              onChange={handleChange('lastName')}
              error={errors.lastName}
              required
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={handleChange('email')}
            placeholder="you@example.com"
            error={errors.email}
            required
          />
          <Input
            label="Phone (optional)"
            type="tel"
            value={form.phone}
            onChange={handleChange('phone')}
            placeholder="+995..."
            error={errors.phone}
          />
          <div>
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              placeholder="Min 6 characters"
              error={errors.password}
              required
            />
            {passwordStrength && !errors.password && (
              <div className="mt-2">
                <div className="h-1 bg-primary-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${passwordStrength.bg} rounded-full transition-all duration-300`}
                    style={{ width: passwordStrength.width }}
                  />
                </div>
                <p className={`text-xs mt-1 ${passwordStrength.color}`}>
                  {passwordStrength.label} password
                </p>
              </div>
            )}
          </div>
          <Input
            label="Confirm Password"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange('confirmPassword')}
            error={errors.confirmPassword}
            required
          />
          <Button type="submit" fullWidth loading={loading}>
            Create Account
          </Button>
        </form>

        <p className="text-sm text-muted text-center mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-900 font-medium hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
