import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const useNavigationDebug = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🧭 Rota atual:', {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      state: location.state
    });
  }, [location]);

  const debugNavigate = (to: string, options?: any) => {
    console.log('🚀 Tentando navegar para:', to, options);
    try {
      navigate(to, options);
      console.log('✅ Navegação executada com sucesso');
    } catch (error) {
      console.error('❌ Erro na navegação:', error);
    }
  };

  return {
    currentPath: location.pathname,
    navigate: debugNavigate,
    location
  };
};