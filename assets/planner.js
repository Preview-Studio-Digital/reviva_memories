// assets/planner.js — Lógica Perpétua, Edição Direta e Assistente de Ajuste In-Card com Iasis (Gemini API)

document.addEventListener('DOMContentLoaded', () => {
  // Configuração da API do Iasis (Gemini) — Idêntica ao painel.js
  const GEMINI_API_KEY = window.ENV_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || (typeof atob !== 'undefined' ? atob('QVEuQWI4Uk42TFBBTFZRMmNXZ0dvVUFGVTBvaHpjcUZ5RmlyVDFMaHFqSHVXdHN0U0dMU3c=') : '');
  const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3.5-flash', 'gemini-flash-latest'];

  // Estado da Aplicação (Perpétuo)
  const state = {
    currentView: 'today', // 'today' | 'calendar' | 'timeline' (Datas Comemorativas)
    currentPautaIndex: 0,
    activeFilter: 'all', // 'all' | 'cotidiano' | 'familia' | 'psicologia' | 'estudio' | 'trafego'
    startDate: getStoredStartDate(),
    completedTasks: getStoredCompletedTasks(),
    subtasks: getStoredSubtasks(),
    customContent: getStoredCustomContent(),
    selectedTask: null
  };

  const data = window.PLANNER_DATA || { themes: [], categories: {}, specialDates: [], tasks: [] };

  // Elementos do DOM
  const dom = {
    viewTabs: document.querySelectorAll('.view-tab'),
    viewSections: {
      today: document.getElementById('view-today'),
      calendar: document.getElementById('view-calendar'),
      timeline: document.getElementById('view-timeline')
    },
    filterBtns: document.querySelectorAll('.filter-btn'),
    todayContainer: document.getElementById('today-task-card'),
    calendarGrid: document.getElementById('calendar-grid'),
    timelineContainer: document.getElementById('timeline-phases'),
    drawer: document.getElementById('task-drawer'),
    drawerOverlay: document.getElementById('drawer-overlay'),
    drawerClose: document.getElementById('drawer-close'),
    drawerContent: document.getElementById('drawer-body'),
    btnResetStorage: document.getElementById('btn-reset-storage'),
    toast: document.getElementById('app-toast')
  };

  // Inicialização
  init();

  function init() {
    setupEventListeners();
    renderView();
  }

  function triggerLucide() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  // ================= PERSISTÊNCIA LOCAL =================
  function getStoredCompletedTasks() {
    try {
      const saved = localStorage.getItem('reviva_planner_completed');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  }

  function saveCompletedTasks() {
    try {
      localStorage.setItem('reviva_planner_completed', JSON.stringify(state.completedTasks));
    } catch (e) {}
  }

  function getStoredSubtasks() {
    try {
      const saved = localStorage.getItem('reviva_planner_subtasks');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  }

  function saveSubtasks() {
    try {
      localStorage.setItem('reviva_planner_subtasks', JSON.stringify(state.subtasks || {}));
    } catch (e) {}
  }

  function getStoredCustomContent() {
    try {
      const saved = localStorage.getItem('reviva_planner_custom_content');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  }

  function saveCustomContentToStorage() {
    try {
      localStorage.setItem('reviva_planner_custom_content', JSON.stringify(state.customContent || {}));
    } catch (e) {}
  }

  function getActiveContent(task) {
    if (!task) return { script: '', caption: '', isCustomScript: false, isCustomCaption: false };
    const saved = (state.customContent && state.customContent[task.id]) || {};
    return {
      script: typeof saved.script === 'string' ? saved.script : task.script,
      caption: typeof saved.caption === 'string' ? saved.caption : task.caption,
      isCustomScript: typeof saved.script === 'string',
      isCustomCaption: typeof saved.caption === 'string'
    };
  }

  function saveTaskFieldCustom(taskId, field, value) {
    if (!state.customContent) state.customContent = {};
    if (!state.customContent[taskId]) state.customContent[taskId] = {};
    state.customContent[taskId][field] = value;
    saveCustomContentToStorage();
  }

  function resetTaskFieldCustom(taskId, field) {
    if (state.customContent && state.customContent[taskId]) {
      delete state.customContent[taskId][field];
      if (Object.keys(state.customContent[taskId]).length === 0) {
        delete state.customContent[taskId];
      }
      saveCustomContentToStorage();
    }
  }

  function getStoredStartDate() {
    try {
      const saved = localStorage.getItem('reviva_planner_start_date');
      if (saved) return new Date(saved);
    } catch (e) {}
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  function getTaskCalculatedDate(offsetIndex) {
    const base = new Date(state.startDate);
    base.setDate(base.getDate() + offsetIndex);
    return base;
  }

  function formatDateHuman(date) {
    const options = { weekday: 'long', day: '2-digit', month: 'long' };
    return date.toLocaleDateString('pt-BR', options);
  }

  function getWordCount(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  function estimateSpeechDuration(wordsCount) {
    const seconds = Math.round((wordsCount / 125) * 60);
    return seconds > 0 ? `~${seconds}s` : '0s';
  }

  // ================= EVENT LISTENERS =================
  function setupEventListeners() {
    dom.viewTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        dom.viewTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.currentView = tab.dataset.view;
        renderView();
      });
    });

    dom.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        dom.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeFilter = btn.dataset.filter;
        renderView();
      });
    });

    if (dom.drawerClose) dom.drawerClose.addEventListener('click', closeDrawer);
    if (dom.drawerOverlay) dom.drawerOverlay.addEventListener('click', closeDrawer);

    if (dom.btnResetStorage) {
      dom.btnResetStorage.addEventListener('click', () => {
        if (confirm('Deseja reiniciar todas as pautas marcadas como gravadas?')) {
          state.completedTasks = {};
          saveCompletedTasks();
          renderView();
          showToast('Progresso reiniciado com sucesso.');
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDrawer();
      if (state.currentView === 'today') {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
        if (e.key === 'ArrowLeft' && state.currentPautaIndex > 0) {
          state.currentPautaIndex--;
          renderTodayView();
          triggerLucide();
        } else if (e.key === 'ArrowRight' && state.currentPautaIndex < (data.tasks.length - 1)) {
          state.currentPautaIndex++;
          renderTodayView();
          triggerLucide();
        }
      }
    });
  }

  function toggleTaskCompletion(taskId) {
    state.completedTasks[taskId] = !state.completedTasks[taskId];
    saveCompletedTasks();

    const isDone = state.completedTasks[taskId];
    showToast(isDone ? 'Pauta gravada e concluída! 🎬' : 'Pauta marcada como pendente.');

    const drawerToggleBtn = document.getElementById('drawer-toggle-btn');
    if (drawerToggleBtn) {
      drawerToggleBtn.className = `btn-gold-action ${isDone ? 'done' : ''}`;
      drawerToggleBtn.innerHTML = isDone 
        ? '<i data-lucide="check" style="width: 15px; height: 15px;"></i> Gravada ✓ (Clique para reabrir)' 
        : '<i data-lucide="check" style="width: 15px; height: 15px;"></i> Marcar como Gravada';
      triggerLucide();
    }

    renderView();
  }

  // ================= RENDERIZAÇÃO GERAL =================
  function renderView() {
    const mainEl = document.querySelector('main.planner-main');
    Object.keys(dom.viewSections).forEach(key => {
      if (dom.viewSections[key]) {
        dom.viewSections[key].style.display = key === state.currentView ? (key === 'today' ? 'flex' : 'block') : 'none';
      }
    });

    if (mainEl) {
      if (state.currentView === 'today') {
        mainEl.classList.remove('view-scrollable');
      } else {
        mainEl.classList.add('view-scrollable');
      }
    }

    if (state.currentView === 'today') {
      renderTodayView();
    } else if (state.currentView === 'calendar') {
      renderCalendarView();
    } else if (state.currentView === 'timeline') {
      renderSpecialDatesView();
    }

    triggerLucide();
  }

  // ================= 1. MODO HOJE (PAUTA DO DIA SEM ROLAGEM) =================
  function renderTodayView() {
    if (!dom.todayContainer) return;

    if (state.currentPautaIndex >= data.tasks.length) {
      state.currentPautaIndex = 0;
    }
    const primaryTask = data.tasks[state.currentPautaIndex] || data.tasks[0];

    if (!primaryTask) {
      dom.todayContainer.innerHTML = '<div class="empty-state">Nenhuma pauta cadastrada.</div>';
      return;
    }

    const taskDate = getTaskCalculatedDate(state.currentPautaIndex);
    const cat = data.categories[primaryTask.category] || { label: primaryTask.category, color: '#e5c378', icon: '📌' };
    const isCompleted = !!state.completedTasks[primaryTask.id];
    const activeContent = getActiveContent(primaryTask);

    // Checklist local
    const savedSubtasks = state.subtasks || {};
    const taskSubtasks = savedSubtasks[primaryTask.id] || {};

    const checklistHtml = (primaryTask.checklist || []).map((item, idx) => {
      const isChecked = !!taskSubtasks[idx];
      return `
        <li class="today-checklist-item ${isChecked ? 'done' : ''}">
          <input type="checkbox" id="subtask-${primaryTask.id}-${idx}" data-task-id="${primaryTask.id}" data-idx="${idx}" ${isChecked ? 'checked' : ''}>
          <label for="subtask-${primaryTask.id}-${idx}">${escapeForHtml(item)}</label>
        </li>
      `;
    }).join('');

    // Opções do Jumper (Pautas Contínuas)
    const pautaOptionsHtml = data.tasks.map((t, idx) => {
      const isDone = !!state.completedTasks[t.id];
      const titleSnippet = t.title.length > 28 ? t.title.slice(0, 26) + '...' : t.title;
      return `<option value="${idx}" ${idx === state.currentPautaIndex ? 'selected' : ''}>${isDone ? '✓ ' : ''}Pauta ${idx + 1}: ${titleSnippet}</option>`;
    }).join('');

    const scriptWords = getWordCount(activeContent.script);
    const scriptDuration = estimateSpeechDuration(scriptWords);

    dom.todayContainer.innerHTML = `
      <!-- BARRA DE NAVEGAÇÃO ENTRE PAUTAS -->
      <div class="today-header-nav">
        <div class="today-nav-left">
          <button class="btn-dashboard-header" id="btn-prev-day" ${state.currentPautaIndex <= 0 ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''} title="Pauta anterior (Atalho: Seta Esquerda)">
            <i data-lucide="chevron-left" style="width: 13px; height: 13px;"></i> <span>Anterior</span>
          </button>
          <select id="select-day-jump" class="day-jump-select" title="Pular diretamente para a pauta desejada">
            ${pautaOptionsHtml}
          </select>
        </div>

        <div class="day-indicator-center">
          <span class="day-badge" style="color: var(--gold-bright);">PAUTA ${state.currentPautaIndex + 1}</span>
          <span style="color: rgba(197, 160, 89, 0.35);">|</span>
          <span class="date-human">${formatDateHuman(taskDate)}</span>
        </div>

        <div class="today-nav-right">
          <span class="today-status-pill ${isCompleted ? 'done' : 'pending'}">
            <i data-lucide="${isCompleted ? 'check-check' : 'clock'}" style="width: 12px; height: 12px;"></i>
            <span>${isCompleted ? 'Gravada' : 'Pendente'}</span>
          </span>
          <button class="btn-dashboard-header" id="btn-next-day" ${state.currentPautaIndex >= (data.tasks.length - 1) ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''} title="Próxima pauta (Atalho: Seta Direita)">
            <span>Próxima</span> <i data-lucide="chevron-right" style="width: 13px; height: 13px;"></i>
          </button>
        </div>
      </div>

      <!-- COCKPIT SPLIT EM TELA CHEIA (SEM ROLAGEM DE PÁGINA) -->
      <div class="today-split-grid">
        
        <!-- COLUNA 1: ESTRATÉGIA, INFORMAÇÃO E AÇÕES -->
        <div class="today-strategy-col ${isCompleted ? 'is-completed' : ''}">
          <div class="today-strategy-body">
            
            <div class="today-top-meta">
              <span class="category-pill" style="border: 1px solid var(--border-gold); background: rgba(197, 160, 89, 0.12); color: var(--gold-bright);">
                ${cat.icon} ${cat.label}
              </span>
              <div class="time-box">
                <i data-lucide="clock" style="width: 12px; height: 12px; color: var(--gold-bright);"></i>
                <strong>${primaryTask.recommendedTime}</strong>
              </div>
            </div>

            <h2 class="today-title">${primaryTask.title}</h2>
            <p class="today-summary">${primaryTask.summary}</p>

            <div class="quick-info-grid">
              <div class="info-card" title="Cenário de gravação do Iasis">
                <span class="info-label">Cenário</span>
                <span class="info-value">${primaryTask.scenario || 'Cafeteria'}</span>
              </div>
              <div class="info-card" title="Formato único de gravação">
                <span class="info-label">Formato</span>
                <span class="info-value">${primaryTask.format}</span>
              </div>
              <div class="info-card" title="Duração estimada">
                <span class="info-label">Duração Alvo</span>
                <span class="info-value">${primaryTask.duration}</span>
              </div>
              <div class="info-card" title="Distribuição simultânea">
                <span class="info-label">Canais (4 Redes)</span>
                <span class="info-value">Reels • TikTok • Shorts</span>
              </div>
            </div>

            <div class="today-checklist-box">
              <div class="today-checklist-title">
                <i data-lucide="list-checks" style="width: 12px; height: 12px; color: var(--gold-primary);"></i>
                <span>Checklist de Gravação & Publicação</span>
              </div>
              <ul class="today-checklist-list">
                ${checklistHtml}
              </ul>
            </div>

          </div>

          <div class="today-actions-bar">
            <button class="btn-gold-action ${isCompleted ? 'done' : ''}" id="btn-toggle-today-done">
              <i data-lucide="${isCompleted ? 'check-check' : 'check-circle-2'}" style="width: 15px; height: 15px;"></i>
              <span>${isCompleted ? 'Pauta Gravada ✓ (Clique para reabrir)' : 'Marcar Pauta como Gravada'}</span>
            </button>
          </div>
        </div>

        <!-- COLUNA 2: CONTEÚDO EDITÁVEL & CAMPO DE AJUSTE DIRETO COM IASIS -->
        <div class="today-content-col">
          
          <!-- PAINEL A: ROTEIRO DE FALA -->
          <div class="today-panel-card">
            <div class="panel-card-header">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span class="panel-card-title">
                  <i data-lucide="mic" style="width: 13px; height: 13px; color: var(--gold-primary);"></i>
                  <span>Roteiro de Fala</span>
                </span>
                ${activeContent.isCustomScript ? '<span class="badge-custom-pill" title="Roteiro personalizado e salvo localmente">✍️ Editado</span>' : ''}
              </div>
              
              <div class="panel-header-actions">
                <button class="btn-save-gold" id="btn-save-script" title="Salvar alterações manuais feitas no roteiro">
                  <i data-lucide="save" style="width: 11px; height: 11px;"></i> <span>Salvar</span>
                </button>
                ${activeContent.isCustomScript ? `
                  <button class="btn-restore-gold" id="btn-restore-script" title="Restaurar roteiro original padrão">
                    <i data-lucide="rotate-ccw" style="width: 10px; height: 10px;"></i>
                  </button>
                ` : ''}
                <button class="btn-copy-gold" id="btn-copy-script" title="Copiar roteiro para a área de transferência">
                  <i data-lucide="copy" style="width: 11px; height: 11px;"></i> <span>Copiar</span>
                </button>
              </div>
            </div>

            <div class="panel-editor-box">
              <textarea class="panel-editor-textarea" id="script-editor" placeholder="Digite ou ajuste as palavras do roteiro aqui..." spellcheck="false">${escapeForHtml(activeContent.script)}</textarea>
              <div class="panel-stats-bar">
                <span id="script-stats-counter">${scriptWords} palavras • ${scriptDuration} de fala</span>
                <span>Ritmo ideal: 45–60s</span>
              </div>
            </div>

            <!-- CAMPO DE AJUSTE DIRETO COM IASIS (NA BASE DO CARD) -->
            <div class="card-prompt-bar">
              <img src="iasis_avatar.jpg" alt="Iasis" class="card-prompt-avatar" title="Iasis IA">
              <input type="text" class="card-prompt-input" id="script-prompt-input" placeholder="Peça alterações ao Iasis no roteiro... (ex: encurte para 45s, mencione meu pai...)">
              <button type="button" class="card-prompt-btn" id="script-prompt-btn">
                <i data-lucide="sparkles" style="width: 11px; height: 11px;"></i>
                <span>Ajustar</span>
              </button>
            </div>
          </div>

          <!-- PAINEL B: LEGENDA PRONTA & HASHTAGS -->
          <div class="today-panel-card">
            <div class="panel-card-header">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span class="panel-card-title">
                  <i data-lucide="file-text" style="width: 13px; height: 13px; color: var(--gold-primary);"></i>
                  <span>Legenda Pronta</span>
                </span>
                ${activeContent.isCustomCaption ? '<span class="badge-custom-pill" title="Legenda personalizada e salva localmente">✍️ Editada</span>' : ''}
              </div>

              <div class="panel-header-actions">
                <button class="btn-save-gold" id="btn-save-caption" title="Salvar alterações manuais feitas na legenda">
                  <i data-lucide="save" style="width: 11px; height: 11px;"></i> <span>Salvar</span>
                </button>
                ${activeContent.isCustomCaption ? `
                  <button class="btn-restore-gold" id="btn-restore-caption" title="Restaurar legenda original padrão">
                    <i data-lucide="rotate-ccw" style="width: 10px; height: 10px;"></i>
                  </button>
                ` : ''}
                <button class="btn-copy-gold" id="btn-copy-caption" title="Copiar legenda completa com hashtags">
                  <i data-lucide="copy" style="width: 11px; height: 11px;"></i> <span>Copiar</span>
                </button>
              </div>
            </div>

            <div class="panel-editor-box">
              <textarea class="panel-editor-textarea" id="caption-editor" placeholder="Digite ou ajuste a legenda do post aqui..." spellcheck="false">${escapeForHtml(activeContent.caption)}</textarea>
              
              <div class="hashtags-block">
                <div class="hashtags-block-title">
                  <span>Hashtags do Post</span>
                  <button class="btn-copy-gold" id="btn-copy-hashtags" style="padding: 1px 6px; font-size: 0.64rem;">Copiar Tags</button>
                </div>
                <span class="hashtags-text">${primaryTask.hashtags}</span>
              </div>
            </div>

            <!-- CAMPO DE AJUSTE DIRETO COM IASIS (NA BASE DO CARD) -->
            <div class="card-prompt-bar">
              <img src="iasis_avatar.jpg" alt="Iasis" class="card-prompt-avatar" title="Iasis IA">
              <input type="text" class="card-prompt-input" id="caption-prompt-input" placeholder="Peça alterações na legenda... (ex: faça uma pergunta emotiva, use tom carinhoso...)">
              <button type="button" class="card-prompt-btn" id="caption-prompt-btn">
                <i data-lucide="sparkles" style="width: 11px; height: 11px;"></i>
                <span>Ajustar</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    `;

    wireTodayEvents(primaryTask);
  }

  function wireTodayEvents(primaryTask) {
    const btnPrev = document.getElementById('btn-prev-day');
    const btnNext = document.getElementById('btn-next-day');
    const selectDayJump = document.getElementById('select-day-jump');
    const btnToggleDone = document.getElementById('btn-toggle-today-done');
    const scriptEditor = document.getElementById('script-editor');
    const captionEditor = document.getElementById('caption-editor');
    const scriptStatsCounter = document.getElementById('script-stats-counter');

    // Botões de ação Roteiro
    const btnSaveScript = document.getElementById('btn-save-script');
    const btnRestoreScript = document.getElementById('btn-restore-script');
    const btnCopyScript = document.getElementById('btn-copy-script');
    const scriptPromptInput = document.getElementById('script-prompt-input');
    const scriptPromptBtn = document.getElementById('script-prompt-btn');

    // Botões de ação Legenda
    const btnSaveCaption = document.getElementById('btn-save-caption');
    const btnRestoreCaption = document.getElementById('btn-restore-caption');
    const btnCopyCaption = document.getElementById('btn-copy-caption');
    const btnCopyHashtags = document.getElementById('btn-copy-hashtags');
    const captionPromptInput = document.getElementById('caption-prompt-input');
    const captionPromptBtn = document.getElementById('caption-prompt-btn');

    // Contador dinâmico de palavras no Roteiro
    if (scriptEditor && scriptStatsCounter) {
      scriptEditor.addEventListener('input', () => {
        const words = getWordCount(scriptEditor.value);
        const duration = estimateSpeechDuration(words);
        scriptStatsCounter.textContent = `${words} palavras • ${duration} de fala`;
      });
    }

    // Salvar Roteiro Manual
    if (btnSaveScript && scriptEditor) {
      btnSaveScript.addEventListener('click', () => {
        saveTaskFieldCustom(primaryTask.id, 'script', scriptEditor.value);
        showToast('Roteiro salvo com sucesso! 💾');
        renderTodayView();
        triggerLucide();
      });
    }

    // Restaurar Roteiro Original
    if (btnRestoreScript) {
      btnRestoreScript.addEventListener('click', () => {
        if (confirm('Deseja restaurar o roteiro original sugerido?')) {
          resetTaskFieldCustom(primaryTask.id, 'script');
          showToast('Roteiro original restaurado.');
          renderTodayView();
          triggerLucide();
        }
      });
    }

    // Copiar Roteiro
    if (btnCopyScript && scriptEditor) {
      btnCopyScript.addEventListener('click', () => {
        window.copyText(scriptEditor.value);
      });
    }

    // Executar ajuste de Roteiro in-card via Iasis
    async function handleScriptInCardAdjustment() {
      const instruction = scriptPromptInput ? scriptPromptInput.value.trim() : '';
      if (!instruction) {
        if (scriptPromptInput) scriptPromptInput.focus();
        return;
      }

      if (scriptPromptBtn) {
        scriptPromptBtn.classList.add('loading');
        scriptPromptBtn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width:11px;height:11px;"></i> <span>Ajustando...</span>';
        triggerLucide();
      }

      const generated = await callIasisAiApi('script', primaryTask, scriptEditor.value, instruction);

      if (scriptPromptBtn) {
        scriptPromptBtn.classList.remove('loading');
        scriptPromptBtn.innerHTML = '<i data-lucide="sparkles" style="width:11px;height:11px;"></i> <span>Ajustar</span>';
        triggerLucide();
      }

      if (generated) {
        scriptEditor.value = generated;
        saveTaskFieldCustom(primaryTask.id, 'script', generated);
        const words = getWordCount(generated);
        const duration = estimateSpeechDuration(words);
        if (scriptStatsCounter) scriptStatsCounter.textContent = `${words} palavras • ${duration} de fala`;
        if (scriptPromptInput) scriptPromptInput.value = '';
        showToast('Roteiro ajustado pelo Iasis! ✨');
        renderTodayView();
        triggerLucide();
      } else {
        showToast('Não foi possível conectar com o Iasis. Tente novamente.');
      }
    }

    if (scriptPromptBtn) {
      scriptPromptBtn.addEventListener('click', handleScriptInCardAdjustment);
    }
    if (scriptPromptInput) {
      scriptPromptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleScriptInCardAdjustment();
        }
      });
    }

    // Salvar Legenda Manual
    if (btnSaveCaption && captionEditor) {
      btnSaveCaption.addEventListener('click', () => {
        saveTaskFieldCustom(primaryTask.id, 'caption', captionEditor.value);
        showToast('Legenda salva com sucesso! 💾');
        renderTodayView();
        triggerLucide();
      });
    }

    // Restaurar Legenda Original
    if (btnRestoreCaption) {
      btnRestoreCaption.addEventListener('click', () => {
        if (confirm('Deseja restaurar a legenda original sugerida?')) {
          resetTaskFieldCustom(primaryTask.id, 'caption');
          showToast('Legenda original restaurada.');
          renderTodayView();
          triggerLucide();
        }
      });
    }

    // Copiar Legenda Completa
    if (btnCopyCaption && captionEditor) {
      btnCopyCaption.addEventListener('click', () => {
        window.copyText(captionEditor.value + '\n\n' + primaryTask.hashtags);
      });
    }

    // Copiar Apenas Hashtags
    if (btnCopyHashtags) {
      btnCopyHashtags.addEventListener('click', () => {
        window.copyText(primaryTask.hashtags);
      });
    }

    // Executar ajuste de Legenda in-card via Iasis
    async function handleCaptionInCardAdjustment() {
      const instruction = captionPromptInput ? captionPromptInput.value.trim() : '';
      if (!instruction) {
        if (captionPromptInput) captionPromptInput.focus();
        return;
      }

      if (captionPromptBtn) {
        captionPromptBtn.classList.add('loading');
        captionPromptBtn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width:11px;height:11px;"></i> <span>Ajustando...</span>';
        triggerLucide();
      }

      const generated = await callIasisAiApi('caption', primaryTask, captionEditor.value, instruction);

      if (captionPromptBtn) {
        captionPromptBtn.classList.remove('loading');
        captionPromptBtn.innerHTML = '<i data-lucide="sparkles" style="width:11px;height:11px;"></i> <span>Ajustar</span>';
        triggerLucide();
      }

      if (generated) {
        captionEditor.value = generated;
        saveTaskFieldCustom(primaryTask.id, 'caption', generated);
        if (captionPromptInput) captionPromptInput.value = '';
        showToast('Legenda ajustada pelo Iasis! ✨');
        renderTodayView();
        triggerLucide();
      } else {
        showToast('Não foi possível conectar com o Iasis. Tente novamente.');
      }
    }

    if (captionPromptBtn) {
      captionPromptBtn.addEventListener('click', handleCaptionInCardAdjustment);
    }
    if (captionPromptInput) {
      captionPromptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleCaptionInCardAdjustment();
        }
      });
    }

    // Navegação entre pautas
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (state.currentPautaIndex > 0) {
          state.currentPautaIndex--;
          renderTodayView();
          triggerLucide();
        }
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (state.currentPautaIndex < (data.tasks.length - 1)) {
          state.currentPautaIndex++;
          renderTodayView();
          triggerLucide();
        }
      });
    }

    if (selectDayJump) {
      selectDayJump.addEventListener('change', (e) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val) && val >= 0 && val < data.tasks.length) {
          state.currentPautaIndex = val;
          renderTodayView();
          triggerLucide();
        }
      });
    }

    if (btnToggleDone) {
      btnToggleDone.addEventListener('click', () => {
        toggleTaskCompletion(primaryTask.id);
      });
    }

    // Subtarefas checkboxes
    const subtaskInputs = document.querySelectorAll('.today-checklist-item input[type="checkbox"]');
    subtaskInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const taskId = e.target.dataset.taskId;
        const idx = e.target.dataset.idx;
        if (!state.subtasks) state.subtasks = {};
        if (!state.subtasks[taskId]) state.subtasks[taskId] = {};
        state.subtasks[taskId][idx] = e.target.checked;
        saveSubtasks();
        const parentLi = e.target.closest('.today-checklist-item');
        if (parentLi) {
          if (e.target.checked) parentLi.classList.add('done');
          else parentLi.classList.remove('done');
        }
      });
    });
  }

  // ================= 2. INTEGRAÇÃO REAL COM A API DO IASIS (GEMINI) =================
  function getIasisSystemPrompt(targetType, task) {
    return `
Você é o Iasis, o influencer virtual humanista e roteirista oficial da Reviva Memories.
Você é um homem maduro (45 a 50 anos), com cabelos grisalhos impecáveis, olhar azul sereno, fala aveludada, pausada e reflexiva. Veste camisa de linho claro e aborda temas da vida com empatia, respeito e profundidade.

SEU OBJETIVO AGORA:
Você está lapidando o ${targetType === 'script' ? 'ROTEIRO DE FALA EM VÍDEO VERTICAL (9:16)' : 'TEXTO DE LEGENDA DO POST'} para a pauta: "${task.title}".
Cenário Oficial de Gravação: ${task.scenario || 'Cafeteria Urbana'}.
Canal: Distribuição simultânea em Reels, TikTok, YouTube Shorts e Facebook.

DIRETRIZES E REGRAS INEGOCIÁVEIS:
1. FORMATO E DURAÇÃO (SE FOR ROTEIRO):
   - Deve ser gravado em formato vertical (9:16).
   - Duração rigorosa entre 45 e 60 segundos (~100 a 140 palavras no total).
   - Inicie sempre com uma indicação sutil de cenário entre colchetes (ex: [Cenário: Cafeteria...]).
   - Os primeiros 3 segundos devem conter um gancho magnético provocativo ou acolhedor que pare o scroll do feed.
   - Linguagem falada natural, com pausas reflexivas (...).

2. FORMATO (SE FOR LEGENDA):
   - Texto pronto para postar, com quebras de parágrafo limpas e emojis sóbrios e elegantes.
   - Termine com uma pergunta acolhedora e reflexiva que incentive os seguidores a comentar lembranças da sua família.

3. VOCABULÁRIO & ÉTICA:
   - VOCABULÁRIO OBRIGATÓRIO: Refira-se sempre a Produção, Estúdio ou Reviva Memories.
   - PROIBIDO usar termos excessivamente infantis ou melosos ("que gracinha", "fofo", "meu bem", "docinho").
   - Mantenha a elegância de um amigo sábio que entende de psicologia do afeto, do tempo e das relações humanas.

4. ENTREGA:
   - Entregue DIRETAMENTE o texto lapidado final pronto para ser copiado ou aplicado.
   - NÃO inclua preâmbulos como "Aqui está sua sugestão" ou "Com certeza, vou ajustar". Comece direto pelo conteúdo lapidado.`;
  }

  async function callIasisAiApi(targetType, task, originalText, instruction) {
    const systemPrompt = getIasisSystemPrompt(targetType, task);
    const userPrompt = `
TEXTO ATUAL (${targetType === 'script' ? 'Roteiro de Fala' : 'Legenda'}):
"""
${originalText}
"""

INSTRUÇÃO DE AJUSTE DO USUÁRIO:
${instruction}

Por favor, reescreva e lapide o texto acima seguindo a sua persona de influencer humanista do cotidiano, respeitando o limite de 45 a 60 segundos (~100-140 palavras se for roteiro) e as diretrizes éticas da Reviva Memories.`;

    const contents = [{ role: 'user', parts: [{ text: userPrompt }] }];

    for (const model of GEMINI_MODELS) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: contents,
            systemInstruction: { parts: [{ text: systemPrompt }] }
          })
        });

        if (!response.ok) {
          console.warn(`[Iasis IA] Modelo ${model} retornou status ${response.status}. Tentando próximo...`);
          continue;
        }

        const resData = await response.json();
        const text = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 0) {
          return text.trim();
        }
      } catch (err) {
        console.warn(`[Iasis IA] Erro ao consultar ${model}:`, err);
      }
    }
    return null;
  }

  // ================= 3. MODO GRADE DE PAUTAS (CALENDÁRIO PERPÉTUO) =================
  function renderCalendarView() {
    if (!dom.calendarGrid) return;

    let filteredTasks = data.tasks;
    if (state.activeFilter !== 'all') {
      filteredTasks = filteredTasks.filter(t => t.category === state.activeFilter);
    }

    dom.calendarGrid.innerHTML = filteredTasks.map((task, idx) => {
      const isDone = !!state.completedTasks[task.id];
      const cat = data.categories[task.category] || { label: task.category, color: '#e5c378', icon: '📌' };
      const activeContent = getActiveContent(task);

      return `
        <div class="calendar-card ${isDone ? 'is-completed' : ''}" data-pauta-index="${idx}">
          <div class="card-header-mini">
            <span class="day-chip">PAUTA ${idx + 1}</span>
            <span class="time-chip"><i data-lucide="clock" style="width: 11px; height: 11px;"></i> ${task.recommendedTime}</span>
            <button class="check-circle-btn ${isDone ? 'checked' : ''}" title="Marcar como gravada" data-task-id="${task.id}">
              ${isDone ? '<i data-lucide="check" style="width: 12px; height: 12px;"></i>' : ''}
            </button>
          </div>
          
          <div class="card-date-mini">${task.scenario || 'Cafeteria'}</div>
          <div class="card-title-mini">${task.title}</div>
          
          <div class="card-footer-mini">
            <span class="cat-label-mini" style="color: var(--gold-bright);">
              ${cat.icon} ${cat.label}
            </span>
            <span class="channel-mini">${activeContent.isCustomScript ? '✍️ Editado' : 'Vídeo 9:16'}</span>
          </div>
        </div>
      `;
    }).join('');

    dom.calendarGrid.querySelectorAll('.calendar-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.check-circle-btn')) {
          const idx = parseInt(card.dataset.pautaIndex);
          if (!isNaN(idx)) {
            state.currentPautaIndex = idx;
            state.currentView = 'today';
            dom.viewTabs.forEach(t => t.classList.toggle('active', t.dataset.view === 'today'));
            renderView();
          }
        }
      });
    });

    dom.calendarGrid.querySelectorAll('.check-circle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = btn.dataset.taskId;
        toggleTaskCompletion(taskId);
      });
    });
  }

  // ================= 4. MODO DATAS COMEMORATIVAS & SAZONALIDADE =================
  function renderSpecialDatesView() {
    if (!dom.timelineContainer) return;

    dom.timelineContainer.innerHTML = `
      <div style="margin-bottom: 14px; padding: 12px 16px; background: rgba(197, 160, 89, 0.08); border: 1px solid var(--border-gold-subtle); border-radius: var(--radius-md);">
        <h3 style="font-family: var(--font-azonix); font-size: 0.92rem; color: var(--gold-bright); letter-spacing: 1px; text-transform: uppercase;">⭐ Calendário de Datas Comemorativas & Sazonalidade</h3>
        <p style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 4px;">Campanhas estratégicas anuais de altíssimo impacto para ativar nos períodos festivos da família e datas de homenagem.</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px;">
        ${(data.specialDates || []).map(sp => {
          const activeContent = getActiveContent(sp);
          return `
            <div class="calendar-card" style="min-height: 220px; border-color: ${sp.color || 'var(--border-gold)'};">
              <div class="card-header-mini">
                <span class="day-chip" style="background: rgba(197, 160, 89, 0.2); color: var(--gold-bright);">${sp.badge}</span>
                <span class="time-chip" style="color: var(--gold-bright); font-weight: 600;">📅 ${sp.period}</span>
              </div>
              
              <div style="font-family: var(--font-serif); font-size: 1.05rem; color: #fff; margin: 6px 0; font-weight: 600;">${sp.name}</div>
              <p style="font-size: 0.76rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 10px;">${sp.summary}</p>
              
              <div style="display: flex; gap: 6px; margin-top: auto;">
                <button class="btn-copy-gold" onclick="window.copyText('${escapeForHtml(activeContent.script)}')" style="flex: 1; justify-content: center;">
                  <i data-lucide="copy" style="width: 11px; height: 11px;"></i> Copiar Roteiro
                </button>
                <button class="btn-copy-gold" onclick="window.copyText('${escapeForHtml(activeContent.caption + '\\n\\n' + sp.hashtags)}')" style="flex: 1; justify-content: center;">
                  <i data-lucide="file-text" style="width: 11px; height: 11px;"></i> Copiar Legenda
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    triggerLucide();
  }

  // ================= 5. DRAWER LATERAL DE DETALHES =================
  function openDrawer(task) {
    state.selectedTask = task;
    const cat = data.categories[task.category] || { label: task.category, color: '#e5c378', icon: '📌' };
    const isDone = !!state.completedTasks[task.id];
    const activeContent = getActiveContent(task);

    dom.drawerContent.innerHTML = `
      <div class="drawer-header-meta">
        <span class="category-pill" style="border: 1px solid var(--border-gold); background: rgba(197, 160, 89, 0.12); color: var(--gold-bright);">
          ${cat.icon} ${cat.label}
        </span>
        <span class="day-chip">PAUTA ${task.pautaNumber || ''}</span>
      </div>

      <h2 class="drawer-title">${task.title}</h2>
      <p class="drawer-summary">${task.summary}</p>

      <div class="drawer-details-grid">
        <div class="drawer-detail-item">
          <strong>☕ Cenário:</strong> <span>${task.scenario || 'Cafeteria'}</span>
        </div>
        <div class="drawer-detail-item">
          <strong>⏰ Horário Ideal:</strong> <span>${task.recommendedTime}</span>
        </div>
        <div class="drawer-detail-item">
          <strong>📐 Formato:</strong> <span>${task.format}</span>
        </div>
        <div class="drawer-detail-item">
          <strong>⏱️ Duração:</strong> <span>${task.duration}</span>
        </div>
      </div>

      <div class="drawer-section">
        <div class="drawer-section-header">
          <h3>🎙️ Roteiro de Fala</h3>
          <button class="btn-copy-gold" id="drawer-copy-script-btn">
            <i data-lucide="copy" style="width: 11px; height: 11px;"></i> Copiar
          </button>
        </div>
        <div class="script-box-drawer">${escapeForHtml(activeContent.script)}</div>
      </div>

      <div class="drawer-section">
        <div class="drawer-section-header">
          <h3>📝 Sugestão de Legenda & Hashtags</h3>
          <button class="btn-copy-gold" id="drawer-copy-caption-btn">
            <i data-lucide="copy" style="width: 11px; height: 11px;"></i> Copiar
          </button>
        </div>
        <div class="caption-box-drawer">${escapeForHtml(activeContent.caption)}<br><br><small class="hashtags-text">${task.hashtags}</small></div>
      </div>

      <div class="drawer-section">
        <h3>✅ Checklist de Produção</h3>
        <ul class="checklist-items">
          ${(task.checklist || []).map(item => `<li><i data-lucide="check-square" style="width: 14px; height: 14px; color: var(--gold-primary);"></i> ${item}</li>`).join('')}
        </ul>
      </div>

      <div class="drawer-footer-actions">
        <button class="btn-gold-action ${isDone ? 'done' : ''}" id="drawer-toggle-btn">
          <i data-lucide="check" style="width: 15px; height: 15px;"></i>
          ${isDone ? 'Pauta Gravada ✓ (Clique para reabrir)' : 'Marcar como Gravada'}
        </button>
      </div>
    `;

    const drawerToggleBtn = document.getElementById('drawer-toggle-btn');
    if (drawerToggleBtn) {
      drawerToggleBtn.addEventListener('click', () => {
        toggleTaskCompletion(task.id);
      });
    }

    const drawerCopyScriptBtn = document.getElementById('drawer-copy-script-btn');
    if (drawerCopyScriptBtn) {
      drawerCopyScriptBtn.addEventListener('click', () => {
        window.copyText(activeContent.script);
      });
    }

    const drawerCopyCaptionBtn = document.getElementById('drawer-copy-caption-btn');
    if (drawerCopyCaptionBtn) {
      drawerCopyCaptionBtn.addEventListener('click', () => {
        window.copyText(activeContent.caption + '\n\n' + task.hashtags);
      });
    }

    dom.drawer.classList.add('open');
    dom.drawerOverlay.classList.add('open');
    triggerLucide();
  }

  function closeDrawer() {
    dom.drawer.classList.remove('open');
    dom.drawerOverlay.classList.remove('open');
    state.selectedTask = null;
  }

  // ================= 6. NOTIFICAÇÃO TOAST =================
  function showToast(message) {
    if (!dom.toast) return;
    dom.toast.textContent = message;
    dom.toast.classList.add('show');
    setTimeout(() => {
      dom.toast.classList.remove('show');
    }, 3200);
  }

  // ================= 7. AUXILIARES =================
  window.copyText = function(text) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Texto copiado com sucesso! 📋');
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('Texto copiado com sucesso! 📋');
    });
  };

  function escapeForHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
