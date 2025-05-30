(function () {
  // Implementação da função xpath para substituir $x
  function xpath(expression, context = document) {
    const result = document.evaluate(
      expression,
      context,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );

    const nodes = [];
    for (let i = 0; i < result.snapshotLength; i++) {
      nodes.push(result.snapshotItem(i));
    }

    return nodes;
  }

  // Variável para controlar se a automação já foi executada na URL atual
  let lastExecutedUrl = '';
  let isExecuting = false;

  const commands = [
    // Comando 1: Clicar no botão de opções de exibição de colunas
    function () {
      const button = document.querySelector('button[aria-label="Column display options..."]');
      if (button) {
        button.click();
        return true;
      }
      return false;
    },

    // Comando 2: Clicar no item "Description"
    function () {
      const descriptionElement = xpath("//span[contains(@class, 'mdc-list-item__primary-text') and normalize-space(text())='Description']")[0];
      if (descriptionElement) {
        descriptionElement.click();
        return true;
      }
      return false;
    },

    // Comando 3: Clicar no item "Last Modified By"
    function () {
      const modifiedByElement = xpath("//span[contains(@class, 'mdc-list-item__primary-text') and normalize-space(text())='Last Modified By']")[0];
      if (modifiedByElement) {
        modifiedByElement.click();
        return true;
      }
      return false;
    },

    // Comando 4: Clicar no botão OK
    function () {
      const okButton = Array.from(document.querySelectorAll('span.mdc-button__label')).find(span => span.textContent.trim() === 'OK');
      if (okButton) {
        okButton.click();
        return true;
      }
      return false;
    }
  ];

  let currentCommandIndex = 0;
  let attemptCount = 0;
  const MAX_ATTEMPTS = 100;

  function executeNextCommand() {
    if (currentCommandIndex >= commands.length) {
      // console.log("Todos os comandos foram executados com sucesso!");
      isExecuting = false;
      return;
    }

    if (attemptCount >= MAX_ATTEMPTS) {
      // console.log(`Excedido número máximo de tentativas para o comando ${currentCommandIndex + 1}. Passando para o próximo.`);
      currentCommandIndex++;
      attemptCount = 0;
      setTimeout(executeNextCommand, 200);
      return;
    }

    try {
      const result = commands[currentCommandIndex]();
      if (result !== false) {
        // console.log(`Comando ${currentCommandIndex + 1} executado com sucesso!`);
        currentCommandIndex++;
        attemptCount = 0;
        setTimeout(executeNextCommand, 200); // Espera 200ms antes do próximo comando
      } else {
        attemptCount++;
        // console.log(`Tentativa ${attemptCount} para o comando ${currentCommandIndex + 1} falhou. Tentando novamente em 200ms...`);
        setTimeout(executeNextCommand, 200);
      }
    } catch (error) {
      attemptCount++;
      // console.log(`Erro ao executar o comando ${currentCommandIndex + 1}: ${error.message}. Tentativa ${attemptCount}. Tentando novamente em 200ms...`);
      setTimeout(executeNextCommand, 200);
    }
  }

  // Reseta o estado da execução
  function resetExecution() {
    currentCommandIndex = 0;
    attemptCount = 0;
    isExecuting = false;
  }

  // Inicia a execução quando a página estiver pronta
  function startExecution() {
    const currentUrl = window.location.href;
    
    // Verifica se já executou na URL atual
    if (lastExecutedUrl === currentUrl || isExecuting) {
      // console.log("Automação já executada ou em execução para esta URL");
      return;
    }
    
    // Verifica se estamos na página correta
    if (!currentUrl.includes('/integrations/list')) {
      return;
    }

    // console.log("Iniciando script de automação...");
    lastExecutedUrl = currentUrl;
    isExecuting = true;
    resetExecution();
    
    // Espera um pouco para garantir que a página carregou completamente
    setTimeout(executeNextCommand, 1000);
  }

  // Função para verificar se a página está pronta
  function checkPageReady() {
    const currentUrl = window.location.href;
    
    // Só executa se estivermos na página de integrações
    if (!currentUrl.includes('/integrations/list')) {
      return false;
    }
    
    // Verifica se o botão necessário está presente
    if (document.querySelector('button[aria-label="Column display options..."]')) {
      // console.log("Página de integrations detectada, iniciando automação...");
      startExecution();
      return true;
    }
    
    return false;
  }

  // Observa mudanças na URL (para SPAs)
  let currentUrl = window.location.href;
  function observeUrlChanges() {
    const newUrl = window.location.href;
    if (newUrl !== currentUrl) {
      // console.log("URL mudou de", currentUrl, "para", newUrl);
      currentUrl = newUrl;
      
      // Reseta o controle se mudou de URL
      if (!newUrl.includes('/integrations/list')) {
        lastExecutedUrl = '';
      }
      
      // Verifica a página após mudança de URL
      setTimeout(checkPageReady, 1000);
    }
  }

  // Usa MutationObserver para detectar mudanças no DOM (SPAs)
  const observer = new MutationObserver(function(mutations) {
    // Verifica mudanças de URL
    observeUrlChanges();
    
    // Verifica se chegamos na página de integrações
    if (window.location.href.includes('/integrations/list')) {
      setTimeout(checkPageReady, 500);
    }
  });

  // Inicia o observer
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Verifica periodicamente mudanças de URL (backup)
  setInterval(observeUrlChanges, 1000);

  // Execução inicial
  setTimeout(checkPageReady, 1000);

  // Backup: se a verificação acima falhar, tenta iniciar após um tempo fixo
  setTimeout(function () {
    if (!isExecuting && window.location.href.includes('/integrations/list')) {
      startExecution();
    }
  }, 10000);
})();
