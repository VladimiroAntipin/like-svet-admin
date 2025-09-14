'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Eye, EyeOff } from "lucide-react";

export const dynamic = 'force-dynamic';

const validateEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function validateForm(email: string, password: string, confirmPassword: string) {
  const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};

  if (!email) newErrors.email = 'Введите email';
  else if (!validateEmail(email)) newErrors.email = 'Неверный формат email';

  if (!password) newErrors.password = 'Введите пароль';

  if (!confirmPassword) newErrors.confirmPassword = 'Подтвердите пароль';
  else if (password && password !== confirmPassword)
    newErrors.confirmPassword = 'Пароли не совпадают';

  return newErrors;
}

export default function SignUpPage() {
  const { signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean; confirmPassword?: boolean }>({});
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  const [serverErrors, setServerErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const clientErrors = validateForm(email, password, confirmPassword);
    const filteredErrors: typeof clientErrors = {};
    if (touched.email && clientErrors.email) filteredErrors.email = clientErrors.email;
    if (touched.password && clientErrors.password) filteredErrors.password = clientErrors.password;
    if (touched.confirmPassword && clientErrors.confirmPassword) filteredErrors.confirmPassword = clientErrors.confirmPassword;
    setErrors(filteredErrors);
    setServerErrors({});
  }, [email, password, confirmPassword, touched]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true, confirmPassword: true });

    const clientErrors = validateForm(email, password, confirmPassword);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, confirmPassword }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setServerErrors(data?.errors || {
          email: data?.error || 'Ошибка сервера',
          password: data?.error || 'Ошибка сервера',
          confirmPassword: data?.error || 'Ошибка сервера'
        });
        setLoading(false);
        return;
      }

      await signIn(email, password);

    } catch {
      setServerErrors({
        email: 'Ошибка сервера',
        password: 'Ошибка сервера',
        confirmPassword: 'Ошибка сервера'
      });
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled =
    loading || !!errors.email || !!errors.password || !!errors.confirmPassword || !email || !password || !confirmPassword;

  return (
    <div className="flex flex-col items-center justify-center bg-transparent text-black">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 bg-white p-8 rounded-lg shadow-xl"
        noValidate
      >
        <h1 className="text-xl font-medium mb-4">Регистрация администратора</h1>

        {/* Email */}
        <div className="flex flex-col">
          <label className="text-sm mb-1">Email</label>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
            className="w-full border border-gray-400 px-3 py-2 text-sm focus:outline-none focus:border-black"
          />
          {(errors.email || serverErrors.email) && (
            <span className="text-red-500 text-xs mt-1">{errors.email || serverErrors.email}</span>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col">
          <label className="text-sm mb-1">Пароль</label>
          <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
              className="w-full border border-gray-400 px-3 py-2 text-sm focus:outline-none focus:border-black pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-black"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {(errors.password || serverErrors.password) && (
            <span className="text-red-500 text-xs mt-1">{errors.password || serverErrors.password}</span>
          )}
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col">
          <label className="text-sm mb-1">Подтвердите пароль</label>
          <div className="relative w-full">
            <input
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
              className="w-full border border-gray-400 px-3 py-2 text-sm focus:outline-none focus:border-black pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-black"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {(errors.confirmPassword || serverErrors.confirmPassword) && (
            <span className="text-red-500 text-xs mt-1">{errors.confirmPassword || serverErrors.confirmPassword}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitDisabled}
          className={`w-full py-2 text-sm font-medium bg-black cursor-pointer text-white mt-8 ${isSubmitDisabled ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}
        >
          {loading ? 'Загрузка...' : 'Зарегистрироваться'}
        </button>

        {/* Link a Sign-In */}
        <p className="text-sm text-center mt-4 text-gray-600">
          Уже есть аккаунт?{' '}
          <button
            type="button"
            className="text-blue-600 hover:underline cursor-pointer"
            onClick={() => router.push('/sign-in')}
          >
            Войти
          </button>
        </p>
      </form>
    </div>
  );
}