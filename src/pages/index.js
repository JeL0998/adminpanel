import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Login successful!');
      router.push('/main');
    } catch (err) {
      console.error(err);
      setError('Invalid email or password.');
      toast.error('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white shadow-md rounded-lg border border-gray-200 border-t-blue-900">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-600">Admin Login</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleLogin}>
          <label className="block text-gray-700 mb-4 relative">
            <FaEnvelope className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 py-2 border border-gray-300 rounded-lg shadow-md focus:shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
              placeholder="Email"
              aria-label="Email"
              required
            />
          </label>
          <label className="block text-gray-700 mb-6 relative">
            <FaLock className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 py-2 border border-gray-300 rounded-lg shadow-md focus:shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
              placeholder="Password"
              aria-label="Password"
              required
            />
          </label>
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-md shadow-md hover:shadow-xl hover:bg-blue-700 transition-all duration-300"
          >
            Login
          </button>
          <div className="mt-4 flex flex-col space-y-2">
            <Link href="/forgot">
              <a className="text-blue-600 hover:font-bold">Forgot Password</a>
            </Link>
            <Link href="/register">
              <a className="text-blue-600 hover:font-bold">Register as a new user</a>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
