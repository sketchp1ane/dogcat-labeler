import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { userAPI, taskAPI, annotationAPI, reviewAPI } from '../services/api'
import { 
  Image, 
  CheckSquare, 
  Users, 
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Upload,
  UserPlus,
  Play
} from 'lucide-react'

export default function Overview() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    tasks: {},
    users: {},
    annotations: {},
    reviews: {}
  })

  useEffect(() => {
    loadStats()
  }, [user])

  const loadStats = async () => {
    try {
      setLoading(true)
      
      if (user?.role === 'admin') {
        // 管理员加载所有统计
        const [taskStats, userStats] = await Promise.all([
          taskAPI.getTaskStats(),
          userAPI.getUserStats()
        ])
        
        setStats({
          tasks: taskStats.data.taskStats,
          users: userStats.data.roleStats,
          annotations: {},
          reviews: {}
        })
      } else if (user?.role === 'reviewer') {
        // 审核员加载审核统计
        const reviewStats = await reviewAPI.getReviewStats()
        setStats({
          tasks: {},
          users: {},
          annotations: {},
          reviews: reviewStats.data.stats
        })
      } else if (user?.role === 'annotator') {
        // 标注员加载标注统计
        const annotationStats = await annotationAPI.getAnnotationStats()
        setStats({
          tasks: {},
          users: {},
          annotations: annotationStats.data.stats,
          reviews: {}
        })
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon: Icon, color = 'blue', loading = false }) => (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center">
          <div className={`p-2 rounded-md bg-${color}-100`}>
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">
              {loading ? (
                <div className="animate-pulse bg-gray-300 h-8 w-16 rounded"></div>
              ) : (
                value ?? 0
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const getTotalUsers = () => {
    if (!stats.users || !Array.isArray(stats.users)) return 0
    return stats.users.reduce((total, role) => total + role.count, 0)
  }

  const renderAdminOverview = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          系统概览
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="总任务数"
            value={stats.tasks.total}
            icon={Image}
            color="blue"
            loading={loading}
          />
          <StatCard
            title="待标注"
            value={stats.tasks.pending}
            icon={Clock}
            color="yellow"
            loading={loading}
          />
          <StatCard
            title="已完成"
            value={stats.tasks.completed}
            icon={CheckCircle}
            color="green"
            loading={loading}
          />
          <StatCard
            title="用户总数"
            value={getTotalUsers()}
            icon={Users}
            color="purple"
            loading={loading}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            快速操作
          </h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => navigate('/dashboard/upload')}
              className="btn-primary flex items-center justify-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>上传新图片</span>
            </button>
            <button 
              onClick={() => navigate('/dashboard/users')}
              className="btn-outline flex items-center justify-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>管理用户</span>
            </button>
            <button 
              onClick={loadStats}
              className="btn-outline flex items-center justify-center space-x-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>刷新统计</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderReviewerOverview = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          审核概览
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="待审核"
            value={stats.reviews.pending_count}
            icon={Clock}
            color="yellow"
            loading={loading}
          />
          <StatCard
            title="已通过"
            value={stats.reviews.approved_count}
            icon={CheckCircle}
            color="green"
            loading={loading}
          />
          <StatCard
            title="已拒绝"
            value={stats.reviews.rejected_count}
            icon={XCircle}
            color="red"
            loading={loading}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            快速操作
          </h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('/dashboard/review')}
              className="btn-primary flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>开始审核</span>
            </button>
            <button 
              onClick={() => navigate('/dashboard/review')}
              className="btn-outline flex items-center justify-center space-x-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>查看历史</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderAnnotatorOverview = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          标注概览
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="待标注"
            value={stats.annotations.pending_review}
            icon={Clock}
            color="yellow"
            loading={loading}
          />
          <StatCard
            title="已标注"
            value={stats.annotations.total_annotations}
            icon={CheckSquare}
            color="blue"
            loading={loading}
          />
          <StatCard
            title="已通过"
            value={stats.annotations.approved}
            icon={CheckCircle}
            color="green"
            loading={loading}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            快速操作
          </h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('/dashboard/annotation')}
              className="btn-primary flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>开始标注</span>
            </button>
            <button 
              onClick={() => navigate('/dashboard/annotation')}
              className="btn-outline flex items-center justify-center space-x-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>查看历史</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          仪表板概览
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          欢迎使用猫狗图片标注平台，{user?.username}
        </p>
      </div>

      {user?.role === 'admin' && renderAdminOverview()}
      {user?.role === 'reviewer' && renderReviewerOverview()}
      {user?.role === 'annotator' && renderAnnotatorOverview()}
    </div>
  )
} 