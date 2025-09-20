import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import {
  LayoutDashboard,
  FolderOpen,
  Upload,
  Video,
  FileText,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Play,
  Zap,
  Home,
  Sparkles
} from 'lucide-react'


interface SidebarProps {
  className?: string
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Visão geral do seu trabalho',
  },
  {
    name: 'Projetos',
    href: '/projects',
    icon: FolderOpen,
    description: 'Gerencie seus projetos',
  },
  {
    name: 'Upload',
    href: '/upload',
    icon: Upload,
    description: 'Envie novos arquivos',
  },
  {
    name: 'Editor',
    href: '/editor',
    icon: Video,
    description: 'Edite seus vídeos',
  },
  {
    name: 'Templates',
    href: '/templates',
    icon: FileText,
    description: 'Modelos prontos para uso',
    badge: 'Novo'
  },
  {
    name: 'VFX Engine',
    href: '/vfx',
    icon: Sparkles,
    description: 'Efeitos visuais avançados',
    badge: 'Beta'
  },
]

const secondaryNavigation = [
  {
    name: 'Configurações',
    href: '/settings',
    icon: Settings,
  },
  {
    name: 'Perfil',
    href: '/profile',
    icon: User,
  },
]

export default function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const location = useLocation()


  // Auto-collapse sidebar on mobile screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && !collapsed) {
        setCollapsed(true)
      }
    }
    
    window.addEventListener('resize', handleResize)
    handleResize() // Check on initial render
    
    return () => window.removeEventListener('resize', handleResize)
  }, [collapsed])

  const handleLogout = async () => {
    // Redirect to dashboard instead of logout
    window.location.href = '/dashboard'
  }

  return (
    <div className={cn(
      "flex flex-col bg-white border-r border-gray-200 transition-all duration-300 shadow-md h-screen sticky top-0",
      collapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!collapsed ? (
          <div className="flex items-center gap-2 transition-all duration-300 opacity-100">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-heading font-bold text-gray-900 tracking-tight">Estúdio IA</h1>
              <p className="text-xs text-gray-500">Vídeos Inteligentes</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center w-full py-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-300">
              <Zap className="h-4 w-4 text-white" />
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 absolute right-2 top-4 hover:bg-gray-100 rounded-full"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="space-y-1.5">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            const isHovered = hoveredItem === item.name
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-primary-50 text-primary-700 border border-primary-200 shadow-sm"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm"
                )}
                title={collapsed ? item.name : undefined}
                onMouseEnter={() => setHoveredItem(item.name)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-md transition-all duration-200",
                  isActive ? "bg-primary-100" : isHovered ? "bg-gray-100" : ""
                )}>
                  <item.icon className={cn(
                    "h-4 w-4 flex-shrink-0 transition-all duration-200",
                    isActive ? "text-primary-600" : "text-gray-500",
                    isHovered && !isActive && "text-gray-700 scale-110"
                  )} />
                </div>
                
                {!collapsed && (
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-body">{item.name}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs ml-2 bg-primary-100 text-primary-700 hover:bg-primary-200">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    {isHovered && !isActive && (
                      <span className="text-xs text-gray-500 mt-0.5 transition-all duration-200 opacity-80">
                        {item.description}
                      </span>
                    )}
                  </div>
                )}
                
                {collapsed && item.badge && (
                  <Badge variant="secondary" className="absolute right-1 top-1 w-2 h-2 p-0 bg-primary-500 rounded-full" />
                )}
              </Link>
            )
          })}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-4 opacity-60" />

        {/* Secondary Navigation */}
        <div className="space-y-1.5">
          {secondaryNavigation.map((item) => {
            const isActive = location.pathname === item.href
            const isHovered = hoveredItem === item.name
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-primary-50 text-primary-700 border border-primary-200 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
                title={collapsed ? item.name : undefined}
                onMouseEnter={() => setHoveredItem(item.name)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-md transition-all duration-200",
                  isActive ? "bg-primary-100" : isHovered ? "bg-gray-100" : ""
                )}>
                  <item.icon className={cn(
                    "h-4 w-4 flex-shrink-0 transition-all duration-200",
                    isActive ? "text-primary-600" : "text-gray-500",
                    isHovered && !isActive && "text-gray-700 scale-110"
                  )} />
                </div>
                {!collapsed && <span className="font-body">{item.name}</span>}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User Profile & Logout */}
      <div className="border-t border-gray-200 p-4 mt-auto">
        {!collapsed && (
          <div className="flex items-center gap-3 mb-3 p-2 rounded-lg hover:bg-gray-50 transition-all duration-200">
            <div className="w-9 h-9 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center shadow-sm">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-body font-medium text-gray-900 truncate">
                Usuário
              </p>
              <p className="text-xs text-gray-500 truncate font-body">
                usuario@exemplo.com
              </p>
            </div>
          </div>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className={cn(
            "w-full justify-start gap-3 text-gray-700 hover:bg-danger-50 hover:text-danger-700 hover:border-danger-200 transition-all duration-200 mt-1",
            collapsed && "justify-center p-2"
          )}
          title={collapsed ? "Sair" : undefined}
        >
          <LogOut className={cn("h-4 w-4", collapsed && "mx-auto")} />
          {!collapsed && <span className="font-body">Sair</span>}
        </Button>
      </div>
    </div>
  )
}