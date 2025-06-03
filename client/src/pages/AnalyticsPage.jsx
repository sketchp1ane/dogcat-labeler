import { useState, useEffect } from 'react'
import { analyticsAPI } from '../services/api'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Activity,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react'

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('progress')
  const [data, setData] = useState({
    progress: null,
    quality: null,
    timeAnalysis: null,
    dashboard: null
  })

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      setLoading(true)
      const [progressData, qualityData, timeData, dashboardData] = await Promise.all([
        analyticsAPI.getAnnotationProgress(),
        analyticsAPI.getAnnotationQuality(),
        analyticsAPI.getTimeAnalysis(),
        analyticsAPI.getDashboardData()
      ])

      setData({
        progress: progressData.data,
        quality: qualityData.data,
        timeAnalysis: timeData.data,
        dashboard: dashboardData.data
      })
    } catch (error) {
      console.error('加载分析数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'progress', name: '进度分析', icon: TrendingUp },
    { id: 'quality', name: '质量分析', icon: CheckCircle },
    { id: 'time', name: '效率分析', icon: Clock },
    { id: 'overview', name: '综合概览', icon: BarChart3 }
  ]

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  const StatCard = ({ title, value, icon: Icon, change, color = 'blue' }) => (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change && (
              <p className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change > 0 ? '+' : ''}{change}%
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full bg-${color}-100`}>
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </div>
        </div>
      </div>
    </div>
  )

  const renderProgressTab = () => {
    if (!data.progress) return null

    return (
      <div className="space-y-6">
        {/* 任务流转状态 */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium">任务状态分布</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.progress.taskFlow}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ status, percentage }) => `${status}: ${percentage}%`}
                    >
                      {data.progress.taskFlow.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                {data.progress.taskFlow.map((item, index) => (
                  <div key={item.status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="font-medium capitalize">{item.status}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{item.count}</div>
                      <div className="text-sm text-gray-500">{item.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 每日标注趋势 */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium">30天标注趋势</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={data.progress.dailyAnnotations}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="annotations" 
                  stackId="1"
                  stroke="#3B82F6" 
                  fill="#3B82F6"
                  name="标注数量"
                />
                <Area 
                  type="monotone" 
                  dataKey="active_annotators" 
                  stackId="2"
                  stroke="#10B981" 
                  fill="#10B981"
                  name="活跃标注员"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 每日审核趋势 */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium">30天审核趋势</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.progress.dailyReviews}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="approved" stackId="a" fill="#10B981" name="通过" />
                <Bar dataKey="rejected" stackId="a" fill="#EF4444" name="拒绝" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    )
  }

  const renderQualityTab = () => {
    if (!data.quality) return null

    return (
      <div className="space-y-6">
        {/* 标注员质量排行 */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium">标注员质量分析</h3>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">标注员</th>
                    <th className="px-4 py-2 text-center">总标注数</th>
                    <th className="px-4 py-2 text-center">已审核</th>
                    <th className="px-4 py-2 text-center">通过率</th>
                    <th className="px-4 py-2 text-center">平均时间</th>
                    <th className="px-4 py-2 text-center">平均置信度</th>
                  </tr>
                </thead>
                <tbody>
                  {data.quality.annotatorQuality.map((annotator, index) => (
                    <tr key={annotator.annotator_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2 font-medium">{annotator.username}</td>
                      <td className="px-4 py-2 text-center">{annotator.total_annotations}</td>
                      <td className="px-4 py-2 text-center">{annotator.reviewed_annotations}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          annotator.approval_rate >= 90 ? 'bg-green-100 text-green-800' :
                          annotator.approval_rate >= 70 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {annotator.approval_rate ? `${annotator.approval_rate}%` : 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        {annotator.avg_time ? `${Math.round(annotator.avg_time)}秒` : 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {annotator.avg_confidence ? (annotator.avg_confidence * 100).toFixed(1) + '%' : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 标签分布 */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium">标签分布分析</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.quality.labelDistribution}
                      dataKey="count"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ label, count }) => `${label}: ${count}`}
                    >
                      {data.quality.labelDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                {data.quality.labelDistribution.map((label, index) => (
                  <div key={label.label} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium capitalize">{label.label}</span>
                      <span className="text-lg font-bold">{label.count}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">平均置信度:</span>
                        <span className="ml-1 font-medium">
                          {(label.avg_confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">通过/拒绝:</span>
                        <span className="ml-1 font-medium text-green-600">{label.approved_count}</span>
                        <span className="mx-1">/</span>
                        <span className="font-medium text-red-600">{label.rejected_count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 审核员工作量 */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium">审核员工作量分析</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.quality.reviewerWorkload}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="username" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="approved" stackId="a" fill="#10B981" name="通过" />
                <Bar dataKey="rejected" stackId="a" fill="#EF4444" name="拒绝" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    )
  }

  const renderTimeTab = () => {
    if (!data.timeAnalysis) return null

    return (
      <div className="space-y-6">
        {/* 标注时间分布 */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium">标注时间分布</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.timeAnalysis.timeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time_range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 24小时活跃度 */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium">24小时活跃度分析</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.timeAnalysis.hourlyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="annotations" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 平均标注时间趋势 */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium">平均标注时间趋势</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.timeAnalysis.timeProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="avg_time" stroke="#10B981" strokeWidth={2} name="平均时间(秒)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    )
  }

  const renderOverviewTab = () => {
    if (!data.dashboard) return null

    return (
      <div className="space-y-6">
        {/* 关键指标 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="总任务数"
            value={data.dashboard.overall.total_tasks}
            icon={BarChart3}
            color="blue"
          />
          <StatCard
            title="完成任务"
            value={data.dashboard.overall.completed_tasks}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="活跃标注员"
            value={data.dashboard.overall.annotator_count}
            icon={Users}
            color="purple"
          />
          <StatCard
            title="平均标注时间"
            value={data.dashboard.overall.avg_annotation_time ? 
              `${Math.round(data.dashboard.overall.avg_annotation_time)}秒` : 'N/A'}
            icon={Clock}
            color="yellow"
          />
        </div>

        {/* 今日统计 */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium">今日统计</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {data.dashboard.today.today_annotations}
                </div>
                <div className="text-sm text-gray-600">今日标注</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {data.dashboard.today.today_reviews}
                </div>
                <div className="text-sm text-gray-600">今日审核</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {data.dashboard.today.today_tasks}
                </div>
                <div className="text-sm text-gray-600">今日新任务</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {data.dashboard.today.active_annotators_today}
                </div>
                <div className="text-sm text-gray-600">活跃标注员</div>
              </div>
            </div>
          </div>
        </div>

        {/* 最近活动 */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium">最近活动</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {data.dashboard.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      activity.type === 'annotation' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {activity.type === 'annotation' ? (
                        <Activity className={`w-4 h-4 ${
                          activity.type === 'annotation' ? 'text-blue-600' : 'text-green-600'
                        }`} />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{activity.username}</div>
                      <div className="text-sm text-gray-600">
                        {activity.type === 'annotation' ? '标注了' : '审核了'} {activity.item_name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      activity.action === 'approved' ? 'text-green-600' :
                      activity.action === 'rejected' ? 'text-red-600' :
                      'text-blue-600'
                    }`}>
                      {activity.action}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(activity.created_at).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">数据分析</h1>
        <p className="mt-1 text-sm text-gray-600">
          标注过程和结果的可视化分析
        </p>
      </div>

      {/* 标签页 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* 内容区域 */}
      <div>
        {activeTab === 'progress' && renderProgressTab()}
        {activeTab === 'quality' && renderQualityTab()}
        {activeTab === 'time' && renderTimeTab()}
        {activeTab === 'overview' && renderOverviewTab()}
      </div>
    </div>
  )
} 