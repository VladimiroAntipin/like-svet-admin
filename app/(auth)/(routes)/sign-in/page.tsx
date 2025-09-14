'use client';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Eye, EyeOff } from "lucide-react";

export const dynamic = 'force-dynamic';

const validateEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function validateForm(email: string, password: string) {
  const newErrors: { email?: string; password?: string } = {};
  if (!email) newErrors.email = 'Введите email';
  else if (!validateEmail(email)) newErrors.email = 'Неверный формат email';

  if (!password) newErrors.password = 'Введите пароль';

  return newErrors;
}

export default function SignInPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverErrors, setServerErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const clientErrors = validateForm(email, password);
    const filteredErrors: typeof clientErrors = {};
    if (touched.email && clientErrors.email) filteredErrors.email = clientErrors.email;
    if (touched.password && clientErrors.password) filteredErrors.password = clientErrors.password;
    setErrors(filteredErrors);
    setServerErrors({});
  }, [email, password, touched]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    const clientErrors = validateForm(email, password);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setLoading(true);

    try {
      const result = await signIn(email, password, redirectTo);

      if (!result.success) {
        setServerErrors({
          email: result.error || 'Ошибка авторизации',
          password: result.error || 'Ошибка авторизации'
        });
      }

    } catch {
      setServerErrors({ email: 'Ошибка сервера', password: 'Ошибка сервера' });
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled =
    loading || !!errors.email || !!errors.password || !email || !password;

  return (
    <div className="flex flex-col items-center justify-center bg-transparent text-black">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 bg-white p-8 rounded-lg shadow-xl"
        noValidate
      >
        <h1 className="text-xl font-medium mb-4">Войти в админ панель</h1>

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
            <span className="text-red-500 text-xs mt-1">
              {errors.email || serverErrors.email}
            </span>
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
            <span className="text-red-500 text-xs mt-1">
              {errors.password || serverErrors.password}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitDisabled}
          className={`w-full py-2 text-sm font-medium bg-black cursor-pointer text-white mt-8 ${isSubmitDisabled ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}
        >
          {loading ? 'Загрузка...' : 'Войти'}
        </button>

        {/* Link a Sign-Up */}
        <p className="text-sm text-center mt-4 text-gray-600">
          Нет аккаунта?{' '}
          <button
            type="button"
            className="text-blue-600 hover:underline cursor-pointer"
            onClick={() => router.push('/sign-up')}
          >
            Зарегистрироваться
          </button>
        </p>
      </form>
    </div>
  );
}