import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { 
  Home, Video, FileText, Settings, Menu, 
  BarChart3, Shield, Monitor, Palette, Database, 
  ChevronDown, Zap, Brain, Users, Code
} from 'lucide-react';

import { cn } from '../lib/utils';

const Navigation: React.FC = () => {
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);


  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const [dropdownOpen, setDropdownOpen] = React.useState<string | null>(null);

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/dashboard', label: 'Dashboard', icon: Video },
    { path: '/editor', label: 'Editor', icon: Video },
    { path: '/projects', label: 'Projetos', icon: FileText },
    { path: '/templates', label: 'Templates', icon: Palette }
  ];

  const analyticsItems = [
    { path: '/analytics', label: 'Dashboard Analytics', icon: BarChart3 },
    { path: '/analytics/video', label: 'Video Analytics', icon: BarChart3 },
    { path: '/analytics/performance', label: 'Performance', icon: Monitor },
    { path: '/analytics/metrics', label: 'Métricas', icon: BarChart3 }
  ];

  const adminItems = [
    { path: '/admin/security', label: 'Segurança', icon: Shield },
    { path: '/admin/monitoring', label: 'Monitoramento', icon: Monitor },
    { path: '/admin/database', label: 'Database', icon: Database },
    { path: '/admin/api-integration', label: 'API Integration', icon: Code }
  ];

  const aiItems = [
    { path: '/ai/hub', label: 'AI Hub', icon: Brain },
    { path: '/ai/avatars', label: 'Avatares 3D', icon: Users },
    { path: '/ai/tts', label: 'Text-to-Speech', icon: Zap }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isDropdownActive = (items: any[]) => {
    return items.some(item => location.pathname.startsWith(item.path));
  };

  const toggleDropdown = (dropdown: string) => {
    setDropdownOpen(dropdownOpen === dropdown ? null : dropdown);
  };

  const handleItemClick = () => {
    setDropdownOpen(null);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="transition-all duration-300 group-hover:shadow-md">
              <img 
                src="/attached_assets/Vyond Studio_1_1758158316501.png" 
                alt="Tecno Cursos Logo" 
                className="h-10 w-auto object-contain"
              />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">Estúdio IA</span>
          </Link>
        </div>

        {/* Navigation Links - Desktop */}
        <div className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path} onClick={handleItemClick}>
                <Button
                  variant={active ? 'default' : 'ghost'}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 transition-all duration-200",
                    active ? "shadow-md" : "hover:bg-gray-100"
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-white" : "text-gray-700")} />
                  <span>{item.label}</span>
                </Button>
              </Link>
            );
          })}
          
          {/* Analytics Dropdown */}
          <div className="relative">
            <Button
              variant={isDropdownActive(analyticsItems) ? 'default' : 'ghost'}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 transition-all duration-200",
                isDropdownActive(analyticsItems) ? "shadow-md" : "hover:bg-gray-100"
              )}
              onClick={() => toggleDropdown('analytics')}
            >
              <BarChart3 className={cn("h-4 w-4", isDropdownActive(analyticsItems) ? "text-white" : "text-gray-700")} />
              <span>Analytics</span>
              <ChevronDown className={cn("h-3 w-3 transition-transform", dropdownOpen === 'analytics' ? "rotate-180" : "")} />
            </Button>
            {dropdownOpen === 'analytics' && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                {analyticsItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.path} to={item.path} onClick={handleItemClick}>
                      <div className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 transition-colors">
                        <Icon className="h-4 w-4 text-gray-600" />
                        <span className="text-sm">{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI Tools Dropdown */}
          <div className="relative">
            <Button
              variant={isDropdownActive(aiItems) ? 'default' : 'ghost'}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 transition-all duration-200",
                isDropdownActive(aiItems) ? "shadow-md" : "hover:bg-gray-100"
              )}
              onClick={() => toggleDropdown('ai')}
            >
              <Brain className={cn("h-4 w-4", isDropdownActive(aiItems) ? "text-white" : "text-gray-700")} />
              <span>AI Tools</span>
              <ChevronDown className={cn("h-3 w-3 transition-transform", dropdownOpen === 'ai' ? "rotate-180" : "")} />
            </Button>
            {dropdownOpen === 'ai' && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                {aiItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.path} to={item.path} onClick={handleItemClick}>
                      <div className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 transition-colors">
                        <Icon className="h-4 w-4 text-gray-600" />
                        <span className="text-sm">{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Admin Dropdown */}
          <div className="relative">
            <Button
              variant={isDropdownActive(adminItems) ? 'default' : 'ghost'}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 transition-all duration-200",
                isDropdownActive(adminItems) ? "shadow-md" : "hover:bg-gray-100"
              )}
              onClick={() => toggleDropdown('admin')}
            >
              <Shield className={cn("h-4 w-4", isDropdownActive(adminItems) ? "text-white" : "text-gray-700")} />
              <span>Admin</span>
              <ChevronDown className={cn("h-3 w-3 transition-transform", dropdownOpen === 'admin' ? "rotate-180" : "")} />
            </Button>
            {dropdownOpen === 'admin' && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                {adminItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.path} to={item.path} onClick={handleItemClick}>
                      <div className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 transition-colors">
                        <Icon className="h-4 w-4 text-gray-600" />
                        <span className="text-sm">{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Settings Menu - Desktop */}
        <div className="hidden md:flex items-center space-x-2">
          <Link to="/settings">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
              <Settings className="h-5 w-5 text-gray-700" />
            </Button>
          </Link>
        </div>
        
        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="rounded-full">
            <Menu className="h-5 w-5 text-gray-700" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={cn(
        "md:hidden mt-3 flex flex-col space-y-2 overflow-hidden transition-all duration-300",
        mobileMenuOpen ? "max-h-[500px] opacity-100 py-3" : "max-h-0 opacity-0"
      )}>
        {/* Main Navigation Items */}
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link key={item.path} to={item.path} className="w-full" onClick={handleItemClick}>
              <Button
                variant={active ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "w-full flex items-center justify-start space-x-2 py-2",
                  active ? "shadow-sm" : ""
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-white" : "text-gray-700")} />
                <span>{active ? "Atual: " : ""}{item.label}</span>
              </Button>
            </Link>
          );
        })}
        
        {/* Analytics Section */}
        <div className="border-t pt-2 mt-2">
          <div className="text-xs font-semibold text-gray-500 px-2 mb-1">ANALYTICS</div>
          {analyticsItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path} className="w-full" onClick={handleItemClick}>
                <Button
                  variant={active ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    "w-full flex items-center justify-start space-x-2 py-2 pl-4",
                    active ? "shadow-sm" : ""
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-white" : "text-gray-600")} />
                  <span className="text-sm">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
        
        {/* AI Tools Section */}
        <div className="border-t pt-2 mt-2">
          <div className="text-xs font-semibold text-gray-500 px-2 mb-1">AI TOOLS</div>
          {aiItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path} className="w-full" onClick={handleItemClick}>
                <Button
                  variant={active ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    "w-full flex items-center justify-start space-x-2 py-2 pl-4",
                    active ? "shadow-sm" : ""
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-white" : "text-gray-600")} />
                  <span className="text-sm">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
        
        {/* Admin Section */}
        <div className="border-t pt-2 mt-2">
          <div className="text-xs font-semibold text-gray-500 px-2 mb-1">ADMIN</div>
          {adminItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path} className="w-full" onClick={handleItemClick}>
                <Button
                  variant={active ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    "w-full flex items-center justify-start space-x-2 py-2 pl-4",
                    active ? "shadow-sm" : ""
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-white" : "text-gray-600")} />
                  <span className="text-sm">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
        
        {/* Settings */}
        <div className="border-t pt-2 mt-2">
          <Link to="/settings" className="w-full" onClick={handleItemClick}>
            <Button
              variant={isActive('/settings') ? 'default' : 'ghost'}
              size="sm"
              className="w-full flex items-center justify-start space-x-2 py-2"
            >
              <Settings className={cn("h-4 w-4", isActive('/settings') ? "text-white" : "text-gray-700")} />
              <span>Configurações</span>
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;