# Landing Tukana AI — narrativa controlada pelo scroll

## Objetivo
Transformar a landing atual em uma experiência contínua de scrollytelling, preservando a identidade visual, a logo, o acesso, o contato e o fluxo de assinatura existentes. A copy exibida seguirá exatamente o texto fornecido.

## Implementação
1. **Base da experiência**
   - Adicionar GSAP e ScrollTrigger.
   - Manter o cabeçalho atual e a identidade navy com o espectro azul, verde, amarelo e laranja da Tukana.
   - Respeitar `prefers-reduced-motion`, oferecendo a mesma narrativa sem pin prolongado para quem reduz animações.

2. **Cenas controladas pelo scroll**
   - Criar sequências pinned com `scrub` para: CNPJ e inteligência; dados virando documentação; fluxo completo CNPJ → revisão; caos de M&A → organização; números de custo; transformação operacional; convergência em “Mais controle”; e Identifica → Preenche → Organiza.
   - Fazer os elementos mudarem posição, escala e profundidade de forma reversível ao voltar o scroll.
   - Conectar visualmente cenas consecutivas, reaproveitando linhas, nós, dados e folhas documentais na transição.

3. **Conteúdo e fluxos existentes**
   - Transformar a composição atual nas 13 cenas e usar exatamente a copy revisada do pedido.
   - Preservar os botões de login, contato e assinatura, incluindo cadastro e redirecionamento ao checkout.
   - Manter a seção de planos carregada integralmente do cadastro atual, sem alterar ou inventar nomes, preços, limites, funcionalidades ou CTAs.

4. **Responsividade e desempenho**
   - Desktop terá a composição completa em camadas.
   - Mobile manterá as transformações essenciais com menos elementos e trajetórias mais curtas, sem virar uma página estática.
   - Animar principalmente `transform` e `opacity`, limitar filtros e remover timelines corretamente ao desmontar a página.

5. **Validação**
   - Verificar a landing em desktop e mobile com rolagem para baixo e para cima.
   - Confirmar pelo menos três cenas pinned, números animados individualmente, transformação CNPJ → documentação e caos → organização.
   - Confirmar ausência de sobreposição, erros no console e regressões nos CTAs.
