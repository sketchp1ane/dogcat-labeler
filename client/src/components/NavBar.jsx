import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

export default function NavBar() {
  const { user, setUser } = useAuth();
  if (!user) return null; // 未登录不显示

  const menus = {
    annotator: [{ path: '/annotate', label: '标注任务' }],
    reviewer:  [{ path: '/review',   label: '审核任务' }],
    admin: [
      { path: '/upload',    label: '上传任务' },
      { path: '/dashboard', label: '统计面板' },
    ],
  }[user.role];

  const logout = () =>
    fetch('/api/logout', { method: 'POST', credentials: 'include' }).then(() =>
      setUser(null)
    );

  return (
    <nav className="bg-gray-800 text-white px-6 py-3 flex items-center justify-between">
      <span className="font-bold">🐱🐶 Labeler</span>
      <ul className="flex gap-6">
        {menus.map(m => (
          <li key={m.path}>
            <Link className="hover:text-blue-300" to={m.path}>
              {m.label}
            </Link>
          </li>
        ))}
      </ul>
      <button onClick={logout} className="hover:text-red-400">
        退出
      </button>
    </nav>
  );
}
