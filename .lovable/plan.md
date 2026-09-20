# Refinamento da landing Tukana AI — produto primeiro

## Objetivo
Reorganizar e compactar a landing existente para explicar a Tukana imediatamente, mantendo a identidade, os elementos visuais e toda a experiência GSAP/ScrollTrigger já implementada.

## Implementação
1. **Hero com proposta clara**
   - Manter “Tudo começa com um CNPJ.” e adicionar a explicação direta do produto e o CTA “Conhecer a Tukana”.
   - Fazer o CNPJ iniciar a transformação ainda no hero, conectando-o visualmente à demonstração seguinte.

2. **Demonstração principal unificada**
   - Unir as cenas atuais de inteligência, documentação e revisão em uma sequência principal compacta.
   - Mostrar a transformação contínua CNPJ → empresa/sócios/qualificações → informações da IA → documentação-base → documentos preenchidos → revisão → processo organizado.
   - Destacar as quatro mensagens de valor na ordem fornecida, com movimento real dos nós e documentos, não apenas aparição de texto.

3. **Narrativa reordenada e curta**
   - Após a demonstração, mostrar “E a operação continua organizada” com documentos, processos, prazos, assinaturas e etapas convergindo para um ambiente centralizado.
   - Em seguida apresentar custo manual, convergência “Menos…” → “Mais controle”, fluxo em três passos, impacto na equipe e públicos-alvo.
   - Reduzir distâncias de pin e espaços verticais, preservando scrub, reversibilidade e continuidade visual.

4. **Planos e encerramento**
   - Manter a seção de planos carregada dos dados reais, sem alterar nomes, preços, limites, funcionalidades, CTAs, cadastro, assinatura ou checkout.
   - Preservar o fechamento e o formulário atual de solicitação de demonstração.

## Detalhes técnicos
- Reaproveitar o componente e os seletores atuais, consolidando timelines e removendo somente cenas redundantes.
- Manter carregamento adiado do GSAP e dos planos, limpeza dos ScrollTriggers e suporte a `prefers-reduced-motion`.
- Adaptar deslocamentos e densidade para mobile sem tornar a página estática.

## Validação
- Verificar desktop e mobile, incluindo scroll para baixo e reverso.
- Confirmar que a proposta fica clara no primeiro bloco e que a demonstração completa aparece logo em seguida.
- Confirmar ausência de telas vazias, sobreposições e erros, além do funcionamento de login, planos e CTAs.
