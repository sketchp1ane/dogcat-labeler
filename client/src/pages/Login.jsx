import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Eye, EyeOff, LogIn } from 'lucide-react'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const { login, user } = useAuth()
  const navigate = useNavigate()
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm()

  // 如果用户已登录，直接跳转到dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  const onSubmit = async (data) => {
    setLoading(true)
    setLoginError('') // 清除之前的错误
    
    try {
      await login(data)
      toast.success('登录成功！')
      // 登录成功后跳转到dashboard
      navigate('/dashboard', { replace: true })
    } catch (error) {
      // 显示具体的错误消息
      const errorMessage = error.response?.data?.message || '登录失败，请稍后重试'
      setLoginError(errorMessage)
      console.error('登录错误:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <LogIn className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            猫狗图片标注平台
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            请登录您的账户
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                用户名
              </label>
              <input
                {...register('username', { required: '请输入用户名' })}
                type="text"
                className="input mt-1"
                placeholder="请输入用户名"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('password', { required: '请输入密码' })}
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  登录中...
                </div>
              ) : (
                '登录'
              )}
            </button>
          </div>

          {/* 错误消息显示 */}
          {loginError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{loginError}</p>
            </div>
          )}
          
          <div className="text-center">
            <div className="text-sm text-gray-600">
              <p className="mb-3 font-medium">🔑 快速测试账户</p>
              <div className="space-y-2 text-xs bg-gray-50 p-3 rounded-lg">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-left">
                    <p className="font-semibold text-gray-700">🔧 管理员</p>
                    <p className="text-gray-600">admin / admin123</p>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-700">👨‍⚖️审核员</p>
                    <p className="text-gray-600">reviewer1 / pass123</p>
                  </div>
                </div>
                <hr className="border-gray-200" />
                <div className="text-left">
                  <p className="font-semibold text-gray-700 mb-1">✏️ 标注员（不同技能等级）</p>
                  <div className="grid grid-cols-2 gap-1">
                    <p className="text-gray-600">🏆 annotator_expert</p>
                    <p className="text-gray-600">🥈 annotator_senior</p>
                    <p className="text-gray-600">🥉 annotator1</p>
                    <p className="text-gray-600">🔰 annotator_junior1</p>
                  </div>
                  <p className="text-gray-500 mt-1">所有标注员密码: pass123</p>
                </div>
                <hr className="border-gray-200" />
                <p className="text-xs text-gray-500 italic">
                  💡 提示：不同等级的标注员有不同的表现数据，可用于测试分析功能
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
} 