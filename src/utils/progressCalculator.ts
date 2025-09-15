// Função para calcular porcentagem de progresso baseado no status
export const calculateProgressFromStatus = (status: string): number => {
  switch (status.toLowerCase()) {
    case 'pendente':
      return 10;
    case 'em análise':
      return 35;
    case 'em revisão':
      return 65;
    case 'aprovado':
      return 85;
    case 'finalizado':
    case 'concluído':
      return 100;
    default:
      return 0;
  }
};

// Função para calcular progresso médio de uma lista de documentos
export const calculateAverageProgress = (documents: Array<{ status: string }>): number => {
  if (documents.length === 0) return 0;
  
  const totalProgress = documents.reduce((sum, doc) => {
    return sum + calculateProgressFromStatus(doc.status);
  }, 0);
  
  return Math.round(totalProgress / documents.length);
};

// Função para calcular progresso de um processo baseado em seus documentos
export const calculateProcessProgress = (process: {
  status?: string;
  receivedDocuments?: Array<{ status: string }>;
  pendingDocuments?: Array<{ status: string }>;
}): number => {
  // Se o processo tem um status próprio, use ele
  if (process.status) {
    return calculateProgressFromStatus(process.status);
  }
  
  // Caso contrário, calcule baseado nos documentos
  const allDocuments = [
    ...(process.receivedDocuments || []),
    ...(process.pendingDocuments || [])
  ];
  
  return calculateAverageProgress(allDocuments);
};