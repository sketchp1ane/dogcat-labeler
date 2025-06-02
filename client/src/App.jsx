import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.jsx';
import NavBar from './components/NavBar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Annotate from './pages/Annotate';
import Review from './pages/Review';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';

export default function App() {
  const { user } = useAuth();   // { id, role } | null

  return (
    <>
      {/* 登录后才显示导航栏 */}
      {user && <NavBar />}

      <Routes>
        {/* 登录页：所有人可访问 */}
        <Route path="/login" element={<Login />} />

        {/* 标注员 */}
        <Route
          path="/annotate"
          element={
            <ProtectedRoute roles={['annotator']}>
              <Annotate />
            </ProtectedRoute>
          }
        />

        {/* 审核员 */}
        <Route
          path="/review"
          element={
            <ProtectedRoute roles={['reviewer']}>
              <Review />
            </ProtectedRoute>
          }
        />

        {/* 管理员 —— 上传任务 */}
        <Route
          path="/upload"
          element={
            <ProtectedRoute roles={['admin']}>
              <Upload />
            </ProtectedRoute>
          }
        />

        {/* 管理员 —— 数据统计 */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={['admin']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* 兜底：根据是否登录跳转 */}
        <Route
          path="*"
          element={<Navigate to={user ? '/annotate' : '/login'} replace />}
        />
      </Routes>
    </>
  );
}
