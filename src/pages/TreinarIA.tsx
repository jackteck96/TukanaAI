import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Brain, 
  Plus, 
  Save,
  Trash2,
  Edit,
  FileText,
  AlertTriangle,
  CheckCircle,
  Target,
  BookOpen,
  Settings
} from "lucide-react";
import { Link } from "react-router-dom";

interface RegraIA {
  id: number;
  tipoProcesso: string;
  palavrasChave: string[];
  documentosObrigatorios: string[];
  documentosSugeridos: string[];
  condicoes: string;
  prioridade: number;
  ativa: boolean;
}

interface CasoTreinamento {
  id: number;
  tipoProcesso: string;
  descricao: string;
  documentosRecebidos: string[];
  documentosCorretos: string[];
  resultado: 'sucesso' | 'falha';
  feedback: string;
}

const TreinarIA = () => {
  const [showRegraModal, setShowRegraModal] = useState(false);
  const [showCasoModal, setShowCasoModal] = useState(false);
  const [editingRegra, setEditingRegra] = useState<RegraIA | null>(null);
  
  const [novaRegra, setNovaRegra] = useState({
    tipoProcesso: "",
    palavrasChave: "",
    documentosObrigatorios: [] as string[],
    documentosSugeridos: [] as string[],
    condicoes: "",
    prioridade: 1
  });

  const [novoCaso, setNovoCaso] = useState({
    tipoProcesso: "",
    descricao: "",
    documentosRecebidos: [] as string[],
    documentosCorretos: [] as string[],
    resultado: "sucesso" as 'sucesso' | 'falha',
    feedback: ""
  });

  const [regrasIA, setRegrasIA] = useState<RegraIA[]>([
    {
      id: 1,
      tipoProcesso: "Contrato de Prestação de Serviços",
      palavrasChave: ["contrato", "prestação", "serviços", "TI", "tecnologia"],
      documentosObrigatorios: ["RG", "CPF", "CNPJ"],
      documentosSugeridos: ["Procuração", "Contrato Social", "Inscrição Estadual"],
      condicoes: "Se empresa = TI, então solicitar certificações técnicas",
      prioridade: 1,
      ativa: true
    },
    {
      id: 2,
      tipoProcesso: "Documentação Fiscal",
      palavrasChave: ["fiscal", "imposto", "auditoria", "tributário"],
      documentosObrigatorios: ["CNPJ", "Inscrição Estadual"],
      documentosSugeridos: ["Alvará de Funcionamento", "Declaração de IR", "Balanço Patrimonial"],
      condicoes: "Se valor > R$ 100.000, então solicitar auditoria independente",
      prioridade: 2,
      ativa: true
    }
  ]);

  const [casosTreinamento, setCasosTreinamento] = useState<CasoTreinamento[]>([
    {
      id: 1,
      tipoProcesso: "Contrato de Prestação de Serviços",
      descricao: "Empresa de TI contratando serviços de consultoria",
      documentosRecebidos: ["RG", "CPF", "CNPJ"],
      documentosCorretos: ["RG", "CPF", "CNPJ", "Procuração", "Certificação Técnica"],
      resultado: "sucesso",
      feedback: "IA identificou corretamente a necessidade de certificação técnica"
    }
  ]);

  const documentosDisponiveis = [
    "RG - Registro Geral",
    "CPF - Cadastro de Pessoa Física", 
    "Comprovante de Residência",
    "CNPJ - Cadastro Nacional da Pessoa Jurídica",
    "Carteira de Trabalho",
    "Contrato Social", 
    "Inscrição Estadual", 
    "Alvará de Funcionamento",
    "Declaração de Imposto de Renda", 
    "Comprovante de Renda", 
    "Certidão de Nascimento",
    "Certidão de Casamento", 
    "Procuração", 
    "Contrato de Prestação de Serviços",
    "Certificação Técnica",
    "Balanço Patrimonial",
    "Demonstrativo Financeiro"
  ];

  const tiposProcesso = [
    "Contrato de Prestação de Serviços",
    "Documentação Fiscal",
    "Processo Trabalhista",
    "Abertura de Empresa",
    "Alteração Contratual",
    "Licenciamento",
    "Processo Civil",
    "Processo Criminal"
  ];

  const salvarRegra = () => {
    const regra: RegraIA = {
      id: editingRegra?.id || Date.now(),
      tipoProcesso: novaRegra.tipoProcesso,
      palavrasChave: novaRegra.palavrasChave.split(',').map(p => p.trim()),
      documentosObrigatorios: novaRegra.documentosObrigatorios,
      documentosSugeridos: novaRegra.documentosSugeridos,
      condicoes: novaRegra.condicoes,
      prioridade: novaRegra.prioridade,
      ativa: true
    };

    if (editingRegra) {
      setRegrasIA(regras => regras.map(r => r.id === editingRegra.id ? regra : r));
    } else {
      setRegrasIA(regras => [...regras, regra]);
    }

    setShowRegraModal(false);
    setEditingRegra(null);
    setNovaRegra({
      tipoProcesso: "",
      palavrasChave: "",
      documentosObrigatorios: [],
      documentosSugeridos: [],
      condicoes: "",
      prioridade: 1
    });
  };

  const salvarCaso = () => {
    const caso: CasoTreinamento = {
      id: Date.now(),
      ...novoCaso
    };

    setCasosTreinamento(casos => [...casos, caso]);
    setShowCasoModal(false);
    setNovoCaso({
      tipoProcesso: "",
      descricao: "",
      documentosRecebidos: [],
      documentosCorretos: [],
      resultado: "sucesso",
      feedback: ""
    });
  };

  const editarRegra = (regra: RegraIA) => {
    setEditingRegra(regra);
    setNovaRegra({
      tipoProcesso: regra.tipoProcesso,
      palavrasChave: regra.palavrasChave.join(', '),
      documentosObrigatorios: regra.documentosObrigatorios,
      documentosSugeridos: regra.documentosSugeridos,
      condicoes: regra.condicoes,
      prioridade: regra.prioridade
    });
    setShowRegraModal(true);
  };

  const toggleRegraAtiva = (id: number) => {
    setRegrasIA(regras => 
      regras.map(r => r.id === id ? { ...r, ativa: !r.ativa } : r)
    );
  };

  const removerRegra = (id: number) => {
    setRegrasIA(regras => regras.filter(r => r.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/empresa">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center">
                  <Brain className="h-6 w-6 mr-2 text-primary" />
                  Treinar IA dos Processos
                </h1>
                <p className="text-muted-foreground">Configure regras e ensine a IA com casos específicos</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        <Tabs defaultValue="regras" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="regras" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Regras da IA</span>
            </TabsTrigger>
            <TabsTrigger value="casos" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Casos de Treinamento</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Performance</span>
            </TabsTrigger>
          </TabsList>

          {/* Regras da IA */}
          <TabsContent value="regras" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Regras de Análise</h2>
              <Button onClick={() => setShowRegraModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Regra
              </Button>
            </div>

            <div className="grid gap-4">
              {regrasIA.map((regra) => (
                <Card key={regra.id} className={`${!regra.ativa ? 'opacity-50' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{regra.tipoProcesso}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant={regra.ativa ? "default" : "secondary"}>
                          {regra.ativa ? "Ativa" : "Inativa"}
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => editarRegra(regra)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toggleRegraAtiva(regra.id)}
                        >
                          {regra.ativa ? "Desativar" : "Ativar"}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => removerRegra(regra.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Palavras-chave:</h4>
                        <div className="flex flex-wrap gap-2">
                          {regra.palavrasChave.map((palavra, index) => (
                            <Badge key={index} variant="outline">{palavra}</Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Documentos Obrigatórios:</h4>
                          <ul className="text-sm text-muted-foreground">
                            {regra.documentosObrigatorios.map((doc, index) => (
                              <li key={index}>• {doc}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Documentos Sugeridos:</h4>
                          <ul className="text-sm text-muted-foreground">
                            {regra.documentosSugeridos.map((doc, index) => (
                              <li key={index}>• {doc}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      {regra.condicoes && (
                        <div>
                          <h4 className="font-medium mb-2">Condições Especiais:</h4>
                          <p className="text-sm text-muted-foreground">{regra.condicoes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Casos de Treinamento */}
          <TabsContent value="casos" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Casos de Treinamento</h2>
              <Button onClick={() => setShowCasoModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Caso
              </Button>
            </div>

            <div className="grid gap-4">
              {casosTreinamento.map((caso) => (
                <Card key={caso.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{caso.tipoProcesso}</CardTitle>
                      <Badge variant={caso.resultado === 'sucesso' ? "default" : "destructive"}>
                        {caso.resultado === 'sucesso' ? (
                          <CheckCircle className="h-4 w-4 mr-1" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 mr-1" />
                        )}
                        {caso.resultado === 'sucesso' ? 'Sucesso' : 'Falha'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm">{caso.descricao}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Documentos Recebidos:</h4>
                          <ul className="text-sm text-muted-foreground">
                            {caso.documentosRecebidos.map((doc, index) => (
                              <li key={index}>• {doc}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Documentos Corretos:</h4>
                          <ul className="text-sm text-muted-foreground">
                            {caso.documentosCorretos.map((doc, index) => (
                              <li key={index}>• {doc}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      {caso.feedback && (
                        <div>
                          <h4 className="font-medium mb-2">Feedback:</h4>
                          <p className="text-sm text-muted-foreground">{caso.feedback}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Performance */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-xl font-semibold">Performance da IA</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Taxa de Acerto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">87.5%</div>
                  <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Processos Analisados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">156</div>
                  <p className="text-xs text-muted-foreground">Este mês</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Documentos Identificados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">234</div>
                  <p className="text-xs text-muted-foreground">Documentos faltantes detectados</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal Nova Regra */}
      <Dialog open={showRegraModal} onOpenChange={setShowRegraModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRegra ? 'Editar Regra' : 'Nova Regra da IA'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="tipoProcesso">Tipo de Processo</Label>
              <Select 
                value={novaRegra.tipoProcesso} 
                onValueChange={(value) => setNovaRegra({...novaRegra, tipoProcesso: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de processo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposProcesso.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="palavrasChave">Palavras-chave (separadas por vírgula)</Label>
              <Input
                id="palavrasChave"
                value={novaRegra.palavrasChave}
                onChange={(e) => setNovaRegra({...novaRegra, palavrasChave: e.target.value})}
                placeholder="contrato, prestação, serviços"
              />
            </div>

            <div>
              <Label>Documentos Obrigatórios</Label>
              <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-1">
                {documentosDisponiveis.map((doc) => (
                  <div key={doc} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={novaRegra.documentosObrigatorios.includes(doc)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNovaRegra({
                            ...novaRegra,
                            documentosObrigatorios: [...novaRegra.documentosObrigatorios, doc]
                          });
                        } else {
                          setNovaRegra({
                            ...novaRegra,
                            documentosObrigatorios: novaRegra.documentosObrigatorios.filter(d => d !== doc)
                          });
                        }
                      }}
                    />
                    <label className="text-sm">{doc}</label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Documentos Sugeridos</Label>
              <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-1">
                {documentosDisponiveis.map((doc) => (
                  <div key={doc} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={novaRegra.documentosSugeridos.includes(doc)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNovaRegra({
                            ...novaRegra,
                            documentosSugeridos: [...novaRegra.documentosSugeridos, doc]
                          });
                        } else {
                          setNovaRegra({
                            ...novaRegra,
                            documentosSugeridos: novaRegra.documentosSugeridos.filter(d => d !== doc)
                          });
                        }
                      }}
                    />
                    <label className="text-sm">{doc}</label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="condicoes">Condições Especiais</Label>
              <Textarea
                id="condicoes"
                value={novaRegra.condicoes}
                onChange={(e) => setNovaRegra({...novaRegra, condicoes: e.target.value})}
                placeholder="Ex: Se valor > R$ 100.000, então solicitar auditoria"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowRegraModal(false)}>
                Cancelar
              </Button>
              <Button onClick={salvarRegra}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Regra
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Novo Caso */}
      <Dialog open={showCasoModal} onOpenChange={setShowCasoModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Caso de Treinamento</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="tipoProcessoCaso">Tipo de Processo</Label>
              <Select 
                value={novoCaso.tipoProcesso} 
                onValueChange={(value) => setNovoCaso({...novoCaso, tipoProcesso: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de processo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposProcesso.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="descricaoCaso">Descrição do Caso</Label>
              <Textarea
                id="descricaoCaso"
                value={novoCaso.descricao}
                onChange={(e) => setNovoCaso({...novoCaso, descricao: e.target.value})}
                placeholder="Descreva o caso específico..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="resultadoCaso">Resultado</Label>
              <Select 
                value={novoCaso.resultado} 
                onValueChange={(value: 'sucesso' | 'falha') => setNovoCaso({...novoCaso, resultado: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sucesso">Sucesso</SelectItem>
                  <SelectItem value="falha">Falha</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="feedbackCaso">Feedback</Label>
              <Textarea
                id="feedbackCaso"
                value={novoCaso.feedback}
                onChange={(e) => setNovoCaso({...novoCaso, feedback: e.target.value})}
                placeholder="Descreva o que a IA acertou ou errou..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCasoModal(false)}>
                Cancelar
              </Button>
              <Button onClick={salvarCaso}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Caso
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TreinarIA;