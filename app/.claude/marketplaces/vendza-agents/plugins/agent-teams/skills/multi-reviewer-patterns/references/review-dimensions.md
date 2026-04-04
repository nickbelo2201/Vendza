# Revise as listas de verificação de dimensões

Listas de verificação detalhadas para cada dimensão de revisão que os revisores seguem durante a revisão paralela do código.

## Lista de verificação de revisão de segurança

### Tratamento de entrada

- [] Todas as entradas do usuário são validadas e higienizadas
- [] Consultas SQL usam instruções parametrizadas (sem concatenação de strings)
- [] A saída HTML tem escape adequado para evitar XSS
- [] Os caminhos dos arquivos são validados para evitar a passagem do caminho
- [] Os limites de tamanho da solicitação são aplicados

### Autenticação e Autorização

- [] A autenticação é necessária para todos os endpoints protegidos
- [] As verificações de autorização verificam se o usuário tem permissão para a ação
- [] Os tokens JWT são validados (assinatura, expiração, emissor)
- [] O hash de senha usa bcrypt/argon2 (não MD5/SHA)
- [] O gerenciamento de sessões segue as melhores práticas

### Segredos e configuração

- [] Sem segredos codificados, chaves de API ou senhas
- [] Os segredos são carregados de variáveis ​​de ambiente ou gerenciador de segredos
- [] .gitignore inclui padrões de arquivos confidenciais
- [] Os endpoints de depuração/desenvolvimento estão desabilitados na produção

### Dependências

- [] Nenhum CVE conhecido em dependências diretas
- [] As dependências são fixadas em versões específicas
- [] Sem dependências desnecessárias que aumentam a superfície de ataque

## Lista de verificação de avaliação de desempenho

### Banco de dados

- [] Sem padrões de consulta N+1
- [] As consultas usam índices apropriados
- [] Sem SELECT \* em tabelas grandes
- [] A paginação é implementada para terminais de lista
- [] O pool de conexões está configurado

### Memória e recursos

- [] Sem vazamentos de memória (ouvintes de eventos limpos, fluxos fechados)
- [] Grandes conjuntos de dados são transmitidos, não carregados inteiramente na memória
- [] Identificadores de arquivos e conexões estão devidamente fechados
- [] O cache é usado para operações caras

### Computação

- [] Sem recálculo desnecessário ou operações redundantes
- [] Complexidade de algoritmo apropriada para o tamanho dos dados
- [] Operações assíncronas usadas onde a E/S é vinculada
- [] Sem operações de bloqueio no thread principal

## Lista de verificação de revisão de arquitetura

### Princípios de Design

- [ ] Responsabilidade Única: cada módulo/classe tem um motivo para mudar
- [] Aberto/Fechado: extensível sem modificação
- [] Inversão de dependência: depende de abstrações, não de concreções
- [] Sem dependências circulares entre módulos

### Estrutura

- [] Separação clara de interesses (IU, lógica de negócios, dados)
- [] Estratégia consistente de tratamento de erros em toda a base de código
- [] A configuração é externalizada, não codificada
- [] Os contratos de API são bem definidos e versionados

### Padrões

- [] Padrões consistentes usados ​​(sem mistura de padrões)
- [] As abstrações estão no nível certo (não super/subprojetadas)
- [] Os limites do módulo se alinham com os limites do domínio
- [] Utilitários compartilhados são realmente compartilhados (sem duplicação)

## Lista de verificação de revisão de testes

### Cobertura

- [] Caminhos críticos têm cobertura de teste
- [] Casos extremos são testados (entrada vazia, nulo, valores limite)
- [] Os caminhos de erro são testados (o que acontece quando as coisas falham)
- [] Os pontos de integração possuem testes de integração

### Qualidade

- [] Os testes são determinísticos (sem testes instáveis)
- [] Os testes são isolados (sem estado compartilhado entre os testes)
- [] As afirmações são específicas (não apenas "nenhum erro gerado")
- [] Os nomes dos testes descrevem claramente o que está sendo testado

### Capacidade de manutenção

- [] Os testes não duplicam a lógica de implementação
- [] Simulações/stubs são mínimos e precisos
- [] Os dados do teste são claros e relevantes
- [] Os testes são fáceis de entender sem ler a implementação

## Lista de verificação de revisão de acessibilidade

### Estrutura

- [] Elementos HTML semânticos usados ​​(nav, main, article, button)
- [] A hierarquia de títulos é lógica (h1 -> h2 -> h3)
- [] Funções e propriedades ARIA usadas corretamente
- [] Pontos de referência identificam regiões da página

### Interação

- [] Todas as funcionalidades acessíveis via teclado
- [] A ordem do foco é lógica e visível
- [] Sem armadilhas de teclado
- [] Os alvos de toque têm pelo menos 44x44px

### Contente

- [] As imagens têm texto alternativo significativo
- [ ] A cor não é o único meio de transmitir informações
- [ ] O texto tem taxa de contraste suficiente (4,5:1 para normal, 3:1 para grande)
- [] O conteúdo pode ser lido com zoom de 200%
