import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  LayoutDashboard, 
  Image, 
  CheckSquare, 
  Users, 
  Settings,
  Upload,
  BarChart3
} from 'lucide-react'

export default function Sidebar() {
  const { user } = useAuth()

  const getMenuItems = () => {
    const baseItems = [
      { name: '概览', href: '/dashboard', icon: LayoutDashboard }
    ]

    if (user?.role === 'admin') {
      return [
        ...baseItems,
        { name: '上传图片', href: '/dashboard/upload', icon: Upload },
        { name: '用户管理', href: '/dashboard/users', icon: Users },
        { name: '标注审核', href: '/dashboard/review', icon: CheckSquare },
        { name: '标注任务', href: '/dashboard/annotation', icon: Image },
      ]
    }

    if (user?.role === 'reviewer') {
      return [
        ...baseItems,
        { name: '标注审核', href: '/dashboard/review', icon: CheckSquare },
      ]
    }

    if (user?.role === 'annotator') {
      return [
        ...baseItems,
        { name: '标注任务', href: '/dashboard/annotation', icon: Image },
      ]
    }

    return baseItems
  }

  const menuItems = getMenuItems()

  return (
    <div className="bg-white w-64 min-h-screen shadow-lg">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800">
          猫狗标注平台
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {user?.role === 'admin' && '管理员'}
          {user?.role === 'reviewer' && '审核员'}
          {user?.role === 'annotator' && '标注员'}
        </p>
      </div>
      
      <nav className="mt-6">
        <div className="px-3">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 mt-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                  isActive
                    ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
} 