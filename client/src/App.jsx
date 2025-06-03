import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Overview from './pages/Overview'
import AnnotationPage from './pages/AnnotationPage'
import UploadPage from './pages/UploadPage'
import ReviewPage from './pages/ReviewPage'
import UsersPage from './pages/UsersPage'
import AnalyticsPage from './pages/AnalyticsPage'

// 受保护的路由组件
function ProtectedRoute({ children, requiredRole = null }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  // 检查角色权限 - 管理员可以访问所有页面
  if (requiredRole && user.role !== 'admin') {
    // 检查用户是否有所需角色
    if (user.role !== requiredRole) {
      // 对于标注页面，审核员也可以访问
      if (requiredRole === 'annotator' && user.role === 'reviewer') {
        return children
      }
      // 对于审核页面，标注员不能访问
      return <Navigate to="/dashboard" replace />
    }
  }
  
  return children
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            >
              {/* 仪表盘子路由 */}
              <Route index element={<Overview />} />
              <Route 
                path="annotation" 
                element={
                  <ProtectedRoute requiredRole="annotator">
                    <AnnotationPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="upload" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <UploadPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="review" 
                element={
                  <ProtectedRoute requiredRole="reviewer">
                    <ReviewPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="users" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <UsersPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="analytics" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AnalyticsPage />
                  </ProtectedRoute>
                } 
              />
            </Route>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App 