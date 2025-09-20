import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';

interface EffectsSearchProps {
  onSearch: (query: string) => void;
  onCategoryFilter: (categories: string[]) => void;
  categories: string[];
  selectedCategories: string[];
}

const EFFECT_CATEGORIES = [
  { id: 'color', name: 'Cor', color: 'bg-blue-100 text-blue-800' },
  { id: 'blur', name: 'Desfoque', color: 'bg-purple-100 text-purple-800' },
  { id: 'distortion', name: 'Distorção', color: 'bg-green-100 text-green-800' },
  { id: 'artistic', name: 'Artístico', color: 'bg-pink-100 text-pink-800' },
  { id: 'lighting', name: 'Iluminação', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'vintage', name: 'Vintage', color: 'bg-orange-100 text-orange-800' },
  { id: 'cinematic', name: 'Cinemático', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'transition', name: 'Transição', color: 'bg-gray-100 text-gray-800' }
];

export const EffectsSearch: React.FC<EffectsSearchProps> = ({
  onSearch,
  onCategoryFilter,
  categories,
  selectedCategories
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
    
    onCategoryFilter(newCategories);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    onSearch('');
    onCategoryFilter([]);
  };

  const availableCategories = useMemo(() => {
    return EFFECT_CATEGORIES.filter(cat => categories.includes(cat.id));
  }, [categories]);

  const hasActiveFilters = searchQuery.length > 0 || selectedCategories.length > 0;

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar efeitos..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSearchChange('')}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros
          {selectedCategories.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {selectedCategories.length}
            </Badge>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Category Filters */}
      {showFilters && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Categorias</h4>
          <div className="flex flex-wrap gap-2">
            {availableCategories.map((category) => {
              const isSelected = selectedCategories.includes(category.id);
              return (
                <Button
                  key={category.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategoryToggle(category.id)}
                  className={`text-xs ${isSelected ? '' : 'hover:' + category.color}`}
                >
                  {category.name}
                  {isSelected && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {selectedCategories.length > 0 && !showFilters && (
        <div className="flex flex-wrap gap-1">
          {selectedCategories.map((categoryId) => {
            const category = EFFECT_CATEGORIES.find(cat => cat.id === categoryId);
            if (!category) return null;
            
            return (
              <Badge
                key={categoryId}
                variant="secondary"
                className={`text-xs ${category.color} cursor-pointer`}
                onClick={() => handleCategoryToggle(categoryId)}
              >
                {category.name}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EffectsSearch;