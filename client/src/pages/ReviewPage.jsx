import { useState, useEffect } from 'react'
import { reviewAPI } from '../services/api'
import toast from 'react-hot-toast'
import {
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  User,
  Calendar,
  ArrowLeft,
  ArrowRight
} from 'lucide-react'

export default function ReviewPage() {
  const [annotations, setAnnotations] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [filter, setFilter] = useState('pending') // pending, approved, rejected, all
  const [stats, setStats] = useState({})

  const currentAnnotation = annotations[currentIndex]

  useEffect(() => {
    loadAnnotations()
    loadStats()
  }, [filter])

  const loadAnnotations = async () => {
    try {
      setLoading(true)
      const response = await reviewAPI.getPendingReviews({
        status: filter === 'all' ? undefined : filter,
        limit: 50
      })
      setAnnotations(response.data.annotations)
      setCurrentIndex(0)
    } catch (error) {
      console.error('加载标注数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await reviewAPI.getReviewStats()
      setStats(response.data.stats)
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  }

  const handleReview = async (action, feedback = '') => {
    if (!currentAnnotation) return

    setProcessing(true)
    try {
      await reviewAPI.reviewAnnotation(currentAnnotation.id, {
        status: action, // 'approved' or 'rejected' - 修复参数名
        comment: feedback // 修复参数名
      })

      toast.success(action === 'approved' ? '标注已通过' : '标注已拒绝')
      
      // 移到下一个
      const nextIndex = currentIndex + 1
      if (nextIndex < annotations.length) {
        setCurrentIndex(nextIndex)
      } else {
        // 重新加载数据
        loadAnnotations()
        loadStats()
      }
    } catch (error) {
      console.error('审核失败:', error)
    } finally {
      setProcessing(false)
    }
  }

  const handleNext = () => {
    if (currentIndex < annotations.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100'
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* 页面标题和统计 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">标注审核</h1>
          <div className="flex items-center space-x-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input"
            >
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
              <option value="all">全部</option>
            </select>
          </div>
        </div>
        
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {stats.pending_count || 0}
            </div>
            <div className="text-sm text-blue-600">待审核</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {stats.approved_count || 0}
            </div>
            <div className="text-sm text-green-600">已通过</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {stats.rejected_count || 0}
            </div>
            <div className="text-sm text-red-600">已拒绝</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">
              {stats.total_reviews || 0}
            </div>
            <div className="text-sm text-gray-600">总计</div>
          </div>
        </div>
      </div>

      {!annotations.length ? (
        <div className="text-center py-12">
          <Eye className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {filter === 'pending' ? '暂无待审核标注' : '暂无标注数据'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'pending' ? '当前没有需要审核的标注任务' : '没有找到相关数据'}
          </p>
          <div className="mt-6">
            <button
              onClick={loadAnnotations}
              className="btn-primary"
            >
              刷新数据
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 进度指示器 */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>审核进度</span>
              <span>{currentIndex + 1} / {annotations.length}</span>
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / annotations.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 图片展示区域 */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">
                  {currentAnnotation?.original_filename}
                </h3>
              </div>
              <div className="card-body">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={`/${currentAnnotation?.image_path}`}
                    alt={currentAnnotation?.original_filename}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.src = '/placeholder-image.svg'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 标注信息和审核控制 */}
            <div className="space-y-6">
              {/* 标注信息 */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">标注信息</h3>
                </div>
                <div className="card-body space-y-4">
                  {/* 标签 */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">标签:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">
                        {currentAnnotation?.label === 'cat' ? '🐱' : '🐶'}
                      </span>
                      <span className="font-medium">
                        {currentAnnotation?.label === 'cat' ? '猫' : '狗'}
                      </span>
                    </div>
                  </div>

                  {/* 置信度 */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">置信度:</span>
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${getConfidenceColor(parseFloat(currentAnnotation?.confidence) || 0)}`}>
                      {parseFloat(currentAnnotation?.confidence || 0).toFixed(1)}
                    </span>
                  </div>

                  {/* 标注人员 */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">标注人员:</span>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{currentAnnotation?.annotator_username}</span>
                    </div>
                  </div>

                  {/* 标注时间 */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">标注时间:</span>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{currentAnnotation?.annotation_time || 0}秒</span>
                    </div>
                  </div>

                  {/* 提交时间 */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">提交时间:</span>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{formatDate(currentAnnotation?.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 审核历史 */}
              {currentAnnotation?.reviews?.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-medium text-gray-900">审核历史</h3>
                  </div>
                  <div className="card-body">
                    <div className="space-y-3">
                      {currentAnnotation.reviews.map((review, index) => (
                        <div key={index} className="border-l-4 border-gray-200 pl-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {review.status === 'approved' ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span className="font-medium">
                                {review.status === 'approved' ? '通过' : '拒绝'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatDate(review.created_at)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            审核员: {review.reviewer?.username}
                          </div>
                          {review.comment && (
                            <div className="text-sm text-gray-600 mt-1">
                              反馈: {review.comment}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 审核操作 */}
              {filter === 'pending' && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-medium text-gray-900">审核操作</h3>
                  </div>
                  <div className="card-body space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleReview('approved')}
                        disabled={processing}
                        className="btn-success flex items-center justify-center space-x-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>通过</span>
                      </button>
                      <button
                        onClick={() => handleReview('rejected')}
                        disabled={processing}
                        className="btn-danger flex items-center justify-center space-x-2"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>拒绝</span>
                      </button>
                    </div>
                    
                    {processing && (
                      <div className="text-center text-sm text-gray-500">
                        处理中...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 导航按钮 */}
              <div className="flex space-x-4">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="btn-outline flex items-center space-x-2 flex-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>上一个</span>
                </button>
                
                <button
                  onClick={handleNext}
                  disabled={currentIndex === annotations.length - 1}
                  className="btn-outline flex items-center space-x-2 flex-1"
                >
                  <span>下一个</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
} 