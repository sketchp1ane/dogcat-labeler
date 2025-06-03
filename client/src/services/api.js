import axios from 'axios'
import toast from 'react-hot-toast'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // 如果是401错误，需要区分是登录失败还是token过期
    if (error.response?.status === 401) {
      // 如果不是登录接口的错误，才清除token并跳转
      if (!error.config?.url?.includes('/auth/login')) {
        localStorage.removeItem('token')
        // 如果当前不在登录页面，才跳转
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }
    
    // 对于登录接口的错误，不显示toast（由登录页面自己处理）
    if (!error.config?.url?.includes('/auth/login')) {
      const message = error.response?.data?.message || '请求失败'
      toast.error(message)
    }
    
    return Promise.reject(error)
  }
)

// 认证API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
}

// 任务API
export const taskAPI = {
  getTasks: (params) => api.get('/tasks', { params }),
  getTaskById: (id) => api.get(`/tasks/${id}`),
  createTasks: (formData) => api.post('/tasks/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  assignTask: (id, data) => api.put(`/tasks/${id}/assign`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  getTaskStats: () => api.get('/tasks/stats/overview'),
}

// 标注API
export const annotationAPI = {
  submitAnnotation: (taskId, data) => api.post(`/annotations/tasks/${taskId}/submit`, data),
  getAnnotationHistory: (params) => api.get('/annotations/history', { params }),
  getPendingTasks: (params) => api.get('/annotations/pending', { params }),
  claimTask: (taskId) => api.post(`/annotations/tasks/${taskId}/claim`),
  getAnnotationStats: () => api.get('/annotations/stats'),
}

// 审核API
export const reviewAPI = {
  getPendingReviews: (params) => api.get('/reviews/pending', { params }),
  reviewAnnotation: (annotationId, data) => api.post(`/reviews/${annotationId}`, data),
  getReviewHistory: (params) => api.get('/reviews/history', { params }),
  getReviewStats: () => api.get('/reviews/stats'),
  batchReview: (data) => api.post('/reviews/batch', data),
}

// 分析API
export const analyticsAPI = {
  getAnnotationProgress: () => api.get('/analytics/annotation-progress'),
  getAnnotationQuality: () => api.get('/analytics/annotation-quality'),
  getTimeAnalysis: () => api.get('/analytics/time-analysis'),
  getDashboardData: () => api.get('/analytics/dashboard'),
}

// 用户API
export const userAPI = {
  getAllUsers: (params) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  resetPassword: (id, data) => api.put(`/users/${id}/reset-password`, data),
  getUserStats: () => api.get('/users/stats/overview'),
}

export default api