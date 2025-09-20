import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity as ActivityIcon,
  User,
  MessageCircle,
  UserPlus,
  UserMinus,
  Edit3,
  Upload,
  Download,
  Share2,
  Clock,
  Filter,
  X,
  ChevronDown,
  Bell,
  BellOff
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from '../../ui/dropdown-menu';
import { ScrollArea } from '../../ui/scroll-area';
import { Activity, User as UserType } from '../../../types/collaboration';

interface ActivityFeedProps {
  activities: Activity[];
  users: UserType[];
  currentUserId?: string;
  className?: string;
  maxItems?: number;
  showNotifications?: boolean;
  onNotificationToggle?: (enabled: boolean) => void;
  overlayMode?: boolean;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  users,
  currentUserId,
  className = '',
  maxItems = 50,
  showNotifications = true,
  onNotificationToggle,
  overlayMode = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filteredTypes, setFilteredTypes] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState(showNotifications);
  const [newActivitiesCount, setNewActivitiesCount] = useState(0);
  const lastSeenRef = useRef<string | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  // Activity type configurations
  const activityConfig = {
    edit: {
      icon: Edit3,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      label: 'Edição'
    },
    comment: {
      icon: MessageCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      label: 'Comentário'
    },
    join: {
      icon: UserPlus,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      label: 'Entrada'
    },
    leave: {
      icon: UserMinus,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      label: 'Saída'
    },
    upload: {
      icon: Upload,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      label: 'Upload'
    },
    export: {
      icon: Download,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50',
      label: 'Export'
    },
    share: {
      icon: Share2,
      color: 'text-pink-500',
      bgColor: 'bg-pink-50',
      label: 'Compartilhamento'
    }
  };

  // Filter activities
  const filteredActivities = activities
    .filter(activity => !filteredTypes.has(activity.type))
    .slice(0, maxItems);

  // Track new activities
  useEffect(() => {
    if (activities.length > 0 && lastSeenRef.current) {
      const lastSeenIndex = activities.findIndex(a => a.id === lastSeenRef.current);
      if (lastSeenIndex >= 0) {
        setNewActivitiesCount(lastSeenIndex);
      }
    }
  }, [activities]);

  // Mark activities as seen when expanded
  useEffect(() => {
    if (isExpanded && activities.length > 0) {
      lastSeenRef.current = activities[0].id;
      setNewActivitiesCount(0);
    }
  }, [isExpanded, activities]);

  // Auto-scroll to bottom when new activities arrive
  useEffect(() => {
    if (feedRef.current && isExpanded) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [activities, isExpanded]);

  const handleNotificationToggle = () => {
    const newState = !notifications;
    setNotifications(newState);
    onNotificationToggle?.(newState);
  };

  const handleFilterToggle = (type: string) => {
    const newFiltered = new Set(filteredTypes);
    if (newFiltered.has(type)) {
      newFiltered.delete(type);
    } else {
      newFiltered.add(type);
    }
    setFilteredTypes(newFiltered);
  };

  const getActivityIcon = (type: string) => {
    const config = activityConfig[type as keyof typeof activityConfig];
    return config?.icon || ActivityIcon;
  };

  const getActivityColor = (type: string) => {
    const config = activityConfig[type as keyof typeof activityConfig];
    return config?.color || 'text-gray-500';
  };

  const getActivityBgColor = (type: string) => {
    const config = activityConfig[type as keyof typeof activityConfig];
    return config?.bgColor || 'bg-gray-50';
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
  };

  if (overlayMode) {
    return (
      <div className="fixed top-4 right-4 w-80 max-h-96 bg-white rounded-lg shadow-xl border z-40 pointer-events-auto">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center space-x-2">
            <ActivityIcon className="w-4 h-4 text-green-500" />
            <h3 className="text-sm font-medium text-gray-900">Atividades Recentes</h3>
            <Badge variant="secondary" className="text-xs">
              {filteredActivities.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNotificationToggle}
          >
            <Bell className={`w-4 h-4 ${notifications ? 'text-yellow-500' : 'text-gray-400'}`} />
          </Button>
        </div>
        
        <ScrollArea className="h-80">
          <div className="p-2 space-y-2">
            <AnimatePresence>
              {filteredActivities.slice(0, 10).map((activity, index) => {
                const user = users.find(u => u.id === activity.userId);
                const Icon = getActivityIcon(activity.type);
                
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-start space-x-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getActivityColor(activity.type)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-900 font-medium truncate">
                        {user?.name || 'Usuário Desconhecido'}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Compact View */}
      {!isExpanded && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <Button
            onClick={() => setIsExpanded(true)}
            className="relative shadow-lg"
            size="lg"
          >
            <ActivityIcon className="w-5 h-5 mr-2" />
            Atividades
            {newActivitiesCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 px-1 min-w-[20px] h-5 text-xs"
              >
                {newActivitiesCount > 99 ? '99+' : newActivitiesCount}
              </Badge>
            )}
          </Button>
        </motion.div>
      )}

      {/* Expanded View */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-4 top-4 bottom-4 w-80 bg-white rounded-lg shadow-2xl border flex flex-col z-50"
          >
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ActivityIcon className="w-5 h-5" />
                <h3 className="font-semibold">Feed de Atividades</h3>
                <Badge variant="secondary">
                  {filteredActivities.length}
                </Badge>
              </div>
              
              <div className="flex items-center gap-1">
                {/* Notifications Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNotificationToggle}
                  className={notifications ? 'text-blue-500' : 'text-gray-400'}
                >
                  {notifications ? (
                    <Bell className="w-4 h-4" />
                  ) : (
                    <BellOff className="w-4 h-4" />
                  )}
                </Button>
                
                {/* Filter Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Filter className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="px-2 py-1 text-sm font-medium">Filtrar por tipo:</div>
                    <DropdownMenuSeparator />
                    {Object.entries(activityConfig).map(([type, config]) => {
                      const Icon = config.icon;
                      return (
                        <DropdownMenuCheckboxItem
                          key={type}
                          checked={!filteredTypes.has(type)}
                          onCheckedChange={() => handleFilterToggle(type)}
                        >
                          <Icon className={`w-4 h-4 mr-2 ${config.color}`} />
                          {config.label}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Activities List */}
            <ScrollArea className="flex-1 p-4" ref={feedRef}>
              {filteredActivities.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <ActivityIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma atividade encontrada</p>
                  <p className="text-xs mt-1">As atividades aparecerão aqui em tempo real</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {filteredActivities.map((activity, index) => {
                      const user = users.find(u => u.id === activity.userId);
                      const Icon = getActivityIcon(activity.type);
                      const isNew = index < newActivitiesCount;
                      
                      return (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -20, scale: 0.95 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className={`
                            relative p-3 rounded-lg border transition-all
                            ${isNew 
                              ? 'bg-blue-50 border-blue-200 shadow-sm' 
                              : 'bg-gray-50 border-gray-200'
                            }
                          `}
                        >
                          {/* New Activity Indicator */}
                          {isNew && (
                            <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                          
                          <div className="flex items-start gap-3">
                            {/* Activity Icon */}
                            <div className={`
                              w-8 h-8 rounded-full flex items-center justify-center
                              ${getActivityBgColor(activity.type)}
                            `}>
                              <Icon className={`w-4 h-4 ${getActivityColor(activity.type)}`} />
                            </div>
                            
                            {/* Activity Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Avatar className="w-5 h-5">
                                  <AvatarImage src={user?.avatar} />
                                  <AvatarFallback>
                                    <User className="w-3 h-3" />
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium truncate">
                                  {user?.name || 'Usuário Desconhecido'}
                                </span>
                              </div>
                              
                              <p className="text-sm text-gray-700 mb-1">
                                {activity.description}
                              </p>
                              
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>{formatTimeAgo(activity.timestamp)}</span>
                                
                                {/* Activity Metadata */}
                                {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{Object.keys(activity.metadata).length} detalhes
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Activity Details */}
                          {activity.metadata && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              className="mt-2 pt-2 border-t border-gray-200"
                            >
                              <div className="text-xs text-gray-600">
                                {Object.entries(activity.metadata).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="capitalize">{key}:</span>
                                    <span className="font-mono">{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>

            {/* Footer */}
            <div className="p-3 border-t bg-gray-50 rounded-b-lg">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Atualizado em tempo real</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>Online</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Activity notification component
export const ActivityNotification: React.FC<{
  activity: Activity;
  user?: UserType;
  onDismiss: () => void;
}> = ({ activity, user, onDismiss }) => {
  const Icon = activity.type === 'edit' ? Edit3 : 
               activity.type === 'comment' ? MessageCircle :
               activity.type === 'join' ? UserPlus :
               activity.type === 'leave' ? UserMinus :
               ActivityIcon;

  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg border p-4 max-w-sm"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-blue-500" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Avatar className="w-4 h-4">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>
                <User className="w-2 h-2" />
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{user?.name}</span>
          </div>
          
          <p className="text-sm text-gray-700">{activity.description}</p>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default ActivityFeed;