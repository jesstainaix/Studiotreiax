import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Sparkles, 
  Clock, 
  Star, 
  Filter, 
  Search, 
  Play, 
  Download,
  Eye,
  Zap,
  Shield,
  TrendingUp,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'

export interface AITemplateRecommendation {
  id: string
  name: string
  description: string
  category: 'business' | 'education' | 'safety' | 'marketing' | 'training'
  confidence: number
  estimatedTime: number
  preview: string
  features: string[]
  reasons: string[]
  compatibility: number
  popularity: number
  tags: string[]
  nrCompliant?: boolean
  aiGenerated: boolean
}

interface AITemplateRecommendationsProps {
  recommendations: AITemplateRecommendation[]
  onSelectTemplate: (template: AITemplateRecommendation) => void
  onPreviewTemplate: (template: AITemplateRecommendation) => void
  isLoading?: boolean
  className?: string
}

const AITemplateRecommendations: React.FC<AITemplateRecommendationsProps> = ({
  recommendations,
  onSelectTemplate,
  onPreviewTemplate,
  isLoading = false,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'confidence' | 'popularity' | 'time'>('confidence')
  const [showOnlyNRCompliant, setShowOnlyNRCompliant] = useState(false)

  // Filter and sort recommendations
  const filteredRecommendations = useMemo(() => {
    const filtered = recommendations.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
      const matchesNRFilter = !showOnlyNRCompliant || template.nrCompliant
      
      return matchesSearch && matchesCategory && matchesNRFilter
    })

    // Sort recommendations
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'confidence':
          return b.confidence - a.confidence
        case 'popularity':
          return b.popularity - a.popularity
        case 'time':
          return a.estimatedTime - b.estimatedTime
        default:
          return 0
      }
    })

    return filtered
  }, [recommendations, searchTerm, selectedCategory, sortBy, showOnlyNRCompliant])

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'business', label: 'Business' },
    { value: 'education', label: 'Education' },
    { value: 'safety', label: 'Safety' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'training', label: 'Training' }
  ]

  const handleTemplateSelect = (template: AITemplateRecommendation) => {
    toast.success(`Template "${template.name}" selected`)
    onSelectTemplate(template)
  }

  const handleTemplatePreview = (template: AITemplateRecommendation) => {
    onPreviewTemplate(template)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'business': return <TrendingUp className="h-4 w-4" />
      case 'education': return <Star className="h-4 w-4" />
      case 'safety': return <Shield className="h-4 w-4" />
      case 'marketing': return <Zap className="h-4 w-4" />
      case 'training': return <Play className="h-4 w-4" />
      default: return <Sparkles className="h-4 w-4" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600'
    if (confidence >= 75) return 'text-blue-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 animate-pulse text-blue-600" />
          <h3 className="text-lg font-semibold">Generating AI Recommendations...</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-8 bg-gray-200 rounded w-full mt-4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">AI Template Recommendations</h3>
          <Badge variant="secondary">{filteredRecommendations.length} templates</Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(value: 'confidence' | 'popularity' | 'time') => setSortBy(value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="confidence">Confidence</SelectItem>
            <SelectItem value="popularity">Popularity</SelectItem>
            <SelectItem value="time">Processing Time</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={showOnlyNRCompliant ? "default" : "outline"}
          onClick={() => setShowOnlyNRCompliant(!showOnlyNRCompliant)}
          className="flex items-center gap-2"
        >
          <Shield className="h-4 w-4" />
          NR Compliant
        </Button>
      </div>

      {/* Templates Grid */}
      {filteredRecommendations.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <Filter className="h-12 w-12 text-gray-400" />
            <div>
              <h4 className="text-lg font-medium text-gray-900">No templates found</h4>
              <p className="text-gray-500">Try adjusting your search criteria or filters</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
                setShowOnlyNRCompliant(false)
              }}
            >
              Clear Filters
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecommendations.map((template) => (
            <Card key={template.id} className="group hover:shadow-lg transition-all duration-200 border-0 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(template.category)}
                    <CardTitle className="text-base font-medium group-hover:text-blue-600 transition-colors">
                      {template.name}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    {template.nrCompliant && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        NR
                      </Badge>
                    )}
                    {template.aiGenerated && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI
                      </Badge>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Confidence and Time */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className={`font-medium ${getConfidenceColor(template.confidence)}`}>
                      {template.confidence}% match
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>{template.estimatedTime}min</span>
                  </div>
                </div>

                {/* Progress Bars */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Confidence</span>
                    <span className="font-medium">{template.confidence}%</span>
                  </div>
                  <Progress value={template.confidence} className="h-1" />
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Compatibility</span>
                    <span className="font-medium">{template.compatibility}%</span>
                  </div>
                  <Progress value={template.compatibility} className="h-1" />
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Key Features</h5>
                  <div className="flex flex-wrap gap-1">
                    {template.features.slice(0, 3).map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs px-2 py-0">
                        {feature}
                      </Badge>
                    ))}
                    {template.features.length > 3 && (
                      <Badge variant="outline" className="text-xs px-2 py-0">
                        +{template.features.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Reasons */}
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Why Recommended</h5>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {template.reasons.slice(0, 2).map((reason, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Use Template
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleTemplatePreview(template)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default AITemplateRecommendations