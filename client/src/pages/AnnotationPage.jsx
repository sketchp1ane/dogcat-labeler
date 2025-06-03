import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { annotationAPI } from '../services/api'
import toast from 'react-hot-toast'
import { 
  Image, 
  Tag, 
  CheckCircle, 
  XCircle, 
  Clock,
  ArrowLeft,
  ArrowRight 
} from 'lucide-react'

export default function AnnotationPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [selectedLabel, setSelectedLabel] = useState('')
  const [confidence, setConfidence] = useState(1.0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [annotationTime, setAnnotationTime] = useState(0)
  const [startTime, setStartTime] = useState(null)

  const currentTask = tasks[currentTaskIndex]

  useEffect(() => {
    loadPendingTasks()
  }, [])

  useEffect(() => {
    // 开始计时
    if (currentTask && !startTime) {
      setStartTime(Date.now())
    }
  }, [currentTask, startTime])

  const loadPendingTasks = async () => {
    try {
      setLoading(true)
      const response = await annotationAPI.getPendingTasks({ limit: 20 })
      setTasks(response.data.tasks)
      setCurrentTaskIndex(0)
      setSelectedLabel('')
      setStartTime(null)
    } catch (error) {
      console.error('加载任务失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLabelSelect = (label) => {
    setSelectedLabel(label)
  }

  const handleSubmit = async () => {
    if (!selectedLabel) {
      toast.error('请选择标签')
      return
    }

    if (!currentTask) {
      toast.error('没有可标注的任务')
      return
    }

    setSubmitting(true)
    const endTime = Date.now()
    const timeSpent = startTime ? Math.round((endTime - startTime) / 1000) : 0

    try {
      await annotationAPI.submitAnnotation(currentTask.id, {
        label: selectedLabel,
        confidence: confidence,
        annotationTime: timeSpent
      })

      toast.success('标注提交成功！')
      
      // 移到下一个任务
      const nextIndex = currentTaskIndex + 1
      if (nextIndex < tasks.length) {
        setCurrentTaskIndex(nextIndex)
        setSelectedLabel('')
        setStartTime(Date.now())
      } else {
        // 没有更多任务了，重新加载
        loadPendingTasks()
      }
    } catch (error) {
      console.error('提交标注失败:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSkip = () => {
    const nextIndex = currentTaskIndex + 1
    if (nextIndex < tasks.length) {
      setCurrentTaskIndex(nextIndex)
      setSelectedLabel('')
      setStartTime(Date.now())
    } else {
      toast.info('没有更多任务了')
    }
  }

  const handlePrevious = () => {
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex(currentTaskIndex - 1)
      setSelectedLabel('')
      setStartTime(Date.now())
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!tasks.length) {
    return (
      <div className="text-center py-12">
        <Image className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">暂无标注任务</h3>
        <p className="mt-1 text-sm text-gray-500">
          当前没有可标注的任务，请稍后再试。
        </p>
        <div className="mt-6">
          <button
            onClick={loadPendingTasks}
            className="btn-primary"
          >
            刷新任务列表
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">图片标注</h1>
          <div className="text-sm text-gray-500">
            任务 {currentTaskIndex + 1} / {tasks.length}
          </div>
        </div>
        
        {/* 进度条 */}
        <div className="mt-4 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentTaskIndex + 1) / tasks.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 图片显示区域 */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">
              {currentTask?.original_filename}
            </h3>
          </div>
          <div className="card-body">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={`/${currentTask?.image_path}`}
                alt={currentTask?.original_filename}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.src = '/placeholder-image.svg'
                }}
              />
            </div>
          </div>
        </div>

        {/* 标注控制区域 */}
        <div className="space-y-6">
          {/* 标签选择 */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">选择标签</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleLabelSelect('cat')}
                  className={`p-6 border-2 rounded-lg transition-all duration-200 ${
                    selectedLabel === 'cat'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">🐱</div>
                    <div className="font-medium">猫</div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleLabelSelect('dog')}
                  className={`p-6 border-2 rounded-lg transition-all duration-200 ${
                    selectedLabel === 'dog'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">🐶</div>
                    <div className="font-medium">狗</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* 置信度调整 */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">置信度</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={confidence}
                  onChange={(e) => setConfidence(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>不确定 (0.1)</span>
                  <span className="font-medium">{confidence}</span>
                  <span>非常确定 (1.0)</span>
                </div>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex space-x-4">
            <button
              onClick={handlePrevious}
              disabled={currentTaskIndex === 0}
              className="btn-outline flex items-center space-x-2 flex-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>上一张</span>
            </button>
            
            <button
              onClick={handleSkip}
              className="btn-outline flex items-center space-x-2 flex-1"
            >
              <ArrowRight className="w-4 h-4" />
              <span>跳过</span>
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!selectedLabel || submitting}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>提交中...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>提交标注</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
} 