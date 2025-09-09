import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Users, Upload, Check, ArrowRight } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { company, updateCompany } = useCompany();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [companyData, setCompanyData] = useState({
    name: company?.name || '',
    description: '',
  });

  const steps = [
    {
      id: 1,
      title: 'Configurar Empresa',
      description: 'Configure as informações básicas da sua empresa',
      icon: Building2,
    },
    {
      id: 2,
      title: 'Convidar Equipe',
      description: 'Convide membros para sua equipe (opcional)',
      icon: Users,
    },
    {
      id: 3,
      title: 'Primeiro Upload',
      description: 'Faça seu primeiro upload de documento',
      icon: Upload,
    },
  ];

  const handleCompanyUpdate = async () => {
    if (!companyData.name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Nome da empresa é obrigatório',
      });
      return;
    }

    try {
      await updateCompany({
        name: companyData.name,
      });

      toast({
        title: 'Empresa atualizada!',
        description: 'Informações da empresa salvas com sucesso.',
      });

      setCurrentStep(2);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao atualizar empresa. Tente novamente.',
      });
    }
  };

  const handleSkipStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/empresa');
    }
  };

  const handleFinish = () => {
    toast({
      title: 'Bem-vindo ao DocuMentor!',
      description: 'Sua configuração inicial foi concluída.',
    });
    navigate('/empresa');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nome da Empresa</Label>
              <Input
                id="companyName"
                value={companyData.name}
                onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome da sua empresa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyDescription">Descrição (opcional)</Label>
              <Input
                id="companyDescription"
                value={companyData.description}
                onChange={(e) => setCompanyData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Breve descrição da empresa"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleCompanyUpdate} className="flex-1">
                Salvar e Continuar
              </Button>
              <Button variant="outline" onClick={handleSkipStep}>
                Pular
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center py-8">
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Você pode convidar membros da equipe mais tarde nas configurações da empresa.
              </p>
              <p className="text-sm text-muted-foreground">
                Com o plano Starter, você pode ter até 3 usuários.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSkipStep} className="flex-1">
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center py-8">
              <Upload className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Você pode fazer seu primeiro upload de documento na seção de Gerenciamento de Documentos.
              </p>
              <p className="text-sm text-muted-foreground">
                Com o plano Starter, você pode upload até 100 documentos.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleFinish} className="flex-1">
                Finalizar Configuração
                <Check className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Bem-vindo ao DocuMentor!
          </h1>
          <p className="text-muted-foreground">
            Vamos configurar sua conta em alguns passos simples
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : 'border-muted-foreground text-muted-foreground'
                }`}>
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Card */}
        <Card className="shadow-lg border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {steps[currentStep - 1]?.title}
            </CardTitle>
            <CardDescription>
              {steps[currentStep - 1]?.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Step indicator */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Passo {currentStep} de {steps.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;