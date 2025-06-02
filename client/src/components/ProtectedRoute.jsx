// client/src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

/**
 * 用法：
 * <ProtectedRoute roles={['admin']}>
 *   <UploadPage />
 * </ProtectedRoute>
 */
export default function ProtectedRoute({ roles, children }) {
  const { user } = useAuth();          // { id, role } | null

  // 1️⃣ 未登录：直接跳到登录页
  if (!user) return <Navigate to="/login" replace />;

  // 2️⃣ 角色不匹配：跳回默认页（你也可以换成 403 页面）
  if (roles && !roles.includes(user.role))
    return <Navigate to="/" replace />;

  // 3️⃣ 一切正常：渲染目标组件
  return children;
}
