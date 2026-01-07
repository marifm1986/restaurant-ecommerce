'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { useAuthStore } from '@/stores/auth-store';
import { isValidEmail, isValidPhone } from '@/lib/utils';

// Google Icon Component
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const { signUp, signInWithGoogle, isLoading } = useAuthStore();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!isValidPhone(formData.phone)) {
      newErrors.phone = 'Enter a valid 10-digit phone number';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await signUp(formData.email, formData.password, formData.name);

      // TODO: After Firebase Auth signup, call API to create user document
      // This would include setting up the user profile with phone, etc.

      success(
        'Account Created!',
        'Your account is pending approval. You will be notified once approved.'
      );
      router.push('/registration-pending');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account';

      let friendlyMessage = 'Failed to create account. Please try again.';
      if (errorMessage.includes('email-already-in-use')) {
        friendlyMessage = 'An account with this email already exists.';
      } else if (errorMessage.includes('weak-password')) {
        friendlyMessage = 'Password is too weak. Please use a stronger password.';
      }

      showError('Registration Failed', friendlyMessage);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      success('Account Created!', 'Your account is pending approval.');
      router.push('/registration-pending');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign up with Google';

      let friendlyMessage = 'Failed to sign up with Google. Please try again.';
      if (errorMessage.includes('popup-closed-by-user')) {
        friendlyMessage = 'Sign up cancelled. Please try again.';
      } else if (errorMessage.includes('account-exists-with-different-credential')) {
        friendlyMessage = 'An account already exists with this email using a different sign-in method.';
      }

      showError('Google Sign Up Failed', friendlyMessage);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Card variant="bordered" className="w-full max-w-md">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
        <p className="text-gray-500 mt-1">Register to place orders and track your ledger</p>
      </div>

      {/* Google Sign Up Button */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={isGoogleLoading || isLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGoogleLoading ? (
          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        ) : (
          <GoogleIcon className="w-5 h-5" />
        )}
        <span className="text-gray-700 font-medium">Continue with Google</span>
      </button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">or register with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="Enter your full name"
          value={formData.name}
          onChange={handleInputChange('name')}
          error={errors.name}
          leftIcon={<User className="h-5 w-5" />}
          autoComplete="name"
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleInputChange('email')}
          error={errors.email}
          leftIcon={<Mail className="h-5 w-5" />}
          autoComplete="email"
        />

        <Input
          label="Phone Number"
          type="tel"
          placeholder="10-digit mobile number"
          value={formData.phone}
          onChange={handleInputChange('phone')}
          error={errors.phone}
          leftIcon={<Phone className="h-5 w-5" />}
          autoComplete="tel"
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Create a password"
          value={formData.password}
          onChange={handleInputChange('password')}
          error={errors.password}
          leftIcon={<Lock className="h-5 w-5" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          }
          hint="At least 6 characters"
          autoComplete="new-password"
        />

        <Input
          label="Confirm Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleInputChange('confirmPassword')}
          error={errors.confirmPassword}
          leftIcon={<Lock className="h-5 w-5" />}
          autoComplete="new-password"
        />

        <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
          Create Account
        </Button>
      </form>

      <div className="mt-4 p-4 bg-orange-50 rounded-lg">
        <p className="text-sm text-orange-800">
          <strong>Note:</strong> After registration, your account will require approval from the
          admin before you can log in.
        </p>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-orange-600 hover:text-orange-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </Card>
  );
}
