// assets/planner.js — Lógica Perpétua, Edição Direta e Assistente de Ajuste In-Card com Iasis (Gemini API)
// Reestruturado: Cronograma inteligente 4x/semana (Seg, Qua, Sex, Dom) com replanejamento automático em cadeia

document.addEventListener('DOMContentLoaded', () => {
  // Configuração da API do Iasis (Gemini) — Idêntica ao painel.js
  const GEMINI_API_KEY = window.ENV_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || (typeof atob !== 'undefined' ? atob('QVEuQWI4Uk42TFBBTFZRMmNXZ0dvVUFGVTBvaHpjcUZ5RmlyVDFMaHFqSHVXdHN0U0dMU3c=') : '');
  const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-flash-latest'];

  // Dias permitidos na semana (1: Segunda, 3: Quarta, 5: Sexta)
  const ALLOWED_DAYS = [1, 3, 5];

  // Estado da Aplicação (Perpétuo)
  const state = {
    currentView: 'today', // 'today' | 'calendar' | 'timeline'
    currentPautaIndex: 0,
    activeFilter: 'all',
    startDate: getStoredStartDate(),
    taskDates: {}, // Mapeamento dinâmico calculado { taskId: Date }
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
    todayContainer: document.getElementById('today-task-card'),
    calendarGrid: document.getElementById('calendar-grid'),
    timelineContainer: document.getElementById('timeline-phases'),
    drawer: document.getElementById('task-drawer'),
    drawerOverlay: document.getElementById('drawer-overlay'),
    drawerClose: document.getElementById('drawer-close'),
    drawerContent: document.getElementById('drawer-body'),
    btnResetStorage: document.getElementById('btn-reset-storage'),
    btnReplanSchedule: document.getElementById('btn-replan-schedule'),
    toast: document.getElementById('app-toast')
  };

  // Inicialização
  init();

  function init() {
    calculateSchedule();
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

  function cleanScriptToSpokenOnly(text) {
    if (!text || typeof text !== 'string') return '';
    let s = text;
    // Corta qualquer bloco indevido de legenda que a IA possa ter anexado
    const captionCutRegex = /(?:^|\n)(?:---|\*\*(?:LEGENDA|SUGESTÃO DE LEGENDA|CAPTION)\*\*|LEGENDA:|SUGESTÃO DE LEGENDA:|#\w+)/i;
    const cutMatch = s.search(captionCutRegex);
    if (cutMatch !== -1) {
      s = s.substring(0, cutMatch);
    }
    // Remove indicações de rubricas ou cenário entre colchetes/parênteses
    s = s.replace(/\[[^\]]*\]/g, '').replace(/\([^)]*\)/g, '');
    // Remove hashtags residuais que tenham sobrado
    s = s.replace(/#\w+/g, '');

    // Normaliza quebras de linha preservando parágrafos estruturados (Introdução, Desenvolvimento, Conclusão)
    let paragraphs = s.split(/\r?\n\s*\r?\n/)
      .map(p => {
        let lines = p.split(/\r?\n/)
          .map(l => l.trim())
          .filter(l => l.length > 0)
          .map(l => {
            if (l.startsWith('"') && l.endsWith('"') && l.length > 1) return l.slice(1, -1).trim();
            if (l.startsWith('"')) return l.slice(1).trim();
            if (l.endsWith('"')) return l.slice(0, -1).trim();
            return l;
          })
          .filter(l => l.length > 0);
        return lines.join(' ');
      })
      .map(p => p.trim())
      .filter(p => p.length > 0);

    // Se o texto veio em um bloco único colado sem quebras duplas, divida inteligentemente por pontuação em 3 parágrafos
    if (paragraphs.length === 1) {
      const sentences = paragraphs[0].match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g) || [paragraphs[0]];
      const cleanSentences = sentences.map(s => s.trim()).filter(s => s.length > 0);
      if (cleanSentences.length >= 3) {
        const p1 = cleanSentences.slice(0, 2).join(' ');
        const p3 = cleanSentences[cleanSentences.length - 1];
        const p2 = cleanSentences.slice(2, cleanSentences.length - 1).join(' ');
        paragraphs = [p1, p2, p3];
      } else if (cleanSentences.length === 2) {
        paragraphs = [cleanSentences[0], cleanSentences[1]];
      }
    }

    return paragraphs.join('\n\n');
  }

  function getActiveContent(task) {
    if (!task) return { title: '', summary: '', scenario: '', script: '', caption: '', isCustomScript: false, isCustomCaption: false };
    const saved = (state.customContent && state.customContent[task.id]) || {};
    const rawScript = typeof saved.script === 'string' ? saved.script : task.script;
    return {
      title: typeof saved.title === 'string' ? saved.title : task.title,
      summary: typeof saved.summary === 'string' ? saved.summary : task.summary,
      scenario: typeof saved.scenario === 'string' ? saved.scenario : (task.scenario || 'Cafeteria'),
      script: cleanScriptToSpokenOnly(rawScript),
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

  function saveStartDate(date) {
    try {
      localStorage.setItem('reviva_planner_start_date', date.toISOString());
    } catch (e) {}
  }

  // Obtém a Segunda-feira correspondente à semana de início
  function getMondayOfCurrentWeek(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    // 0: Dom (-6), 1: Seg (0), 2: Ter (-1), 3: Qua (-2), etc.
    const diff = (day === 0 ? -6 : 1) - day;
    d.setDate(d.getDate() + diff);
    return d;
  }

  // Avança para o próximo dia válido da cadência oficial (Seg=1, Qua=3, Sex=5)
  function getNextAllowedDate(curr) {
    const next = new Date(curr);
    next.setDate(next.getDate() + 1);
    while (!ALLOWED_DAYS.includes(next.getDay())) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  function getFirstAllowedDateOnOrAfter(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    while (!ALLOWED_DAYS.includes(d.getDay())) {
      d.setDate(d.getDate() + 1);
    }
    return d;
  }

  // Calcula todas as datas dos posts rigorosamente sincronizadas com os pilares:
  // Post 1 (Iasis Pensa) = Segunda
  // Post 2 (Reviva Apresenta) = Quarta
  // Post 3 (Iasis Conversa) = Sexta
  function calculateSchedule(forceReplanFromToday = false) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // A cadência começa sempre na Segunda-feira da semana de início
    if (forceReplanFromToday || !state.startDate) {
      state.startDate = getMondayOfCurrentWeek(today);
      saveStartDate(state.startDate);
    }

    let cursor = new Date(state.startDate);
    // Assegura que o cursor comece exatamente em uma Segunda-feira (1)
    if (cursor.getDay() !== 1) {
      cursor = getMondayOfCurrentWeek(cursor);
    }

    const newDates = {};

    data.tasks.forEach((task) => {
      newDates[task.id] = new Date(cursor);
      cursor = getNextAllowedDate(cursor);
    });

    state.taskDates = newDates;
  }

  function getTaskCalculatedDate(taskOrIndex) {
    const task = typeof taskOrIndex === 'number' ? data.tasks[taskOrIndex] : taskOrIndex;
    if (task && state.taskDates && state.taskDates[task.id]) {
      return state.taskDates[task.id];
    }
    return new Date();
  }

  function formatDateHuman(date) {
    if (!date) return '';
    const options = { weekday: 'long', day: '2-digit', month: 'long' };
    return date.toLocaleDateString('pt-BR', options);
  }

  function formatDateShort(date) {
    if (!date) return '';
    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '');
  }

  function getWordCount(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  function getSpeechSeconds(wordsCount) {
    return Math.round((wordsCount / 125) * 60);
  }

  function estimateSpeechDuration(wordsCount) {
    const seconds = getSpeechSeconds(wordsCount);
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


    if (dom.drawerClose) dom.drawerClose.addEventListener('click', closeDrawer);
    if (dom.drawerOverlay) dom.drawerOverlay.addEventListener('click', closeDrawer);

    // Botão Replanejar Agenda
    if (dom.btnReplanSchedule) {
      dom.btnReplanSchedule.addEventListener('click', () => {
        calculateSchedule(true);
        renderView();
        showToast('Agenda replanejada a partir de hoje! 📅✨');
      });
    }

    if (dom.btnResetStorage) {
      dom.btnResetStorage.addEventListener('click', () => {
        if (confirm('Deseja reiniciar todas as pautas marcadas como gravadas e o cronograma?')) {
          state.completedTasks = {};
          saveCompletedTasks();
          calculateSchedule(true);
          renderView();
          showToast('Progresso e agenda reiniciados com sucesso.');
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

    // Recalcula o cronograma dinamicamente: se desmarcar ou marcar, as pautas pendentes se ajustam
    calculateSchedule(false);

    const isDone = state.completedTasks[taskId];
    showToast(isDone ? 'Post marcado como concluído! 🎉' : 'Post reaberto como pendente.');

    const drawerToggleBtn = document.getElementById('drawer-toggle-btn');
    if (drawerToggleBtn) {
      drawerToggleBtn.className = `btn-gold-action ${isDone ? 'done' : ''}`;
      drawerToggleBtn.innerHTML = isDone 
        ? '<i data-lucide="check-check" style="width: 15px; height: 15px;"></i> <span class="btn-text-default">POST CONCLUÍDO ✓</span><span class="btn-text-hover">REABRIR POST</span>' 
        : '<i data-lucide="clock" style="width: 15px; height: 15px;"></i> <span class="btn-text-default">POST PENDENTE</span><span class="btn-text-hover">MARCAR COMO CONCLUÍDO</span>';
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

    let availableTasks = data.tasks;
    if (state.activeFilter !== 'all') {
      availableTasks = data.tasks.filter(t => t.category === state.activeFilter || t.themeId === state.activeFilter);
    }

    if (availableTasks.length === 0) {
      dom.todayContainer.innerHTML = '<div class="empty-state" style="padding: 40px; text-align: center; color: var(--text-secondary);">Nenhum post encontrado para este filtro.</div>';
      return;
    }

    if (state.currentPautaIndex >= availableTasks.length) {
      state.currentPautaIndex = 0;
    }
    const primaryTask = availableTasks[state.currentPautaIndex] || availableTasks[0];

    const taskDate = getTaskCalculatedDate(primaryTask);
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



    const scriptWords = getWordCount(activeContent.script);
    const scriptDuration = estimateSpeechDuration(scriptWords);
    const captionWords = getWordCount(activeContent.caption);

    const currentGlobalIndex = data.tasks.findIndex(t => t.id === primaryTask.id);

    const themeClass = primaryTask.themeId === 'iasis_pensa' 
      ? 'theme-seg' 
      : (primaryTask.themeId === 'reviva_apresenta' ? 'theme-qua' : 'theme-sex');

    dom.todayContainer.innerHTML = `
      <!-- BARRA DE NAVEGAÇÃO ENTRE PAUTAS -->
      <div class="today-header-nav">
        <div class="today-nav-left">
          <button class="btn-dashboard-header" id="btn-prev-day" ${state.currentPautaIndex <= 0 ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''} title="Post anterior (Atalho: Seta Esquerda)">
            <i data-lucide="chevron-left" style="width: 13px; height: 13px;"></i> <span>Anterior</span>
          </button>
        </div>

        <div class="day-indicator-center">
          <span class="day-badge" style="color: var(--gold-bright);">POST ${currentGlobalIndex + 1} DE ${data.tasks.length}</span>
          <span style="color: rgba(197, 160, 89, 0.35);">|</span>
          <span class="date-human">${formatDateHuman(taskDate)}</span>
          <button id="btn-replan-today-inline" title="Replanejar pendentes a partir de hoje" style="background: none; border: none; cursor: pointer; color: var(--gold-primary); display: inline-flex; align-items: center; margin-left: 6px;">
            <i data-lucide="calendar-sync" style="width: 12px; height: 12px;"></i>
          </button>
        </div>

        <div class="today-nav-right">
          <button class="btn-dashboard-header" id="btn-next-day" ${state.currentPautaIndex >= (availableTasks.length - 1) ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''} title="Próximo post (Atalho: Seta Direita)">
            <span>Próximo</span> <i data-lucide="chevron-right" style="width: 13px; height: 13px;"></i>
          </button>
        </div>
      </div>

      <!-- COCKPIT SPLIT EM TELA CHEIA (SEM ROLAGEM DE PÁGINA) -->
      <div class="today-split-grid ${themeClass}">
        
        <!-- COLUNA 1: ESTRATÉGIA, INFORMAÇÃO E AÇÕES -->
        <div class="today-strategy-col ${isCompleted ? 'is-completed' : ''}">
          <div class="today-strategy-body">
            
            <div class="today-top-meta">
              <span class="category-pill" style="border: 1px solid var(--border-gold); background: rgba(197, 160, 89, 0.12); color: var(--gold-bright);">
                ${cat.icon} ${primaryTask.pilar || cat.label}
              </span>
              <div class="time-box">
                <i data-lucide="clock" style="width: 12px; height: 12px; color: var(--gold-bright);"></i>
                <strong>${primaryTask.recommendedTime}</strong>
              </div>
            </div>

            <!-- CAMPOS EDITÁVEIS DE ESTRATÉGIA, TEMA E CENÁRIO -->
            <div class="today-strategy-field">
              <label class="today-field-label" for="theme-title-input">
                <span>Tema & Título do Vídeo</span>
                <span style="font-size:0.60rem; color:var(--text-secondary); text-transform:none;">Editável</span>
              </label>
              <input type="text" class="today-field-input" id="theme-title-input" value="${escapeForHtml(activeContent.title)}" placeholder="Ex: Por que fotos antigas nos emocionam?">
            </div>

            <div class="today-strategy-field">
              <label class="today-field-label" for="theme-summary-input">
                <span>Contexto & Proposta do Post</span>
                <span style="font-size:0.60rem; color:var(--text-secondary); text-transform:none;">Editável</span>
              </label>
              <textarea class="today-field-textarea" id="theme-summary-input" rows="2" placeholder="Descreva a ideia central, o gancho emocional e o objetivo deste conteúdo...">${escapeForHtml(activeContent.summary)}</textarea>
            </div>

            <div class="today-strategy-field">
              <label class="today-field-label" for="theme-scenario-input">
                <span>Direção de Cena & Cenário</span>
                <span style="font-size:0.60rem; color:var(--text-secondary); text-transform:none;">Editável</span>
              </label>
              <textarea class="today-field-textarea" id="theme-scenario-input" rows="2" placeholder="Ex: Cafeteria com luz suave da tarde, xícara de café na mesa, tom sereno...">${escapeForHtml(activeContent.scenario)}</textarea>
            </div>

            <!-- BOTÃO PARA REFAZER TODO O ROTEIRO E LEGENDA COM BASE NESSE PRIMEIRO CARD -->
            <button type="button" class="btn-regenerate-all" id="btn-regenerate-from-strategy" title="Refazer roteiro de fala e legenda inteiros a partir das novas orientações deste card">
              <i data-lucide="sparkles" style="width: 13px; height: 13px;"></i>
              <span>Refazer Roteiro com base nesta Cena</span>
            </button>

            <div class="quick-info-grid" style="margin-top: 6px;">
              <div class="info-card" title="Formato único de gravação">
                <span class="info-label">Formato</span>
                <span class="info-value">${primaryTask.format}</span>
              </div>
              <div class="info-card" title="Duração estimada">
                <span class="info-label">Duração Alvo</span>
                <span class="info-value">≤ 60s (Ritmo Iasis)</span>
              </div>
            </div>

            <div class="today-checklist-box" style="margin-top: 6px;">
              <div class="today-checklist-title">
                <i data-lucide="list-checks" style="width: 12px; height: 12px; color: var(--gold-primary);"></i>
                <span>Checklist de Gravação</span>
              </div>
              <ul class="today-checklist-list">
                ${checklistHtml}
              </ul>
            </div>

          </div>

          <div class="today-actions-bar">
            <button class="btn-gold-action ${isCompleted ? 'done' : ''}" id="btn-toggle-today-done">
              <i data-lucide="${isCompleted ? 'check-check' : 'clock'}" style="width: 15px; height: 15px;"></i>
              ${isCompleted 
                ? '<span class="btn-text-default">POST CONCLUÍDO ✓</span><span class="btn-text-hover">REABRIR POST</span>' 
                : '<span class="btn-text-default">POST PENDENTE</span><span class="btn-text-hover">MARCAR COMO CONCLUÍDO</span>'}
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
                <span style="letter-spacing: 0.3px;">Tempo Máx: <strong>60s</strong></span>
              </div>
            </div>

            <!-- CAMPO DE AJUSTE DIRETO COM IASIS (NA BASE DO CARD) -->
            <div class="card-prompt-bar">
              <img src="iasis_avatar.jpg" alt="Iasis" class="card-prompt-avatar" title="Iasis IA">
              <textarea class="card-prompt-input" id="script-prompt-input" rows="2" placeholder="Peça alterações ao Iasis no roteiro... (ex: mencione um café, dê tom mais íntimo...)"></textarea>
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
              <div class="panel-stats-bar">
                <span id="caption-stats-counter">${captionWords} palavras</span>
                <span style="letter-spacing: 0.3px;">Limite: <strong>≤ 100 palavras</strong></span>
              </div>
            </div>

            <!-- CAMPO DE AJUSTE DIRETO COM IASIS (NA BASE DO CARD) -->
            <div class="card-prompt-bar">
              <img src="iasis_avatar.jpg" alt="Iasis" class="card-prompt-avatar" title="Iasis IA">
              <textarea class="card-prompt-input" id="caption-prompt-input" rows="2" placeholder="Peça alterações na legenda... (ex: faça uma pergunta reflexiva, use tom carinhoso...)"></textarea>
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
    const captionStatsCounter = document.getElementById('caption-stats-counter');
    const btnReplanInline = document.getElementById('btn-replan-today-inline');

    if (btnReplanInline) {
      btnReplanInline.addEventListener('click', () => {
        calculateSchedule(true);
        renderView();
        showToast('Agenda recalculada a partir de hoje! 📅');
      });
    }

    // Inputs de Tema, Contexto e Cenário da Coluna 1
    const themeTitleInput = document.getElementById('theme-title-input');
    const themeSummaryInput = document.getElementById('theme-summary-input');
    const themeScenarioInput = document.getElementById('theme-scenario-input');
    const btnRegenerateFromStrategy = document.getElementById('btn-regenerate-from-strategy');

    if (themeTitleInput) {
      themeTitleInput.addEventListener('input', () => {
        saveTaskFieldCustom(primaryTask.id, 'title', themeTitleInput.value);
      });
    }
    if (themeSummaryInput) {
      themeSummaryInput.addEventListener('input', () => {
        saveTaskFieldCustom(primaryTask.id, 'summary', themeSummaryInput.value);
      });
    }
    if (themeScenarioInput) {
      themeScenarioInput.addEventListener('input', () => {
        saveTaskFieldCustom(primaryTask.id, 'scenario', themeScenarioInput.value);
      });
    }

    // Regerar Roteiro de Fala e Legenda completos com base nas orientações da Coluna 1
    if (btnRegenerateFromStrategy) {
      btnRegenerateFromStrategy.addEventListener('click', async () => {
        const currentTitle = (themeTitleInput ? themeTitleInput.value.trim() : '') || primaryTask.title;
        const currentSummary = (themeSummaryInput ? themeSummaryInput.value.trim() : '') || primaryTask.summary;
        const currentScenario = (themeScenarioInput ? themeScenarioInput.value.trim() : '') || primaryTask.scenario;

        // Salva as alterações
        saveTaskFieldCustom(primaryTask.id, 'title', currentTitle);
        saveTaskFieldCustom(primaryTask.id, 'summary', currentSummary);
        saveTaskFieldCustom(primaryTask.id, 'scenario', currentScenario);

        btnRegenerateFromStrategy.classList.add('loading');
        btnRegenerateFromStrategy.innerHTML = '<i data-lucide="loader-2" class="spin" style="width:13px;height:13px;"></i> <span>Escrevendo novo roteiro e cena...</span>';
        triggerLucide();

        const customInstruction = `REESCREVA COMPLETAMENTE ESTE ROTEIRO com base no novo tema e direção de cena:
- Novo Título/Tema: "${currentTitle}"
- Contexto & Proposta: "${currentSummary}"
- Cenário & Direção: "${currentScenario}"
Crie uma narrativa original de fala (≤ 60s, apenas falas do Iasis) perfeitamente alinhada a este cenário, OBRIGATORIAMENTE estruturada em 3 parágrafos separados (Introdução, Desenvolvimento e Conclusão).`;

        const taskContext = {
          ...primaryTask,
          title: currentTitle,
          summary: currentSummary,
          scenario: currentScenario
        };

        // 1. Gera novo Roteiro de fala
        const newScript = await callIasisAiApi('script', taskContext, '', customInstruction);
        if (newScript) {
          saveTaskFieldCustom(primaryTask.id, 'script', newScript);
        }

        // 2. Gera nova Legenda pronta
        const newCaption = await callIasisAiApi('caption', taskContext, '', customInstruction);
        if (newCaption) {
          saveTaskFieldCustom(primaryTask.id, 'caption', newCaption);
        }

        btnRegenerateFromStrategy.classList.remove('loading');
        btnRegenerateFromStrategy.innerHTML = '<i data-lucide="sparkles" style="width:13px;height:13px;"></i> <span>Refazer Roteiro com base nesta Cena</span>';
        triggerLucide();

        showToast('Roteiro e Legenda reescritos pelo Iasis! ✨');
        renderTodayView();
        triggerLucide();
      });
    }

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

    // Função para atualizar e validar o tempo de fala do Roteiro (máx 60 segundos)
    function updateScriptCounter(text) {
      if (!scriptStatsCounter) return;
      const words = getWordCount(text);
      const seconds = getSpeechSeconds(words);
      const isOverLimit = seconds > 60;

      if (isOverLimit) {
        scriptStatsCounter.innerHTML = `<span class="limit-warn">⚠️ ${words} palavras • ~${seconds}s (Limite: máx 60s!)</span>`;
        if (scriptEditor) scriptEditor.classList.add('exceeded-limit');
        if (btnSaveScript) {
          btnSaveScript.style.opacity = '0.5';
          btnSaveScript.style.cursor = 'not-allowed';
          btnSaveScript.title = 'Roteiro excede o limite máximo de 60 segundos!';
        }
      } else {
        scriptStatsCounter.innerHTML = `<span>${words} palavras • ~${seconds}s de fala</span> <span class="limit-ok" style="font-size: 0.60rem;">(≤ 60s ✓)</span>`;
        if (scriptEditor) scriptEditor.classList.remove('exceeded-limit');
        if (btnSaveScript) {
          btnSaveScript.style.opacity = '1';
          btnSaveScript.style.cursor = 'pointer';
          btnSaveScript.title = 'Salvar alterações manuais feitas no roteiro';
        }
      }
    }

    // Função para atualizar e validar a contagem de palavras da Legenda (máx 100 palavras)
    function updateCaptionCounter(text) {
      if (!captionStatsCounter) return;
      const words = getWordCount(text);
      const isOverLimit = words > 100;

      if (isOverLimit) {
        captionStatsCounter.innerHTML = `<span class="limit-warn">⚠️ ${words} palavras (Limite: máx 100!)</span>`;
        if (captionEditor) captionEditor.classList.add('exceeded-limit');
        if (btnSaveCaption) {
          btnSaveCaption.style.opacity = '0.5';
          btnSaveCaption.style.cursor = 'not-allowed';
          btnSaveCaption.title = 'Legenda excede o limite máximo de 100 palavras!';
        }
      } else {
        captionStatsCounter.innerHTML = `<span>${words} palavras</span> <span class="limit-ok" style="font-size: 0.60rem;">(≤ 100 ✓)</span>`;
        if (captionEditor) captionEditor.classList.remove('exceeded-limit');
        if (btnSaveCaption) {
          btnSaveCaption.style.opacity = '1';
          btnSaveCaption.style.cursor = 'pointer';
          btnSaveCaption.title = 'Salvar alterações manuais feitas na legenda';
        }
      }
    }

    // Inicializa contadores com validação
    if (scriptEditor) {
      updateScriptCounter(scriptEditor.value);
    }
    if (captionEditor) {
      updateCaptionCounter(captionEditor.value);
    }

    // Contador dinâmico de palavras no Roteiro
    if (scriptEditor && scriptStatsCounter) {
      scriptEditor.addEventListener('input', () => {
        updateScriptCounter(scriptEditor.value);
        const words = getWordCount(scriptEditor.value);
        const seconds = getSpeechSeconds(words);
        if (seconds <= 60) {
          saveTaskFieldCustom(primaryTask.id, 'script', scriptEditor.value);
        }
      });
    }

    // Contador dinâmico e auto-save da Legenda
    if (captionEditor) {
      captionEditor.addEventListener('input', () => {
        updateCaptionCounter(captionEditor.value);
        const words = getWordCount(captionEditor.value);
        if (words <= 100) {
          saveTaskFieldCustom(primaryTask.id, 'caption', captionEditor.value);
        }
      });
    }

    // Salvar Roteiro Manual (Bloqueia se > 60 segundos)
    if (btnSaveScript && scriptEditor) {
      btnSaveScript.addEventListener('click', () => {
        const words = getWordCount(scriptEditor.value);
        const seconds = getSpeechSeconds(words);
        if (seconds > 60) {
          showToast(`⚠️ Tempo estimado em ${seconds}s. Reduza o texto para até 60s!`);
          scriptEditor.focus();
          return;
        }
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
        updateScriptCounter(generated);
        if (scriptPromptInput) scriptPromptInput.value = '';
        showToast('Roteiro ajustado e salvo! ✨');
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
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleScriptInCardAdjustment();
        }
      });
    }

    // Salvar Legenda Manual (Bloqueia se > 100 palavras)
    if (btnSaveCaption && captionEditor) {
      btnSaveCaption.addEventListener('click', () => {
        const words = getWordCount(captionEditor.value);
        if (words > 100) {
          showToast(`⚠️ Legenda com ${words} palavras. Reduza para no máximo 100 palavras!`);
          captionEditor.focus();
          return;
        }
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

    // Copiar Legenda (já inclui as 5 hashtags no final do texto)
    if (btnCopyCaption && captionEditor) {
      btnCopyCaption.addEventListener('click', () => {
        window.copyText(captionEditor.value);
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
        updateCaptionCounter(generated);
        if (captionPromptInput) captionPromptInput.value = '';
        showToast('Legenda ajustada e salva! ✨');
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
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleCaptionInCardAdjustment();
        }
      });
    }

    // Navegação entre pautas
    let availableTasksCount = data.tasks.length;
    if (state.activeFilter !== 'all') {
      availableTasksCount = data.tasks.filter(t => t.category === state.activeFilter || t.themeId === state.activeFilter).length;
    }

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
        if (state.currentPautaIndex < (availableTasksCount - 1)) {
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
    const isScript = targetType === 'script';

    if (isScript) {
      return `
Você é o Iasis, o influencer digital humanista e roteirista oficial da Reviva Memories.
Você tem uma personalidade digital própria: sereno, reflexivo, inteligente e acolhedor.
Regra de Ouro: "A Reviva é a empresa. Iasis é a voz." Você NÃO faz propaganda forçada.

SEU OBJETIVO EXCLUSIVO AGORA:
Entregar única e exclusivamente o ROTEIRO DE FALA para vídeo vertical (9:16) sobre o tema: "${task.title}".
Pilar Editorial: ${task.pilar || 'Reflexão'}. Cenário: ${task.scenario || 'Cafeteria Urbana'}.

REGRAS INEGOCIÁVEIS PARA ROTEIRO DE FALA:
1. APENAS FALA FALADA PURA:
   - Forneça estritamente o texto que será lido em voz alta.
   - NUNCA inclua legenda.
   - NUNCA inclua hashtags (#).
   - NUNCA inclua divisores como '---' ou cabeçalhos como '**LEGENDA**'.
   - NÃO inclua rubricas entre parênteses nem marcações de cena entre colchetes.
2. ESTRUTURAÇÃO OBRIGATÓRIA EM 3 PARÁGRAFOS DISTINTOS:
   - O roteiro NÃO PODE vir em um bloco único colado. Separe OBRIGATORIAMENTE em 3 parágrafos com linha em branco entre eles:
     * Parágrafo 1 (Introdução/Gancho): Primeiros 3-5 segundos que capturam a atenção e abrem a reflexão.
     * Parágrafo 2 (Desenvolvimento): O coração da mensagem, a história ou o ponto central do afeto.
     * Parágrafo 3 (Conclusão/Fechamento): A frase de acolhimento ou pergunta final para o espectador.
3. DURAÇÃO E LIMITE DE TEMPO:
   - Limite estrito: entre 40 e 50 segundos de fala (MÁXIMO ABSOLUTO DE 105 A 115 PALAVRAS no total).
   - Se o usuário pediu para encurtar ou reduzir tempo, corte palavras e seja conciso sem perder a essência da mensagem que o usuário construiu.
4. RESPEITO AO CONTEÚDO DO USUÁRIO:
   - Preserve a ideia, as frases-chave e o ponto central do texto fornecido pelo usuário. Não descarte a proposta dele por um texto genérico.
5. FORMATO DE SAÍDA:
   - Retorne APENAS o texto da fala falada, estruturado em 3 parágrafos separados por linha em branco, pronto para leitura direta no teleprompter.`;
    }

    return `
Você é o Iasis, o influencer humanista da Reviva Memories.
SEU OBJETIVO EXCLUSIVO AGORA:
Escrever a LEGENDA para o post: "${task.title}".

REGRAS PARA LEGENDA:
1. LIMITE RIGOROSO: Máximo absoluto de 100 palavras (incluindo texto e hashtags). Seja conciso, poético e acolhedor.
2. Texto envolvente dividido em parágrafos limpos e acolhedores.
3. Termine com uma pergunta reflexiva para estimular comentários.
4. HASHTAGS: Inclua logo abaixo do texto exatamente 5 hashtags altamente estratégicas (ex: #Iasis #RevivaMemories #MemoriasAfetivas #PresencaEterna #Familia). Não coloque mais de 5 hashtags.
5. Retorne APENAS o texto da legenda com as 5 hashtags no final, pronto para ser copiado.`;
  }

  async function callIasisAiApi(targetType, task, originalText, instruction) {
    const systemPrompt = getIasisSystemPrompt(targetType, task);
    const isScript = targetType === 'script';

    let userPrompt = '';
    if (isScript) {
      userPrompt = `
TEXTO ATUAL DO ROTEIRO DE FALA:
"""
${originalText}
"""

PEDIDO DE AJUSTE DO USUÁRIO:
${instruction}

INSTRUÇÃO IMPORTANTE:
Ajuste o texto acima respeitando as ideias e o conteúdo já digitados pelo usuário, apenas aplicando a instrução solicitada sem descartar a proposta.
ESTRUTURA: Entregue EXCLUSIVAMENTE as falas faladas (máximo absoluto de 115 palavras para caber em menos de 60 segundos), divididas OBRIGATORIAMENTE em 3 parágrafos separados por linha em branco (Introdução, Desenvolvimento e Conclusão). NÃO inclua legenda nem hashtags.`;
    } else {
      userPrompt = `
TEXTO ATUAL DA LEGENDA:
"""
${originalText}
"""

PEDIDO DE AJUSTE DO USUÁRIO:
${instruction}

Por favor, reescreva a legenda respeitando a essência do texto.
REGRA MANDATÓRIA: MÁXIMO ABSOLUTO DE 100 PALAVRAS no total. Inclua exatamente 5 hashtags no final.`;
    }

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
          let cleaned = text.trim();
          if (isScript) {
            cleaned = cleanScriptToSpokenOnly(cleaned);
          }
          return cleaned;
        }
      } catch (err) {
        console.warn(`[Iasis IA] Erro ao consultar ${model}:`, err);
      }
    }
    return null;
  }

  // ================= 3. MODO GRADE DE PAUTAS (3 COLUNAS: SEG, QUA, SEX) =================
  function renderCalendarView() {
    if (!dom.calendarGrid) return;

    let filteredTasks = data.tasks;
    if (state.activeFilter !== 'all') {
      filteredTasks = filteredTasks.filter(t => t.category === state.activeFilter || t.themeId === state.activeFilter);
    }

    // Se estiver filtrado por um pilar específico, exibe a coluna desse pilar ou todas
    const columnsDef = [
      {
        key: 'segunda',
        themeId: 'iasis_pensa',
        title: 'SEGUNDA • Iasis Pensa',
        badge: '🧠 Reflexões & Personagem',
        colClass: 'col-seg',
        dayIndex: 1
      },
      {
        key: 'quarta',
        themeId: 'reviva_apresenta',
        title: 'QUARTA • Reviva Apresenta',
        badge: '✨ Homenagens & Bastidores',
        colClass: 'col-qua',
        dayIndex: 3
      },
      {
        key: 'sexta',
        themeId: 'iasis_conversa',
        title: 'SEXTA • Iasis Conversa',
        badge: '☕ Cafeteria & Vínculo',
        colClass: 'col-sex',
        dayIndex: 5
      }
    ];

    // Se houver filtro ativo diferente de 'all', mostra só as colunas correspondentes ou todas filtradas
    const columnsToShow = state.activeFilter === 'all' 
      ? columnsDef 
      : columnsDef.filter(c => c.themeId === state.activeFilter);

    const colsHtml = columnsToShow.map(col => {
      const colTasks = filteredTasks.filter(task => {
        // Agrupa estritamente pelo pilar temático correspondente
        return task.themeId === col.themeId || task.category === col.themeId;
      });

      const doneCount = colTasks.filter(t => !!state.completedTasks[t.id]).length;

      const cardsHtml = colTasks.map(task => {
        const idx = data.tasks.findIndex(t => t.id === task.id);
        const isDone = !!state.completedTasks[task.id];
        const taskDate = getTaskCalculatedDate(task);
        const cat = data.categories[task.category] || { label: task.category, color: '#e5c378', icon: '📌' };
        const activeContent = getActiveContent(task);

        const cardDayClass = col.colClass === 'col-seg' ? 'card-seg' : col.colClass === 'col-qua' ? 'card-qua' : 'card-sex';

        return `
          <div class="calendar-card ${cardDayClass} ${isDone ? 'is-completed' : ''}" data-pauta-index="${idx}">
            <div class="card-header-mini">
              <span class="day-chip" style="font-weight: 700;">POST ${idx + 1}</span>
              <span class="time-chip"><i data-lucide="calendar" style="width: 11px; height: 11px;"></i> ${formatDateShort(taskDate)}</span>
              <button class="check-circle-btn ${isDone ? 'checked' : ''}" title="Marcar como gravado" data-task-id="${task.id}">
                ${isDone ? '<i data-lucide="check" style="width: 12px; height: 12px;"></i>' : ''}
              </button>
            </div>
            
            <div class="card-date-mini">${task.pilar || task.scenario || 'Reflexão'}</div>
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

      return `
        <div class="calendar-day-column">
          <div class="calendar-column-header ${col.colClass}">
            <div>
              <div style="font-weight: 700;">${col.title}</div>
              <div style="font-size: 0.68rem; opacity: 0.85; text-transform: none; font-family: var(--font-sans);">${col.badge}</div>
            </div>
            <span style="font-family: var(--font-mono); font-size: 0.72rem; background: rgba(0,0,0,0.4); padding: 3px 8px; border-radius: 999px;">${doneCount}/${colTasks.length}</span>
          </div>

          <div class="calendar-column-cards">
            ${cardsHtml || '<div style="padding: 20px; text-align: center; color: var(--text-secondary); font-size: 0.75rem;">Nenhum post nesta coluna.</div>'}
          </div>
        </div>
      `;
    }).join('');

    dom.calendarGrid.innerHTML = `
      <div class="calendar-columns-container" style="grid-template-columns: repeat(${columnsToShow.length}, 1fr);">
        ${colsHtml}
      </div>
    `;

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
  }

  // ================= 5. DRAWER DE DETALHES =================
  function openTaskDrawer(task) {
    if (!task || !dom.drawerContent) return;
    state.selectedTask = task;
    const activeContent = getActiveContent(task);
    const cat = data.categories[task.category] || { label: task.category, color: '#e5c378', icon: '📌' };
    const isDone = !!state.completedTasks[task.id];
    const taskDate = getTaskCalculatedDate(task);

    dom.drawerContent.innerHTML = `
      <div class="drawer-header-meta">
        <span class="category-pill" style="border: 1px solid var(--border-gold); background: rgba(197, 160, 89, 0.12); color: var(--gold-bright);">
          ${cat.icon} ${task.pilar || cat.label}
        </span>
        <span class="day-chip">POST ${task.pautaNumber || ''} • ${formatDateShort(taskDate)}</span>
      </div>

      <h2 class="drawer-title">${task.title}</h2>
      <p class="drawer-summary">${task.summary}</p>

      <div class="drawer-details-grid">
        <div class="drawer-detail-item">
          <strong>☕ Cenário:</strong> <span>${task.scenario || 'Cafeteria'}</span>
        </div>
        <div class="drawer-detail-item">
          <strong>⏰ Horário:</strong> <span>${task.recommendedTime}</span>
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
          <i data-lucide="${isDone ? 'check-check' : 'clock'}" style="width: 15px; height: 15px;"></i>
          ${isDone 
            ? '<span class="btn-text-default">POST CONCLUÍDO ✓</span><span class="btn-text-hover">REABRIR POST</span>' 
            : '<span class="btn-text-default">POST PENDENTE</span><span class="btn-text-hover">MARCAR COMO CONCLUÍDO</span>'}
        </button>
      </div>
    `;

    const drawerToggleBtn = document.getElementById('drawer-toggle-btn');
    if (drawerToggleBtn) {
      drawerToggleBtn.addEventListener('click', () => {
        toggleTaskCompletion(task.id);
        openTaskDrawer(task);
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
