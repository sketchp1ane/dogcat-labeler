import { useState, useRef } from 'react'
import { taskAPI } from '../services/api'
import toast from 'react-hot-toast'
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  FileImage,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

export default function UploadPage() {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const fileInputRef = useRef(null)

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files)
    
    // 过滤只允许图片文件
    const imageFiles = selectedFiles.filter(file => 
      file.type.startsWith('image/')
    )
    
    if (imageFiles.length !== selectedFiles.length) {
      toast.error('只能上传图片文件')
    }
    
    // 检查文件大小（5MB限制）
    const validFiles = imageFiles.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`文件 ${file.name} 超过5MB限制`)
        return false
      }
      return true
    })
    
    // 添加预览URL
    const filesWithPreview = validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      preview: URL.createObjectURL(file),
      status: 'ready'
    }))
    
    setFiles(prevFiles => [...prevFiles, ...filesWithPreview])
  }

  const handleDrop = (event) => {
    event.preventDefault()
    const droppedFiles = Array.from(event.dataTransfer.files)
    
    // 模拟file input的onChange事件
    const fakeEvent = {
      target: {
        files: droppedFiles
      }
    }
    handleFileSelect(fakeEvent)
  }

  const handleDragOver = (event) => {
    event.preventDefault()
  }

  const removeFile = (id) => {
    setFiles(prevFiles => {
      const fileToRemove = prevFiles.find(f => f.id === id)
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return prevFiles.filter(f => f.id !== id)
    })
  }

  const uploadFiles = async () => {
    if (files.length === 0) {
      toast.error('请选择要上传的图片')
      return
    }

    setUploading(true)
    
    try {
      const formData = new FormData()
      files.forEach((fileObj) => {
        formData.append('images', fileObj.file)
      })

      const response = await taskAPI.createTasks(formData)
      
      toast.success(`成功创建 ${response.data.tasks.length} 个标注任务`)
      
      // 清空文件列表
      files.forEach(fileObj => {
        if (fileObj.preview) {
          URL.revokeObjectURL(fileObj.preview)
        }
      })
      setFiles([])
      
    } catch (error) {
      console.error('上传失败:', error)
    } finally {
      setUploading(false)
    }
  }

  const clearAll = () => {
    files.forEach(fileObj => {
      if (fileObj.preview) {
        URL.revokeObjectURL(fileObj.preview)
      }
    })
    setFiles([])
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">上传标注图片</h1>
        <p className="mt-1 text-sm text-gray-600">
          上传猫狗图片创建标注任务，支持 JPG、PNG、GIF 格式，单个文件最大 5MB
        </p>
      </div>

      {/* 文件上传区域 */}
      <div className="card mb-6">
        <div className="card-body">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              拖拽图片到此处或点击选择
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              支持批量上传，PNG、JPG、GIF 格式
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* 文件列表 */}
      {files.length > 0 && (
        <div className="card mb-6">
          <div className="card-header flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              待上传文件 ({files.length})
            </h3>
            <div className="space-x-2">
              <button
                onClick={clearAll}
                className="btn-outline"
                disabled={uploading}
              >
                清空列表
              </button>
              <button
                onClick={uploadFiles}
                disabled={uploading || files.length === 0}
                className="btn-primary"
              >
                {uploading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>上传中...</span>
                  </div>
                ) : (
                  `上传 ${files.length} 个文件`
                )}
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((fileObj) => (
                <div
                  key={fileObj.id}
                  className="relative group border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={fileObj.preview}
                      alt={fileObj.file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* 文件信息 */}
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {fileObj.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  
                  {/* 删除按钮 */}
                  <button
                    onClick={() => removeFile(fileObj.id)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={uploading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  {/* 状态指示器 */}
                  <div className="absolute top-2 left-2">
                    {fileObj.status === 'ready' && (
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    )}
                    {fileObj.status === 'uploading' && (
                      <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                    )}
                    {fileObj.status === 'success' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {fileObj.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">使用说明</h3>
        </div>
        <div className="card-body">
          <div className="prose prose-sm text-gray-600">
            <ul>
              <li>支持的图片格式：JPG、PNG、GIF</li>
              <li>单个文件大小限制：5MB</li>
              <li>可以批量选择多个文件同时上传</li>
              <li>上传的图片将自动创建为标注任务</li>
              <li>任务创建后，标注人员即可开始标注工作</li>
              <li>建议上传清晰的猫狗图片以提高标注质量</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 