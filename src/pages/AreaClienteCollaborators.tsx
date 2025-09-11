import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, UserPlus, Crown, Settings, Mail, Calendar, AlertTriangle, Users } from "lucide-react";
import { toast } from "sonner";

interface Collaborator {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
}

interface CompanyPlan {
  plan: string;
  currentUsers: number;
  userLimit: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  collaborators: Collaborator[];
  companyPlan: CompanyPlan;
  newCollaborator: {
    name: string;
    email: string;
    role: string;
  };
  setNewCollaborator: (collaborator: any) => void;
  onInvite: (e: React.FormEvent) => void;
}

export function CollaboratorsModal({
  isOpen,
  onClose,
  collaborators,
  companyPlan,
  newCollaborator,
  setNewCollaborator,
  onInvite
}: Props) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case "Administrador":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case "Colaborador":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPlanLimitMessage = () => {
    if (companyPlan.plan === "starter") {
      return "Plano Starter permite até 3 colaboradores";
    } else if (companyPlan.plan === "professional") {
      return "Plano Professional permite até 10 colaboradores";
    } else {
      return "Plano Enterprise permite colaboradores ilimitados";
    }
  };

  const canAddMore = companyPlan.currentUsers < companyPlan.userLimit || companyPlan.userLimit === -1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Gerenciar Colaboradores</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Info */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  <div>
                    <h3 className="font-semibold capitalize">Plano {companyPlan.plan}</h3>
                    <p className="text-sm text-muted-foreground">
                      {companyPlan.currentUsers} de {companyPlan.userLimit === -1 ? "∞" : companyPlan.userLimit} colaboradores
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{getPlanLimitMessage()}</p>
                  {!canAddMore && (
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Limite atingido
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add New Collaborator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserPlus className="h-5 w-5" />
                  <span>Convidar Colaborador</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={onInvite} className="space-y-4">
                  <div>
                    <Label htmlFor="collaborator-name">Nome Completo</Label>
                    <Input
                      id="collaborator-name"
                      value={newCollaborator.name}
                      onChange={(e) => setNewCollaborator({ ...newCollaborator, name: e.target.value })}
                      placeholder="Ex: João Silva"
                      required
                      disabled={!canAddMore}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="collaborator-email">Email</Label>
                    <Input
                      id="collaborator-email"
                      type="email"
                      value={newCollaborator.email}
                      onChange={(e) => setNewCollaborator({ ...newCollaborator, email: e.target.value })}
                      placeholder="joao@empresa.com"
                      required
                      disabled={!canAddMore}
                    />
                  </div>

                  <div>
                    <Label htmlFor="collaborator-role">Função</Label>
                    <Select 
                      value={newCollaborator.role} 
                      onValueChange={(value) => setNewCollaborator({ ...newCollaborator, role: value })}
                      disabled={!canAddMore}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a função" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="colaborador">Colaborador</SelectItem>
                        <SelectItem value="administrador">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={!canAddMore}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar Convite
                  </Button>

                  {!canAddMore && (
                    <p className="text-sm text-orange-600 text-center">
                      Atualize seu plano para adicionar mais colaboradores
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Current Collaborators */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Colaboradores Atuais</span>
                  </div>
                  <Badge variant="secondary">
                    {collaborators.length} ativos
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {collaborators.map((collaborator, index) => (
                    <div key={collaborator.id}>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{collaborator.name}</h4>
                            <p className="text-xs text-muted-foreground">{collaborator.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                Desde {new Date(collaborator.joinedAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge className={getRoleColor(collaborator.role)}>
                            {collaborator.role}
                          </Badge>
                          <div>
                            <Badge 
                              variant={collaborator.status === "Ativo" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {collaborator.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {index < collaborators.length - 1 && <Separator className="my-2" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button variant="ghost" className="text-muted-foreground">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}