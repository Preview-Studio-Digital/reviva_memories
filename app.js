// Inicialização dos Ícones Lucide e Interações Dinâmicas
document.addEventListener('DOMContentLoaded', () => {
    // Renderizar Ícones Lucide
    if (window.lucide) {
        lucide.createIcons();
    }

    // Frases do Slide Inicial (Sorteio Aleatório no carregamento)
    const introPhrases = [
        "Quer reviver memórias inesquecíveis?",
        "Que tal um reencontro na memória?",
        "E se a saudade falasse mais uma vez?",
        "E se o amor eterno falasse de novo?",
        "Como seria ouvir a voz da saudade?"
    ];

    let currentIntroPhraseIdx = Math.floor(Math.random() * introPhrases.length);
    const introTitleLine = document.querySelector('.intro-title .title-line-1');
    if (introTitleLine) {
        introTitleLine.textContent = introPhrases[currentIntroPhraseIdx];
    }

    // Clique na Logo - Rola suavemente para o topo (primeiro slide) sem recarregar a página
    document.querySelectorAll('.brand-logo').forEach(logo => {
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            const firstSection = document.querySelector('.intro-section');
            if (firstSection) {
                if (currentIdx === 0) return; // Evita ação se já estiver no topo
                
                document.documentElement.classList.add('disable-snap');
                document.documentElement.classList.add('intro-active'); // Força fundo preto no html
                document.body.classList.add('intro-active'); // Força fundo preto no body imediatamente
                firstSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                currentIdx = 0;
                
                // Desativa a classe active de todos os links de navegação
                document.querySelectorAll('.navbar .nav-links a').forEach(link => {
                    link.classList.remove('active');
                });
                
                setTimeout(() => {
                    document.documentElement.classList.remove('disable-snap');
                }, 300);
            }
        });
    });

    // --- CONTROLE DE DIREÇÃO DE ROLAGEM & ANIMAÇÃO EXCLUSIVA DOS CARDS ---
    let currentScrollDirection = 'down';
    let lastScrollY = window.pageYOffset || document.documentElement.scrollTop;

    // Detecta direção pelo Scroll Nativo da Página
    window.addEventListener('scroll', () => {
        const currentY = window.pageYOffset || document.documentElement.scrollTop;
        if (currentY > lastScrollY + 2) {
            currentScrollDirection = 'down';
        } else if (currentY < lastScrollY - 2) {
            currentScrollDirection = 'up';
        }
        lastScrollY = currentY;
    }, { passive: true });

    // Detecta direção pela Roda do Mouse (Wheel)
    window.addEventListener('wheel', (e) => {
        if (e.deltaY > 0) {
            currentScrollDirection = 'down';
        } else if (e.deltaY < 0) {
            currentScrollDirection = 'up';
        }
    }, { passive: true });

    // Detecta direção pelo Toque Touch em dispositivos móveis
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches[0]) {
            touchStartY = e.touches[0].clientY;
        }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches[0]) {
            const touchDiff = touchStartY - e.touches[0].clientY;
            if (Math.abs(touchDiff) > 6) {
                currentScrollDirection = touchDiff > 0 ? 'down' : 'up';
            }
        }
    }, { passive: true });

    // Detecta direção pelas teclas de navegação
    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
            currentScrollDirection = 'down';
        } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) {
            currentScrollDirection = 'up';
        }
    }, { passive: true });

    // Função para animar exclusivamente os cards do slide conforme a direção
    function animateSectionCards(section, direction = currentScrollDirection) {
        if (!section) return;
        const cards = section.querySelectorAll('.step-card, .case-card, .testimonial-card, .plan-card');
        if (!cards || cards.length === 0) return;

        // Rolando para baixo: surgem de baixo para cima (startY = 70px)
        // Rolando para cima: surgem de cima para baixo (startY = -70px)
        const startY = (direction === 'up') ? -70 : 70;

        if (window.gsap) {
            gsap.killTweensOf(cards);
            gsap.fromTo(cards,
                {
                    y: startY,
                    opacity: 0
                },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.85,
                    stagger: 0.09,
                    ease: 'power3.out',
                    clearProps: 'transform' // Libera transform para os efeitos de :hover funcionarem perfeitamente
                }
            );
        }
    }

    // Função para resetar o estado dos cards quando o slide sai da visão
    function resetSectionCards(section) {
        if (!section) return;
        const cards = section.querySelectorAll('.step-card, .case-card, .testimonial-card, .plan-card');
        if (!cards || cards.length === 0) return;

        if (window.gsap) {
            gsap.killTweensOf(cards);
            gsap.set(cards, { opacity: 0 });
        }
    }

    // Detectar dinamicamente a lista de slides de acordo com o dispositivo (Desktop vs Mobile)
    let sections;
    let currentIdx = 0;
    let observer;

    function updateSectionsList() {
        if (observer) {
            observer.disconnect();
        }

        sections = document.querySelectorAll('.intro-section, .hero-section, .how-it-works, .use-cases, .testimonials, .contrate-section, .faq-section');

        // Sincroniza dinamicamente a classe active no cabeçalho
        function updateActiveNavLink(sectionId) {
            document.querySelectorAll('.navbar .nav-links a').forEach(link => {
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        }

        // Re-sincronizar o IntersectionObserver
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.01 // Dispara instantaneamente no primeiro pixel que entra na tela
        };

        observer = new IntersectionObserver((entries) => {
            // Se estamos rolando via clique (menu), ignora o observer para não cancelar a animação imediata
            if (document.documentElement.classList.contains('disable-snap')) {
                return;
            }

            entries.forEach(entry => {
                const title = entry.target.querySelector('.handwritten-title');
                if (entry.isIntersecting) {
                    const index = Array.from(sections).indexOf(entry.target);
                    if (index !== -1) {
                        currentIdx = index;
                        const sectionId = entry.target.getAttribute('id');
                        if (sectionId) {
                            updateActiveNavLink(sectionId);
                        }
                    }

                    // Se foi rolagem manual, inicia imediatamente
                    if (title) {
                        title.style.animation = 'none';
                        title.offsetHeight; // Reflow
                        title.style.animation = 'revealStaticText 1.5s linear forwards';
                    }

                    // Dispara a animação direcional dos cards da seção que entrou
                    animateSectionCards(entry.target, currentScrollDirection);
                } else {
                    // Esconde o texto dos slides que saíram da tela para reiniciar
                    if (title) {
                        title.style.animation = 'none';
                        title.style.clipPath = 'inset(0 100% 0 0)';
                    }

                    // Reseta os cards dos slides que saíram da tela
                    resetSectionCards(entry.target);
                }
            });

            // Gerenciar classe de fundo ativo do slide inicial e do último slide (FAQ)
            const activeSection = sections[currentIdx];
            if (activeSection && (activeSection.classList.contains('intro-section') || activeSection.classList.contains('faq-section'))) {
                document.documentElement.classList.add('intro-active');
                document.body.classList.add('intro-active');
            } else {
                document.documentElement.classList.remove('intro-active');
                document.body.classList.remove('intro-active');
            }
        }, observerOptions);

        sections.forEach(sec => observer.observe(sec));
    }


    updateSectionsList();
    window.addEventListener('resize', updateSectionsList);

    // Inicializa os cards da seção visível inicialmente (caso comece fora do topo)
    if (sections && sections[currentIdx]) {
        animateSectionCards(sections[currentIdx], 'down');
    }

    function goToSlide(index) {
        if (!sections || index < 0 || index >= sections.length) return;
        currentScrollDirection = (index > currentIdx) ? 'down' : 'up';
        currentIdx = index;
        sections[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
        const sectionId = sections[index].getAttribute('id');
        if (sectionId) {
            document.querySelectorAll('.navbar .nav-links a').forEach(link => {
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        }
        animateSectionCards(sections[index], currentScrollDirection);
    }

    // Smooth scroll para links internos e sincronização do slide ativo
    document.querySelectorAll('a[href^="#"]:not(.brand-logo)').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            // Se o link já está ativo, ignora para não reiniciar animações
            if (this.classList.contains('active')) return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Temporariamente desativar scroll snap para evitar conflitos na animação
                document.documentElement.classList.add('disable-snap');
                
                // Sincroniza o índice do slide ativo e calcula a direção
                let targetIdx = -1;
                sections.forEach((sec, idx) => {
                    if (sec === targetElement || targetElement.contains(sec)) {
                        if (targetIdx === -1) targetIdx = idx;
                    }
                });
                if (targetIdx !== -1) {
                    if (targetIdx > currentIdx) {
                        currentScrollDirection = 'down';
                    } else if (targetIdx < currentIdx) {
                        currentScrollDirection = 'up';
                    }
                    currentIdx = targetIdx;
                }

                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Dispara a animação no clique instantaneamente (atraso zero)
                const targetTitle = targetElement.querySelector('.handwritten-title');
                if (targetTitle) {
                    targetTitle.style.animation = 'none';
                    targetTitle.offsetHeight; // Reflow
                    targetTitle.style.animation = 'revealStaticText 1.5s linear forwards';
                }
                
                // Dispara a animação direcional dos cards no clique do menu
                animateSectionCards(targetElement, currentScrollDirection);

                // Sincroniza a classe active do menu no clique
                const sectionId = targetElement.getAttribute('id');
                if (sectionId) {
                    document.querySelectorAll('.navbar .nav-links a').forEach(link => {
                        if (link.getAttribute('href') === `#${sectionId}`) {
                            link.classList.add('active');
                        } else {
                            link.classList.remove('active');
                        }
                    });
                }

                // Apenas reativa o snap após o término do scroll nativo
                setTimeout(() => {
                    document.documentElement.classList.remove('disable-snap');
                }, 300);
            }
        });
    });

    // Modal de Vídeo Global Logic (Suporta iframe YouTube e arquivo local WebM/MP4)
    const videoModal = document.getElementById('videoModal');
    const videoPlayer = document.getElementById('videoPlayer');
    const localVideoPlayer = document.getElementById('localVideoPlayer');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const closeModalBottomBtn = document.getElementById('closeModalBottomBtn');
    let originalVolume = 1;
    let fadeInterval = null;

    function fadeAudioVolume(targetVolume, duration = 400) {
        const bgAudio = document.getElementById('bgAudio');
        if (!bgAudio) return;

        if (fadeInterval) clearInterval(fadeInterval);
        
        const startVolume = bgAudio.volume;
        const steps = 20;
        const stepTime = duration / steps;
        const volumeDiff = targetVolume - startVolume;
        let currentStep = 0;

        fadeInterval = setInterval(() => {
            currentStep++;
            bgAudio.volume = Math.max(0, Math.min(1, startVolume + (volumeDiff * (currentStep / steps))));
            if (currentStep >= steps) {
                clearInterval(fadeInterval);
                fadeInterval = null;
            }
        }, stepTime);
    }

    function startVideoFadeOut() {
        if (!localVideoPlayer) return;
        
        // Pausar o áudio do vídeo imediatamente ao fechar, sem delay
        localVideoPlayer.pause();

        // Desvanecer o modal visualmente (mantendo o fade out de 3s no CSS)
        videoModal.classList.remove('active');
        document.body.classList.remove('video-active');
        
        // Restaurar volume da música de fundo imediatamente
        const bgAudio = document.getElementById('bgAudio');
        if (bgAudio) {
            bgAudio.volume = originalVolume;
        }

        // Aguardar o término do fade visual (3s) para remover e resetar o src do vídeo
        setTimeout(() => {
            stopVideos();
        }, 3000);
    }

    function openVideoModal(videoUrl) {
        const bgAudio = document.getElementById('bgAudio');
        if (bgAudio) {
            if (!bgAudio.paused) {
                originalVolume = bgAudio.volume || 1;
                bgAudio.volume = 0.25;
            } else {
                originalVolume = 1;
                bgAudio.volume = 0.25;
                bgAudio.play().catch(err => console.log("Audio play failed on video modal open:", err));
            }
        }

        stopVideos();
        document.body.classList.add('video-active');

        if (videoUrl.endsWith('.webm') || videoUrl.endsWith('.mp4') || videoUrl.endsWith('.ogg')) {
            if (localVideoPlayer) {
                localVideoPlayer.src = videoUrl;
                localVideoPlayer.style.display = 'block';
                localVideoPlayer.play().catch(err => console.log("Autoplay bloqueado:", err));

                // Permitir alternar Play/Pause clicando no vídeo
                localVideoPlayer.onclick = () => {
                    if (localVideoPlayer.paused) {
                        localVideoPlayer.play();
                    } else {
                        localVideoPlayer.pause();
                    }
                };
                
                // Monitorar o fim real do vídeo para acionar o fechamento
                let autoFadeTriggered = false;

                const handleEnded = () => {
                    if (!autoFadeTriggered) {
                        autoFadeTriggered = true;
                        startVideoFadeOut();
                    }
                    localVideoPlayer.removeEventListener('ended', handleEnded);
                };

                localVideoPlayer.addEventListener('ended', handleEnded);
            }
        } else {
            if (videoPlayer) {
                videoPlayer.src = videoUrl;
                videoPlayer.style.display = 'block';
            }
        }
        
        requestAnimationFrame(() => {
            videoModal.classList.add('active');
            videoModal.focus();
            
            // Dispara resize para atualizar o tamanho do canvas da galáxia que estava oculto (0x0)
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 100);
        });
    }

    function closeVideoModal() {
        if (!videoModal.classList.contains('active')) return;
        startVideoFadeOut();
    }

    function stopVideos() {
        if (videoPlayer) {
            videoPlayer.src = '';
            videoPlayer.style.display = 'none';
        }
        if (localVideoPlayer) {
            localVideoPlayer.pause();
            localVideoPlayer.src = '';
            localVideoPlayer.style.display = 'none';
        }
    }

    // Lógica de Persistência dos Badges de Vídeos Assistidos (LocalStorage)
    document.querySelectorAll('.video-new-badge').forEach(badge => {
        const videoId = badge.getAttribute('data-video-id');
        if (localStorage.getItem(`watched-${videoId}`)) {
            badge.classList.add('watched');
        }
    });

    if (videoModal) {
        // Abrir Modal
        document.querySelectorAll('.watch-video-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Obter ID do vídeo para persistir o estado assistido
                const videoId = button.getAttribute('data-video-id');
                if (videoId) {
                    localStorage.setItem(`watched-${videoId}`, 'true');
                    const badge = document.querySelector(`.video-new-badge[data-video-id="${videoId}"]`);
                    if (badge) {
                        badge.classList.add('watched');
                    }
                }

                const videoUrl = button.getAttribute('data-video-url');
                if (videoUrl) {
                    openVideoModal(videoUrl);
                }
            });
        });

        // Fechar Modal pelo Botão Superior X
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', closeVideoModal);
        }

        // Fechar Modal pelo Botão Inferior "Fechar Vídeo"
        if (closeModalBottomBtn) {
            closeModalBottomBtn.addEventListener('click', closeVideoModal);
        }

        // Fechar modal ao clicar em qualquer link da navbar principal (que fica sobreposta ao player)
        document.querySelectorAll('.navbar .nav-links a, .navbar .brand-logo').forEach(link => {
            link.addEventListener('click', () => {
                if (videoModal.classList.contains('active')) {
                    closeVideoModal();
                }
            });
        });

        // Fechar ao clicar no fundo escuro do Modal
        videoModal.addEventListener('click', (e) => {
            if (e.target === videoModal) {
                closeVideoModal();
            }
        });

        // Fechar com a Tecla ESC (Escape) - Escuta global no window
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.key === 'Esc') {
                closeVideoModal();
            }
        });
    }

    // Toggle do Menu Hambúrguer Mobile com Overlay de Desfoque
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');
    const mobileMenuBackdrop = document.getElementById('mobileMenuBackdrop');

    function closeMobileMenu() {
        if (navLinks) navLinks.classList.remove('active');
        if (mobileMenuBackdrop) mobileMenuBackdrop.classList.remove('active');
    }

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = navLinks.classList.toggle('active');
            if (mobileMenuBackdrop) {
                if (isActive) {
                    mobileMenuBackdrop.classList.add('active');
                } else {
                    mobileMenuBackdrop.classList.remove('active');
                }
            }
        });

        // Fechar o menu ao clicar em qualquer opção de seção
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });

        // Fechar o menu ao clicar no backdrop desfocado
        if (mobileMenuBackdrop) {
            mobileMenuBackdrop.addEventListener('click', closeMobileMenu);
        }

        // Fechar o menu ao clicar fora dele
        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                closeMobileMenu();
            }
        });
    }

    // Lógica do Player de Áudio Fixo Minimalista com Shuffle sem Repetição
    const playlist = [
        'bg_music.mp3',
        'bg_music_02.mp3',
        'bg_music_03.mp3'
    ];

    const bgAudio = document.getElementById('bgAudio');
    let currentTrack = '';
    
    // Função para escolher a próxima música aleatória garantindo que NUNCA repita a anterior
    function getNextRandomTrack() {
        const availableTracks = playlist.filter(track => track !== currentTrack);
        if (availableTracks.length === 0) return playlist[0];
        const nextTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)];
        return nextTrack;
    }

    if (bgAudio) {
        bgAudio.loop = false; // Desativa repetição interna para disparar o evento 'ended'
        // Escolhe uma música aleatoriamente da playlist no carregamento/recarregamento da página
        currentTrack = playlist[Math.floor(Math.random() * playlist.length)];
        bgAudio.src = currentTrack;
        bgAudio.load();
    }

    const musicWaves = document.querySelectorAll('.music-wave-toggle');
    
    // Gera dinamicamente 45 barras (strokes) em cada container para preencher toda a largura da tela
    musicWaves.forEach(wave => {
        wave.innerHTML = '';
        for (let i = 0; i < 45; i++) {
            const span = document.createElement('span');
            span.className = 'stroke';
            wave.appendChild(span);
        }
    });

    if (bgAudio) {
        bgAudio.addEventListener('play', () => updateAudioUI(true));
        bgAudio.addEventListener('pause', () => updateAudioUI(false));
        
        // Quando a música atual acabar, escolhe uma música DIFERENTE da atual e toca automaticamente
        bgAudio.addEventListener('ended', () => {
            currentTrack = getNextRandomTrack();
            bgAudio.src = currentTrack;
            bgAudio.load();
            const isVideoActive = document.body.classList.contains('video-active');
            bgAudio.volume = isVideoActive ? 0.25 : 1.0;
            bgAudio.play().then(() => {
                updateAudioUI(true);
            }).catch(err => {
                console.log("Auto-play next track failed:", err);
            });
        });

        function updateAudioUI(isPlaying) {
            musicWaves.forEach(wave => {
                if (isPlaying) {
                    wave.classList.add('playing');
                } else {
                    wave.classList.remove('playing');
                }
            });
        }

        // Adiciona listeners para todas as ondas sonoras que controlam a música
        musicWaves.forEach(wave => {
            wave.addEventListener('click', (e) => {
                e.stopPropagation();
                if (bgAudio.paused) {
                    const isVideoActive = document.body.classList.contains('video-active');
                    bgAudio.volume = isVideoActive ? 0.25 : 1.0;
                    bgAudio.play().then(() => {
                        updateAudioUI(true);
                    }).catch(err => {
                        console.log("Play failed:", err);
                    });
                } else {
                    bgAudio.pause();
                }
            });
        });

        const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

        function playMusic() {
            if (bgAudio.paused) {
                const isVideoActive = document.body.classList.contains('video-active');
                bgAudio.volume = isVideoActive ? 0.25 : 1.0;
                bgAudio.play().then(() => {
                    updateAudioUI(true);
                }).catch(err => {
                    console.log("Audio play waiting for interaction:", err);
                });
            }
        }

        if (isMobile) {
            // Qualquer toque ou clique na tela no mobile inicia a música
            const handleMobileInteraction = () => {
                playMusic();
                document.removeEventListener('touchstart', handleMobileInteraction);
                document.removeEventListener('click', handleMobileInteraction);
            };
            document.addEventListener('touchstart', handleMobileInteraction, { passive: true });
            document.addEventListener('click', handleMobileInteraction);
        } else {
            // No desktop, a música também começa a tocar se clicar em assistir vídeo
            document.querySelectorAll('.watch-video-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    playMusic();
                });
            });
        }
    }

    // Interatividade da Tabela de Planos (Seleção de Formato e Upsell Multiformato)
    function selectPlanCard(selectedCard) {
        document.querySelectorAll('.plan-card').forEach(c => {
            if (c !== selectedCard) {
                c.classList.remove('featured');
                const checkbox = c.querySelector('.upsell-checkbox');
                if (checkbox && checkbox.checked) {
                    checkbox.checked = false;
                    // Força a atualização do preço e estado visual do checkbox desmarcado
                    checkbox.dispatchEvent(new Event('change'));
                }
            }
        });
        selectedCard.classList.add('featured');
    }
    document.querySelectorAll('.plan-card').forEach(card => {
        // Seleção do Card ao Clicar (Torna o plano selecionado/featured)
        card.addEventListener('click', (e) => {
            // Se clicar em elementos de controle internos (botões, seletores, checkbox), ignora a seleção do card
            if (e.target.closest('.plan-buy-btn') || e.target.closest('.format-btn') || e.target.closest('.upsell-checkbox-container')) {
                return;
            }
            selectPlanCard(card);
        });

        const formatBtns = card.querySelectorAll('.format-btn');
        const upsellCheckbox = card.querySelector('.upsell-checkbox');
        const priceDisplay = card.querySelector('.price-display');
        const amountSpan = priceDisplay ? priceDisplay.querySelector('.amount') : null;
        const centsSpan = priceDisplay ? priceDisplay.querySelector('.cents') : null;
        const subtitleSpan = card.querySelector('.price-subtitle');

        if (!priceDisplay || !amountSpan) return;

        const basePrice = parseFloat(priceDisplay.getAttribute('data-base'));
        const upsellPrice = parseFloat(priceDisplay.getAttribute('data-upsell'));

        // Toggle dos botões de formato (Horizontal vs Vertical)
        formatBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                // Seleciona automaticamente este card de plano e desmarca outros upsells
                selectPlanCard(card);

                formatBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const format = btn.getAttribute('data-format');
                // Atualizar dinamicamente o texto do Upsell com base no formato primário selecionado
                const upsellTitle = card.querySelector('.upsell-text strong');
                if (upsellTitle) {
                    if (format === 'horizontal') {
                        upsellTitle.textContent = 'Adicionar formato Vertical (+50%)';
                    } else {
                        upsellTitle.textContent = 'Adicionar formato Horizontal (+50%)';
                    }
                }

                // Atualizar legenda com o formato escolhido (se o addon multiformato não estiver ativo)
                if (subtitleSpan && (!upsellCheckbox || !upsellCheckbox.checked)) {
                    const formatName = format === 'horizontal' ? 'Horizontal' : 'Vertical';
                    subtitleSpan.textContent = `Formato [${formatName}]`;
                }
            });
        });

        // Atualizar preço dinamicamente ao marcar/desmarcar o Upsell Multiformato
        if (upsellCheckbox) {
            upsellCheckbox.addEventListener('change', (e) => {
                const activeFormatBtn = card.querySelector('.format-btn.active');
                const format = activeFormatBtn ? activeFormatBtn.getAttribute('data-format') : 'horizontal';
                const formatName = format === 'horizontal' ? 'Horizontal' : 'Vertical';

                // Se foi um evento simulado (desmarcando por causa da troca de card), evita loop infinito
                if (e.isTrigger || !upsellCheckbox.checked) {
                    // apenas atualiza o preço para o original
                    const formatted = basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    const parts = formatted.split(',');
                    amountSpan.textContent = parts[0];
                    if (centsSpan) centsSpan.textContent = ',00';
                    if (subtitleSpan) subtitleSpan.textContent = `Formato [${formatName}]`;
                    return;
                }

                // Seleciona automaticamente este card de plano e desmarca outros upsells
                selectPlanCard(card);

                if (upsellCheckbox.checked) {
                    const totalPrice = basePrice + upsellPrice;
                    const formatted = totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    const parts = formatted.split(',');
                    amountSpan.textContent = parts[0];
                    if (centsSpan) centsSpan.textContent = ',' + parts[1];
                    if (subtitleSpan) subtitleSpan.textContent = 'Formatos Horizontal e Vertical';
                } else {
                    const formatted = basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    const parts = formatted.split(',');
                    amountSpan.textContent = parts[0];
                    if (centsSpan) centsSpan.textContent = ',00';
                    if (subtitleSpan) subtitleSpan.textContent = `Formato [${formatName}]`;
                }
            });
        }
    });

    // Interatividade do FAQ Accordion (Balão Flutuante Sobreposto)
    document.querySelectorAll('.faq-question').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const faqItem = button.parentElement;
            const isOpen = faqItem.classList.contains('active');
            
            // Fecha todos os outros itens
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Se o item clicado não estava aberto, abre-o
            if (!isOpen) {
                faqItem.classList.add('active');
            }
        });
    });

    // Fecha o balão se clicar fora dos itens do FAQ
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.faq-item')) {
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });
        }
    });


    // Inicialização do Fundo de Galáxia WebGL (OGL) adaptado do @omnedia/ngx-galaxy
    function initGalaxy(ctn, mouseInteraction = true) {
        if (!ctn || !window.ogl) return;

        const { Renderer, Program, Mesh, Triangle } = window.ogl;

        const renderer = new Renderer({
            alpha: true,
            premultipliedAlpha: false
        });
        const gl = renderer.gl;
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0, 0, 0, 0);

        gl.canvas.style.width = '100%';
        gl.canvas.style.height = '100%';

        while (ctn.firstChild) {
            ctn.removeChild(ctn.firstChild);
        }
        ctn.appendChild(gl.canvas);

        const vert = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

        const frag = `precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform vec2 uFocal;
uniform vec2 uRotation;
uniform float uStarSpeed;
uniform float uDensity;
uniform float uHueShift;
uniform float uSpeed;
uniform vec2 uMouse;
uniform float uGlowIntensity;
uniform float uSaturation;
uniform bool uMouseRepulsion;
uniform float uTwinkleIntensity;
uniform float uRotationSpeed;
uniform float uRepulsionStrength;
uniform float uMouseActiveFactor;
uniform float uAutoCenterRepulsion;
uniform bool uTransparent;

varying vec2 vUv;

#define NUM_LAYER 4.0
#define STAR_COLOR_CUTOFF 0.2
#define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)
#define PERIOD 3.0

float Hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float tri(float x) {
  return abs(fract(x) * 2.0 - 1.0);
}

float tris(float x) {
  float t = fract(x);
  return 1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0));
}

float trisn(float x) {
  float t = fract(x);
  return 2.0 * (1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0))) - 1.0;
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float Star(vec2 uv, float flare) {
  float d = length(uv);
  float m = (0.05 * uGlowIntensity) / d;
  float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * flare * uGlowIntensity;
  uv *= MAT45;
  rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * 0.3 * flare * uGlowIntensity;
  m *= smoothstep(1.0, 0.2, d);
  return m;
}

vec3 StarLayer(vec2 uv) {
  vec3 col = vec3(0.0);

  vec2 gv = fract(uv) - 0.5;
  vec2 id = floor(uv);

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 si = id + vec2(float(x), float(y));
      float seed = Hash21(si);
      float size = fract(seed * 345.32);
      float glossLocal = tri(uStarSpeed / (PERIOD * seed + 1.0));
      float flareSize = smoothstep(0.9, 1.0, size) * glossLocal;

      float red = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 1.0)) + STAR_COLOR_CUTOFF;
      float blu = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 3.0)) + STAR_COLOR_CUTOFF;
      float grn = min(red, blu) * seed;
      vec3 base = vec3(red, grn, blu);

      float hue = atan(base.g - base.r, base.b - base.r) / (2.0 * 3.14159) + 0.5;
      hue = fract(hue + uHueShift / 360.0);
      float sat = length(base - vec3(dot(base, vec3(0.299, 0.587, 0.114)))) * uSaturation;
      float val = max(max(base.r, base.g), base.b);
      base = hsv2rgb(vec3(hue, sat, val));

      vec2 pad = vec2(tris(seed * 34.0 + uTime * uSpeed / 10.0), tris(seed * 38.0 + uTime * uSpeed / 30.0)) - 0.5;

      float star = Star(gv - offset - pad, flareSize);
      vec3 color = base;

      float twinkle = trisn(uTime * uSpeed + seed * 6.2831) * 0.5 + 1.0;
      twinkle = mix(1.0, twinkle, uTwinkleIntensity);
      star *= twinkle;

      col += star * size * color;
    }
  }

  return col;
}

void main() {
  vec2 focalPx = uFocal * uResolution.xy;
  vec2 uv = (vUv * uResolution.xy - focalPx) / uResolution.y;

  vec2 mouseNorm = uMouse - vec2(0.5);

  if (uAutoCenterRepulsion > 0.0) {
    vec2 centerUV = vec2(0.0, 0.0);
    float centerDist = length(uv - centerUV);
    vec2 repulsion = normalize(uv - centerUV) * (uAutoCenterRepulsion / (centerDist + 0.1));
    uv += repulsion * 0.05;
  } else if (uMouseRepulsion) {
    vec2 mousePosUV = (uMouse * uResolution.xy - focalPx) / uResolution.y;
    float mouseDist = length(uv - mousePosUV);
    vec2 repulsion = normalize(uv - mousePosUV) * (uRepulsionStrength / (mouseDist + 0.1));
    uv += repulsion * 0.05 * uMouseActiveFactor;
  } else {
    vec2 mouseOffset = mouseNorm * 0.1 * uMouseActiveFactor;
    uv += mouseOffset;
  }

  float autoRotAngle = uTime * uRotationSpeed;
  mat2 autoRot = mat2(cos(autoRotAngle), -sin(autoRotAngle), sin(autoRotAngle), cos(autoRotAngle));
  uv = autoRot * uv;

  uv = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x) * uv;

  vec3 col = vec3(0.0);

  for (float i = 0.0; i < 1.0; i += 1.0 / NUM_LAYER) {
    float depth = fract(i + uStarSpeed * uSpeed);
    float scale = mix(20.0 * uDensity, 0.5 * uDensity, depth);
    float fade = depth * smoothstep(1.0, 0.9, depth);
    col += StarLayer(uv * scale + i * 453.32) * fade;
  }

  if (uTransparent) {
    float alpha = length(col);
    alpha = smoothstep(0.0, 0.3, alpha);
    alpha = min(alpha, 1.0);
    gl_FragColor = vec4(col, alpha);
  } else {
    gl_FragColor = vec4(col, 1.0);
  }
}`;

        const mouseInteractionVal = mouseInteraction;
        const mouseRepulsion = false;
        const density = 0.18;
        const glowIntensity = 0.25;
        const saturation = 0.9;
        const hueShift = 270.0;

        const uniforms = {
            uTime: { value: 0 },
            uResolution: { value: [gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height] },
            uFocal: { value: [0.5, 0.5] },
            uRotation: { value: [1.0, 0.0] },
            uStarSpeed: { value: 0.5 },
            uDensity: { value: density },
            uHueShift: { value: hueShift },
            uSpeed: { value: 1.0 },
            uMouse: { value: [0.5, 0.5] },
            uGlowIntensity: { value: glowIntensity },
            uSaturation: { value: saturation },
            uMouseRepulsion: { value: mouseRepulsion },
            uTwinkleIntensity: { value: 0.3 },
            uRotationSpeed: { value: 0.1 },
            uRepulsionStrength: { value: 2.0 },
            uMouseActiveFactor: { value: 0.0 },
            uAutoCenterRepulsion: { value: 0.0 },
            uTransparent: { value: true }
        };

        const geometry = new Triangle(gl);
        const program = new Program(gl, {
            vertex: vert,
            fragment: frag,
            uniforms
        });
        const mesh = new Mesh(gl, { geometry, program });

        const updatePlacement = () => {
            if (!ctn) return;
            renderer.dpr = Math.min(window.devicePixelRatio, 2);
            const wCSS = ctn.clientWidth;
            const hCSS = ctn.clientHeight;
            renderer.setSize(wCSS, hCSS);
            const w = gl.canvas.width;
            const h = gl.canvas.height;
            uniforms.uResolution.value = [w, h, w / h];
        };

        const targetMousePos = { x: 0.5, y: 0.5 };
        const smoothMousePos = { x: 0.5, y: 0.5 };
        let targetMouseActive = 0.0;
        let smoothMouseActive = 0.0;

        if (mouseInteractionVal) {
            window.addEventListener('pointermove', (e) => {
                const rect = ctn.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = 1.0 - (e.clientY - rect.top) / rect.height;
                targetMousePos.x = x;
                targetMousePos.y = y;
                targetMouseActive = 1.0;
            }, { passive: true });

            window.addEventListener('pointerleave', () => {
                targetMouseActive = 0.0;
            }, { passive: true });
        }

        let animationFrameId;
        const loop = (t) => {
            animationFrameId = requestAnimationFrame(loop);

            // OTIMIZAÇÃO DE PERFORMANCE: Pausa a renderização WebGL do canvas inativo para economizar GPU e evitar travamento do vídeo
            const isVideoActive = document.body.classList.contains('video-active');
            if (ctn.id === 'galaxyBg' && isVideoActive) return; // Se o modal está aberto, pausa a galáxia de fundo
            if (ctn.id === 'videoGalaxyBg' && !isVideoActive) return; // Se o modal está fechado, pausa a galáxia do modal

            const timeSeconds = t * 0.001;
            uniforms.uTime.value = timeSeconds;
            uniforms.uStarSpeed.value = (timeSeconds * 0.5) / 10.0;

            const lerp = 0.05;
            smoothMousePos.x += (targetMousePos.x - smoothMousePos.x) * lerp;
            smoothMousePos.y += (targetMousePos.y - smoothMousePos.y) * lerp;
            smoothMouseActive += (targetMouseActive - smoothMouseActive) * lerp;

            uniforms.uMouse.value[0] = smoothMousePos.x;
            uniforms.uMouse.value[1] = smoothMousePos.y;
            uniforms.uMouseActiveFactor.value = smoothMouseActive;

            try {
                renderer.render({ scene: mesh });
            } catch (error) {
                console.warn('WebGL rendering error:', error);
            }
        };

        window.addEventListener('resize', updatePlacement);
        updatePlacement();
        animationFrameId = requestAnimationFrame(loop);
    }

    const galaxyBg = document.getElementById('galaxyBg');
    if (galaxyBg) initGalaxy(galaxyBg, true);

    const videoGalaxyBg = document.getElementById('videoGalaxyBg');
    if (videoGalaxyBg) initGalaxy(videoGalaxyBg, false);

    // Inicialização da Galeria de Acordeão com GSAP
    function initAccordionGallery() {
        const gallery = document.getElementById('heroAccordion');
        if (!gallery) return;

        // Imagens do usuário comprimidas com seus respectivos títulos e ocasiões fixas
        const imagePool = [
            { src: 'gallery_homem_01.jpg', label: 'Pai - Homenagem para Aniversário' },
            { src: 'gallery_homem_02.jpg', label: 'Avô - Homenagem para Formatura' },
            { src: 'gallery_homem_03.jpg', label: 'Irmão - Homenagem para Casamento' },
            { src: 'gallery_homem_04.jpg', label: 'Filho - Homenagem para Aniversário' },
            { src: 'gallery_mulher_01.jpg', label: 'Mãe - Homenagem para Aniversário' },
            { src: 'gallery_mulher_02.jpg', label: 'Mãe - Homenagem para Formatura' },
            { src: 'gallery_mulher_03.jpg', label: 'Tia - Homenagem Especial' },
            { src: 'gallery_mulher_04.jpg', label: 'Avó - Homenagem para Batizado' }
        ];

        // Embaralha a pool de imagens (cada uma carrega seu próprio vínculo fixo de texto)
        const shuffledImages = [...imagePool].sort(() => Math.random() - 0.5);

        // Preenche o acordeão com as imagens aleatórias antes de aplicar o GSAP
        const tempPanels = gallery.querySelectorAll('.ag-panel');

        tempPanels.forEach((panel, index) => {
            if (index < shuffledImages.length) {
                const imgData = shuffledImages[index];
                const imgEl = panel.querySelector('.ag-panel__media img');
                const labelTextEl = panel.querySelector('.ag-panel__text');
                
                if (imgEl) {
                    imgEl.src = imgData.src;
                    imgEl.alt = imgData.label;
                }
                if (labelTextEl) {
                    labelTextEl.textContent = imgData.label;
                }
                panel.setAttribute('aria-label', imgData.label);
            }
        });

        const panels = gallery.querySelectorAll('.ag-panel');
        const count = panels.length;
        let activeIndex = 3; // Índice padrão (centro de 7 itens)

        const gap = 10;
        const expandRatio = 0.52;
        const duration = 0.6;
        const ease = 'power3.out';
        const parallax = 0.5;
        const tilt = 8;
        const stagger = 0.06;
        const grayscale = true;
        const showLabels = true;

        let mediaSize = 320;
        let tl = null;

        function applyLayout(animate = true) {
            if (!panels.length) return;

            const r = Math.min(Math.max(expandRatio, 0.2), 0.9);
            const grow = count > 1 ? (r * (count - 1)) / (1 - r) : 1;

            if (tl) tl.kill();
            
            const dur = animate ? duration : 0;
            tl = gsap.timeline();

            panels.forEach((panel, i) => {
                const isActive = i === activeIndex;
                const media = panel.querySelector('.ag-panel__media');
                const overlay = panel.querySelector('.ag-panel__overlay');
                const bar = panel.querySelector('.ag-panel__bar');
                const text = panel.querySelector('.ag-panel__text');

                // Ângulo de inclinação 3D
                const rot = isActive ? 0 : (i < activeIndex ? tilt : -tilt);

                // Anima o painel do acordeão (flex-grow e rotação no eixo Y)
                tl.to(panel, { 
                    flexGrow: isActive ? grow : 1, 
                    rotateY: rot, 
                    duration: dur, 
                    ease: ease 
                }, 0);

                if (isActive) {
                    panel.classList.add('ag-panel--active');
                } else {
                    panel.classList.remove('ag-panel--active');
                }

                // Anima a imagem interna (efeito paralaxe, escala e escala de cinza)
                if (media) {
                    const drift = Math.max(-1.5, Math.min(1.5, activeIndex - i));
                    const shift = drift * parallax * mediaSize * 0.06;
                    const gray = grayscale ? (isActive ? 0 : 1) : 0;
                    
                    // Aplicamos a animação direta da propriedade de filtro CSS
                    const filterVal = `grayscale(${gray}) brightness(${isActive ? 1 : 0.65})`;
                    
                    tl.to(media, {
                        xPercent: -50,
                        yPercent: -50,
                        x: isActive ? 0 : shift,
                        y: 0,
                        filter: filterVal,
                        duration: dur,
                        ease: ease
                    }, 0);

                    // Anima o overlay de escurecimento dos painéis inativos
                    if (overlay) {
                        tl.to(overlay, {
                            opacity: isActive ? 0.2 : 0.7,
                            duration: dur,
                            ease: ease
                        }, 0);
                    }
                }

                // Anima as etiquetas (barra lateral e texto do painel ativo)
                if (showLabels && bar && text) {
                    if (isActive) {
                        tl.to([bar, text], { 
                            opacity: 1, 
                            x: 0, 
                            duration: dur, 
                            ease: ease, 
                            stagger: stagger 
                        }, 0);
                    } else {
                        tl.to([bar, text], { 
                            opacity: 0, 
                            x: -14, 
                            duration: dur * 0.6, 
                            ease: ease 
                        }, 0);
                    }
                }
            });
        }

        function measure() {
            const rect = gallery.getBoundingClientRect();
            const total = rect.width;
            const usable = Math.max(total - gap * (count - 1), 120);
            mediaSize = Math.max(140, usable * Math.min(Math.max(expandRatio, 0.2), 0.9) * 1.22);
            gallery.style.setProperty('--ag-media-size', `${mediaSize}px`);
            applyLayout(false);
        }

        window.addEventListener('resize', measure);
        measure();

        // Eventos de mouse e teclado
        panels.forEach((panel, i) => {
            panel.addEventListener('mouseenter', () => {
                activeIndex = i;
                applyLayout(true);
            });
            panel.addEventListener('focus', () => {
                activeIndex = i;
                applyLayout(true);
            });
            panel.addEventListener('click', (e) => {
                if (i !== activeIndex) {
                    e.preventDefault();
                    activeIndex = i;
                    applyLayout(true);
                }
            });
        });

        applyLayout(false);
    }

    initAccordionGallery();

    // Efeito BlurText para os títulos dos slides (idêntico ao componente React BlurText)
    function initBlurText() {
        let lastActivity = Date.now();
        let activeTitleElement = null;
        
        function splitIntoBlurSpans(lineEl, text) {
            lineEl.innerHTML = '';
            const words = text.split(/(\s+)/);
            const fragment = document.createDocumentFragment();
            let wordIdx = 0;
            
            words.forEach(word => {
                if (word.trim() === '') {
                    fragment.appendChild(document.createTextNode(word));
                } else {
                    const span = document.createElement('span');
                    span.className = 'blur-word';
                    span.textContent = word;
                    span.style.setProperty('--word-idx', wordIdx);
                    wordIdx++;
                    gsap.set(span, {
                        display: 'inline-block',
                        filter: 'blur(10px)',
                        opacity: 0,
                        y: -50,
                        willChange: 'transform, filter, opacity'
                    });
                    fragment.appendChild(span);
                }
            });
            lineEl.appendChild(fragment);
        }

        const titles = document.querySelectorAll('.hero-title');
        
        titles.forEach(title => {
            const line = title.querySelector('.title-line-1');
            if (!line) return;
            
            splitIntoBlurSpans(line, line.textContent);
            
            // Remove o efeito original estático do CSS
            title.style.opacity = '1';
            title.style.filter = 'none';
            title.style.transform = 'none';
            title.style.animation = 'none';

            function playTitle(tEl) {
                const wordsList = tEl.querySelectorAll('.blur-word');
                gsap.killTweensOf(wordsList);
                gsap.timeline()
                    .to(wordsList, {
                        filter: 'blur(5px)',
                        opacity: 0.5,
                        y: 5,
                        duration: 0.35,
                        stagger: 0.1,
                        ease: 'power1.out'
                    })
                    .to(wordsList, {
                        filter: 'blur(0px)',
                        opacity: 1,
                        y: 0,
                        duration: 0.35,
                        stagger: 0.1,
                        ease: 'power1.out'
                    }, 0.35);
            }

            function resetTitle(tEl) {
                const wordsList = tEl.querySelectorAll('.blur-word');
                gsap.killTweensOf(wordsList);
                gsap.set(wordsList, {
                    filter: 'blur(10px)',
                    opacity: 0,
                    y: -50
                });
            }

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        activeTitleElement = title; // Define como o título ativo
                        playTitle(title);
                    } else {
                        if (activeTitleElement === title) {
                            activeTitleElement = null;
                        }
                        resetTitle(title);
                    }
                });
            }, { threshold: 0.15 });
            
            observer.observe(title);
        });

        function replayTitle(tEl) {
            const wordsList = tEl.querySelectorAll('.blur-word');
            const isIntro = tEl.classList.contains('intro-title');
            
            gsap.killTweensOf(wordsList);
            gsap.timeline()
                .to(wordsList, {
                    filter: 'blur(10px)',
                    opacity: 0,
                    y: -30,
                    duration: 0.35,
                    stagger: 0.05,
                    ease: 'power1.in'
                })
                .add(() => {
                    if (isIntro) {
                        currentIntroPhraseIdx = (currentIntroPhraseIdx + 1) % introPhrases.length;
                        const nextPhrase = introPhrases[currentIntroPhraseIdx];
                        const line = tEl.querySelector('.title-line-1');
                        if (line) {
                            splitIntoBlurSpans(line, nextPhrase);
                        }
                    }
                    const newWordsList = tEl.querySelectorAll('.blur-word');
                    gsap.killTweensOf(newWordsList);
                    gsap.timeline()
                        .to(newWordsList, {
                            filter: 'blur(5px)',
                            opacity: 0.5,
                            y: 5,
                            duration: 0.35,
                            stagger: 0.1,
                            ease: 'power1.out'
                        })
                        .to(newWordsList, {
                            filter: 'blur(0px)',
                            opacity: 1,
                            y: 0,
                            duration: 0.35,
                            stagger: 0.1,
                            ease: 'power1.out'
                        }, 0.35);
                });
        }

        // Lógica de inatividade global
        const resetInactivity = () => {
            lastActivity = Date.now();
        };

        ['mousemove', 'click', 'scroll', 'keydown', 'touchstart'].forEach(evt => {
            window.addEventListener(evt, resetInactivity, { passive: true });
        });

        setInterval(() => {
            const elapsed = (Date.now() - lastActivity) / 1000;
            if (elapsed >= 15) {
                resetInactivity();
                if (activeTitleElement) {
                    replayTitle(activeTitleElement);
                }
            }
        }, 1000);
    }

    initBlurText();
});
