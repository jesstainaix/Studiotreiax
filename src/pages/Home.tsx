import React from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">Studio Treiax</h1>
        <p className="text-xl text-gray-600 max-w-2xl mb-10">
          Plataforma completa para criação e edição de conteúdo multimídia
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button 
            size="lg" 
            onClick={() => navigate('/dashboard')}
            className="font-medium"
          >
            Acessar Plataforma
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Recursos Principais</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Editor Avançado</CardTitle>
              <CardDescription>Ferramentas profissionais de edição</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Edite seus projetos com uma interface intuitiva e recursos avançados de edição.</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Projetos Colaborativos</CardTitle>
              <CardDescription>Trabalhe em equipe</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Compartilhe seus projetos e trabalhe em colaboração com sua equipe em tempo real.</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Templates Prontos</CardTitle>
              <CardDescription>Comece rapidamente</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Utilize templates profissionais para acelerar seu fluxo de trabalho e criar conteúdo de qualidade.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 py-12 mt-16">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2023 Studio Treiax. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}