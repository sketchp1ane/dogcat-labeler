import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/http';
import { useAuth } from '../hooks/useAuth.jsx';
import Button from '../components/Button';

export default function Login() {
  const [username, setU] = useState('');
  const [password, setP] = useState('');
  const { setUser } = useAuth();
  const nav = useNavigate();

  const submit = async e => {
    e.preventDefault();
    try {
      const u = await api('/login', 'POST', { username, password });
      setUser(u);
      const redirect =
        u.role === 'admin'
          ? '/upload'
          : u.role === 'reviewer'
          ? '/review'
          : '/annotate';
      nav(redirect, { replace: true });
    } catch {
      alert('用户名或密码错误');
    }
  };

  return (
    <form
      onSubmit={submit}
      className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-50"
    >
      <h1 className="text-2xl font-bold">猫狗标注平台登录</h1>
      <input
        className="border rounded px-3 py-2 w-60"
        placeholder="Username"
        value={username}
        onChange={e => setU(e.target.value)}
        required
      />
      <input
        className="border rounded px-3 py-2 w-60"
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setP(e.target.value)}
        required
      />
      <Button className="w-60">登录</Button>
    </form>
  );
}
