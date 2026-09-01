// Inicialização dos Ícones Lucide e Interações Dinâmicas
document.addEventListener('DOMContentLoaded', () => {
    // Renderizar Ícones Lucide imediatamente
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Dicionário de Frases Dinâmicas para Todos os Slides
    const slidePhrases = {
        'intro': [
            "Quer reviver memórias inesquecíveis?",
            "Que tal um reencontro na memória?",
            "E se a saudade falasse mais uma vez?",
            "E se o amor eterno falasse de novo?",
            "Como seria ouvir a voz da saudade?"
        ],
        'homenagens': [
            "Reviva o olhar de quem sempre te amou.",
            "Eternize a voz e a presença que o tempo levou.",
            "Sinta a emoção de ouvir quem te amou.",
            "Resgate a essência e a voz da sua maior saudade.",
            "Guarde para sempre as palavras sublimes."
        ],
        'experiencia': [
            "Como produzimos essa emoção em 5 passos",
            "As 5 fases que transformam uma fotografia em pura emoção",
            "As 5 etapas de um processo sensível e humanizado",
            "Do resgate ao reencontro em 5 etapas transparentes",
            "Cada detalhe das etapas que dão vida à sua homenagem"
        ],
        'ocasioes': [
            "Onde o presente ganha o maior significado",
            "Momentos inesquecíveis abençoados por quem você ama",
            "A presença mais esperada nas grandes celebrações da vida",
            "O presente mais emocionante para datas que marcam a vida",
            "Quando o amor ultrapassa o tempo em celebrações únicas"
        ],
        'depoimentos': [
            "Histórias reais de quem sentiu o reencontro",
            "A emoção de quem já viveu essa experiência",
            "Lágrimas de afeto e corações acolhidos pela saudade",
            "O que dizem as famílias que reviveram esses momentos",
            "Relatos verdadeiros de quem transformou saudade em consolo"
        ],
        'proposito': [
            "O respeito por trás de cada homenagem",
            "A arte que une tecnologia e profundo respeito",
            "Sensibilidade humana unida à tecnologia",
            "Nosso propósito com foco e respeito",
            "Nossa história e compromisso com o seu legado familiar"
        ],
        'planos': [
            "A homenagem perfeita para eternizar suas memórias",
            "Escolha a dimensão ideal para a sua homenagem",
            "Opções pensadas para acolher todo o afeto da sua história",
            "Diferentes formas de eternizar uma história inesquecível",
            "O tributo que a trajetória de quem você ama merece"
        ],
        'perguntas': [
            "Esclareça todas as suas dúvidas!",
            "Tudo o que você precisa saber",
            "Clareza e segurança em cada detalhe",
            "Detalhes sobre o nosso trabalho",
            "Entenda cada detalhe com serenidade"
        ]
    };

    const slideCurrentIndices = {};
    Object.keys(slidePhrases).forEach(sectionId => {
        slideCurrentIndices[sectionId] = Math.floor(Math.random() * slidePhrases[sectionId].length);
        const sectionEl = document.getElementById(sectionId);
        if (sectionEl) {
            const titleLine = sectionEl.querySelector('.hero-title .title-line-1');
            if (titleLine) {
                titleLine.textContent = slidePhrases[sectionId][slideCurrentIndices[sectionId]];
            }
        }
    });

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

        // Animação especial para o slide Propósito (Itens saem do centro para as laterais)
        if (section.id === 'proposito' || section.id === 'quem-somos') {
            const leftItems = section.querySelectorAll('.about-item-left');
            const rightItems = section.querySelectorAll('.about-item-right');
            const centerVideo = section.querySelector('.about-card-media-central');

            if (window.gsap) {
                if (leftItems.length > 0) {
                    gsap.killTweensOf(leftItems);
                    gsap.fromTo(leftItems,
                        { x: 90, opacity: 0 },
                        { x: 0, opacity: 1, duration: 0.85, stagger: 0.08, ease: 'power3.out', clearProps: 'transform' }
                    );
                }
                if (rightItems.length > 0) {
                    gsap.killTweensOf(rightItems);
                    gsap.fromTo(rightItems,
                        { x: -90, opacity: 0 },
                        { x: 0, opacity: 1, duration: 0.85, stagger: 0.08, ease: 'power3.out', clearProps: 'transform' }
                    );
                }
                if (centerVideo) {
                    gsap.killTweensOf(centerVideo);
                    gsap.fromTo(centerVideo,
                        { scale: 0.92, opacity: 0 },
                        { scale: 1, opacity: 1, duration: 0.85, ease: 'power3.out', clearProps: 'transform' }
                    );
                }
            }
            return;
        }

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

        if (section.id === 'proposito' || section.id === 'quem-somos') {
            const items = section.querySelectorAll('.about-item-left, .about-item-right, .about-card-media-central');
            if (items && items.length > 0 && window.gsap) {
                gsap.killTweensOf(items);
                gsap.set(items, { opacity: 0 });
            }
            return;
        }

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

        sections = document.querySelectorAll('.intro-section, .hero-section, .how-it-works, .use-cases, .testimonials, .about-section, .contrate-section, .faq-section');

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

                    // Se estiver no slide 1, anima o desenho manuscrito do 'Comece aqui' e da seta sequencialmente
                    const startGuideText = entry.target.querySelector('.start-here-text');
                    const arrowLine = entry.target.querySelector('.start-here-arrow path.arrow-line');
                    const arrowHead = entry.target.querySelector('.start-here-arrow path.arrow-head');
                    if (startGuideText && arrowLine && arrowHead) {
                        startGuideText.style.animation = 'none';
                        arrowLine.style.animation = 'none';
                        arrowHead.style.animation = 'none';
                        startGuideText.offsetHeight; // Reflow
                        startGuideText.style.animation = 'revealStaticText 1.2s cubic-bezier(0.25, 1, 0.5, 1) 0.3s forwards';
                        arrowLine.style.animation = 'drawHandwrittenLine 0.9s ease-out 1.2s forwards';
                        arrowHead.style.animation = 'drawHandwrittenHead 0.5s ease-out 2.0s forwards';
                    }

                    // Dispara a animação direcional dos cards da seção que entrou
                    animateSectionCards(entry.target, currentScrollDirection);

                    // Atualiza a passagem bíblica no rodapé suavemente (oculta no slide 1)
                    updateBiblicalQuote(entry.target);
                } else {
                    // Esconde o texto dos slides que saíram da tela para reiniciar
                    if (title) {
                        title.style.animation = 'none';
                        title.style.clipPath = 'inset(0 100% 0 0)';
                    }
                    const startGuideText = entry.target.querySelector('.start-here-text');
                    const arrowLine = entry.target.querySelector('.start-here-arrow path.arrow-line');
                    const arrowHead = entry.target.querySelector('.start-here-arrow path.arrow-head');
                    if (startGuideText && arrowLine && arrowHead) {
                        startGuideText.style.animation = 'none';
                        arrowLine.style.animation = 'none';
                        arrowHead.style.animation = 'none';
                        startGuideText.style.clipPath = 'inset(0 100% 0 0)';
                        arrowLine.style.strokeDashoffset = '90';
                        arrowHead.style.strokeDashoffset = '40';
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

                // Atualiza a passagem bíblica no rodapé suavemente (oculta no slide 1)
                updateBiblicalQuote(targetElement);

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
    window.isPropositoVideoPlaying = false;

    function getTargetBgVolume() {
        if (window.isPropositoVideoPlaying || document.body.classList.contains('proposito-video-playing')) {
            return 0;
        }
        if (document.body.classList.contains('video-active')) {
            return 0.25;
        }
        return originalVolume || 0.5;
    }
    window.getTargetBgVolume = getTargetBgVolume;

    function fadeAudioVolume(targetVolume, duration = 400) {
        const bgAudio = document.getElementById('bgAudio');
        if (!bgAudio) return;

        // Se o vídeo de Propósito estiver tocando com áudio, o som de fundo deve ser rigorosamente 0
        if ((window.isPropositoVideoPlaying || document.body.classList.contains('proposito-video-playing')) && targetVolume > 0) {
            targetVolume = 0;
        }

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
    window.fadeAudioVolume = fadeAudioVolume;

    let videoFadeInterval = null;

    function fadeVideoAudio(videoEl, targetVolume, duration = 1200) {
        if (!videoEl) return;
        if (videoFadeInterval) clearInterval(videoFadeInterval);
        
        const startVolume = videoEl.volume;
        const steps = 20;
        const stepTime = duration / steps;
        const volDiff = targetVolume - startVolume;
        let currentStep = 0;

        videoFadeInterval = setInterval(() => {
            currentStep++;
            videoEl.volume = Math.max(0, Math.min(1, startVolume + (volDiff * (currentStep / steps))));
            if (currentStep >= steps) {
                clearInterval(videoFadeInterval);
                videoFadeInterval = null;
            }
        }, stepTime);
    }

    function startVideoFadeOut() {
        if (!localVideoPlayer) return;

        // Desvanecer o modal visualmente com transição suave (2s)
        videoModal.classList.remove('active');
        document.body.classList.remove('video-active');
        
        // Restaurar o volume da música de fundo gradualmente ao longo dos 2 segundos
        const bgAudio = document.getElementById('bgAudio');
        if (bgAudio) {
            if (bgAudio.paused) {
                bgAudio.volume = 0;
                bgAudio.play().then(() => {
                    document.querySelectorAll('.music-wave-toggle').forEach(w => w.classList.add('playing'));
                }).catch(() => {});
            }
            fadeAudioVolume(originalVolume || 0.5, 2000);
        }

        // Aguardar o término do fade visual (2s) para remover e resetar o vídeo
        setTimeout(() => {
            stopVideos();
        }, 2000);
    }

    function openVideoModal(videoUrl, options = {}) {
        const bgAudio = document.getElementById('bgAudio');

        if (bgAudio) {
            if (!bgAudio.paused) {
                originalVolume = bgAudio.volume || 0.5;
            } else {
                originalVolume = 0.5;
                bgAudio.volume = 0.25;
                bgAudio.play().then(() => {
                    document.querySelectorAll('.music-wave-toggle').forEach(w => w.classList.add('playing'));
                }).catch(err => console.log("Audio play failed on video modal open:", err));
            }
            // Reduz o volume da música gradualmente ao longo de 2s para os vídeos do Iasis
            fadeAudioVolume(0.25, 2000);
        }

        stopVideos();
        document.body.classList.add('video-active');

        if (videoUrl.endsWith('.webm') || videoUrl.endsWith('.mp4') || videoUrl.endsWith('.ogg')) {
            if (customVideoControls) customVideoControls.classList.add('visible');
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
                
                // Monitorar a reprodução para acionar o fade out suave antes do vídeo congelar no fim
                let autoFadeTriggered = false;

                const handleTimeUpdate = () => {
                    if (!localVideoPlayer.duration) return;
                    
                    const timeLeft = localVideoPlayer.duration - localVideoPlayer.currentTime;
                    // Dispara o fade out suave nos últimos 2.0 segundos de vídeo (com o avatar ainda em movimento suave)
                    if (timeLeft <= 2.0 && !autoFadeTriggered) {
                        autoFadeTriggered = true;
                        startVideoFadeOut();
                    }
                };

                const handleEnded = () => {
                    if (!autoFadeTriggered) {
                        autoFadeTriggered = true;
                        startVideoFadeOut();
                    }
                    localVideoPlayer.removeEventListener('timeupdate', handleTimeUpdate);
                    localVideoPlayer.removeEventListener('ended', handleEnded);
                };

                localVideoPlayer.addEventListener('timeupdate', handleTimeUpdate);
                localVideoPlayer.addEventListener('ended', handleEnded);
            }
        } else {
            if (customVideoControls) customVideoControls.classList.remove('visible');
            if (videoPlayer) {
                videoPlayer.src = videoUrl;
                videoPlayer.style.display = 'block';
            }
        }
        
        requestAnimationFrame(() => {
            videoModal.classList.add('active');
            videoModal.focus();
            if (window.lucide) lucide.createIcons();
        });
    }

    function closeVideoModal() {
        if (!videoModal.classList.contains('active')) return;
        startVideoFadeOut();
    }

    function stopVideos() {
        videoModal.classList.remove('vertical-focus-mode');
        document.body.classList.remove('vertical-focus-active');
        if (customVideoControls) {
            customVideoControls.classList.remove('visible', 'idle');
        }
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

    // --- CONTROLES CUSTOMIZADOS DE VÍDEO (OURO & MARROM) ---
    const customVideoControls = document.getElementById('customVideoControls');
    const vPlayBtn = document.getElementById('vPlayBtn');
    const vMuteBtn = document.getElementById('vMuteBtn');
    const vTimeCurrent = document.getElementById('vTimeCurrent');
    const vTimeDuration = document.getElementById('vTimeDuration');
    const vProgressContainer = document.getElementById('vProgressContainer');
    const vProgressCurrent = document.getElementById('vProgressCurrent');
    const vProgressBuffer = document.getElementById('vProgressBuffer');
    const vProgressScrubber = document.getElementById('vProgressScrubber');
    const vFullscreenBtn = document.getElementById('vFullscreenBtn');
    const videoContainerWrapper = document.getElementById('videoContainerWrapper');

    let controlsIdleTimer = null;

    function formatTime(seconds) {
        if (isNaN(seconds) || seconds === Infinity) return "00:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function resetControlsIdleTimer() {
        if (!customVideoControls) return;
        customVideoControls.classList.remove('idle');
        if (controlsIdleTimer) clearTimeout(controlsIdleTimer);
        if (localVideoPlayer && !localVideoPlayer.paused) {
            controlsIdleTimer = setTimeout(() => {
                customVideoControls.classList.add('idle');
            }, 2500);
        }
    }

    if (customVideoControls && localVideoPlayer) {
        function updatePlayPauseUI() {
            const isPaused = localVideoPlayer.paused;
            const playIcon = vPlayBtn ? vPlayBtn.querySelector('.v-icon-play') : null;
            const pauseIcon = vPlayBtn ? vPlayBtn.querySelector('.v-icon-pause') : null;
            if (playIcon && pauseIcon) {
                playIcon.style.display = isPaused ? 'block' : 'none';
                pauseIcon.style.display = isPaused ? 'none' : 'block';
            }
            resetControlsIdleTimer();
        }

        if (vPlayBtn) {
            vPlayBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (localVideoPlayer.paused) {
                    localVideoPlayer.play();
                } else {
                    localVideoPlayer.pause();
                }
            });
        }

        function updateMuteUI() {
            const isMuted = localVideoPlayer.muted;
            const volIcon = vMuteBtn ? vMuteBtn.querySelector('.v-icon-vol') : null;
            const mutedIcon = vMuteBtn ? vMuteBtn.querySelector('.v-icon-muted') : null;
            if (volIcon && mutedIcon) {
                volIcon.style.display = isMuted ? 'none' : 'block';
                mutedIcon.style.display = isMuted ? 'block' : 'none';
            }
            resetControlsIdleTimer();
        }

        if (vMuteBtn) {
            vMuteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                localVideoPlayer.muted = !localVideoPlayer.muted;
                updateMuteUI();
            });
        }

        localVideoPlayer.addEventListener('timeupdate', () => {
            if (!localVideoPlayer.duration) return;
            const current = localVideoPlayer.currentTime;
            const duration = localVideoPlayer.duration;
            const percent = (current / duration) * 100;

            if (vProgressCurrent) vProgressCurrent.style.width = `${percent}%`;
            if (vProgressScrubber) vProgressScrubber.style.left = `${percent}%`;
            if (vTimeCurrent) vTimeCurrent.textContent = formatTime(current);

            if (localVideoPlayer.buffered.length > 0) {
                const bufferedEnd = localVideoPlayer.buffered.end(localVideoPlayer.buffered.length - 1);
                const bufPercent = (bufferedEnd / duration) * 100;
                if (vProgressBuffer) vProgressBuffer.style.width = `${bufPercent}%`;
            }
        });

        localVideoPlayer.addEventListener('loadedmetadata', () => {
            if (vTimeDuration) vTimeDuration.textContent = formatTime(localVideoPlayer.duration);
            if (vTimeCurrent) vTimeCurrent.textContent = formatTime(0);
            if (vProgressCurrent) vProgressCurrent.style.width = '0%';
            if (vProgressScrubber) vProgressScrubber.style.left = '0%';
            updatePlayPauseUI();
            updateMuteUI();
        });

        localVideoPlayer.addEventListener('play', updatePlayPauseUI);
        localVideoPlayer.addEventListener('pause', updatePlayPauseUI);

        function seekVideo(e) {
            if (!localVideoPlayer.duration || !vProgressContainer) return;
            const rect = vProgressContainer.getBoundingClientRect();
            const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            localVideoPlayer.currentTime = pos * localVideoPlayer.duration;
            resetControlsIdleTimer();
        }

        let isSeeking = false;
        if (vProgressContainer) {
            vProgressContainer.addEventListener('click', (e) => {
                e.stopPropagation();
                seekVideo(e);
            });
            vProgressContainer.addEventListener('mousedown', (e) => {
                isSeeking = true;
                seekVideo(e);
            });
        }

        window.addEventListener('mousemove', (e) => {
            if (isSeeking) {
                seekVideo(e);
            }
        });

        window.addEventListener('mouseup', () => {
            if (isSeeking) isSeeking = false;
        });

        if (vFullscreenBtn) {
            vFullscreenBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!document.fullscreenElement) {
                    if (videoContainerWrapper && videoContainerWrapper.requestFullscreen) {
                        videoContainerWrapper.requestFullscreen();
                    } else if (localVideoPlayer.webkitEnterFullscreen) {
                        localVideoPlayer.webkitEnterFullscreen();
                    }
                } else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    }
                }
            });
        }

        if (videoContainerWrapper) {
            videoContainerWrapper.addEventListener('mousemove', resetControlsIdleTimer);
            videoContainerWrapper.addEventListener('touchstart', resetControlsIdleTimer, { passive: true });
        }
    }

    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' || 
                        window.location.hostname.startsWith('192.168.') || 
                        window.location.hostname.startsWith('10.') || 
                        window.location.protocol === 'file:';

    // Lógica de Persistência dos Badges e Guia Comece Aqui:
    // No Localhost: Sempre visíveis para facilitar seus testes.
    // No Site Publicado: Ocultados permanentemente após o cliente clicar/assistir.
    if (!isLocalhost) {
        document.querySelectorAll('.video-new-badge').forEach(badge => {
            const videoId = badge.getAttribute('data-video-id');
            if (localStorage.getItem(`watched-${videoId}`)) {
                badge.classList.add('watched');
                const wrapper = badge.closest('.video-badge-wrapper');
                const guide = wrapper?.querySelector('.start-here-guide');
                if (guide) guide.classList.add('watched');
            }
        });
    }

    if (videoModal) {
        // Abrir Modal
        document.querySelectorAll('.watch-video-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Obter ID do vídeo para persistir o estado assistido (apenas em produção)
                const videoId = button.getAttribute('data-video-id');
                if (videoId && !isLocalhost) {
                    localStorage.setItem(`watched-${videoId}`, 'true');
                    const badge = document.querySelector(`.video-new-badge[data-video-id="${videoId}"]`);
                    if (badge) {
                        badge.classList.add('watched');
                    }
                    const wrapper = button.closest('.video-badge-wrapper');
                    const guide = wrapper?.querySelector('.start-here-guide');
                    if (guide) guide.classList.add('watched');
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

        // Fechar ao clicar fora do vídeo (nas laterais ou fundo do Modo Foco)
        videoModal.addEventListener('click', (e) => {
            if (e.target.closest('#customVideoControls') || 
                e.target.closest('.video-modal-navbar') || 
                e.target === localVideoPlayer || 
                e.target === videoPlayer) {
                return;
            }
            closeVideoModal();
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
        
        // Quando a música atual acabar, escolhe uma música DIFERENTE da atual e toca respeitando o volume atual do site/vídeo
        bgAudio.addEventListener('ended', () => {
            currentTrack = getNextRandomTrack();
            bgAudio.src = currentTrack;
            bgAudio.load();
            bgAudio.volume = typeof getTargetBgVolume === 'function' ? getTargetBgVolume() : 0.5;
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
                    bgAudio.volume = typeof getTargetBgVolume === 'function' ? getTargetBgVolume() : 0.5;
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
                bgAudio.volume = typeof getTargetBgVolume === 'function' ? getTargetBgVolume() : 0.5;
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
                    subtitleSpan.textContent = `Formato ${formatName}`;
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
                    if (subtitleSpan) subtitleSpan.textContent = `Formato ${formatName}`;
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
                    if (subtitleSpan) subtitleSpan.textContent = `Formato ${formatName}`;
                }
            });
        }
    });

    // ==========================================
    // SIMULADOR DE CHECKOUT & PAGAMENTO
    // ==========================================
    let currentSelectedPlanData = {
        planId: 'emocao',
        planName: 'Plano Legatum',
        duration: '2 Minutos',
        format: 'Formato Horizontal',
        hasUpsell: false,
        priceFormatted: 'R$ 897,00',
        priceVal: 897
    };

    window.openCheckoutModal = function(card) {
        const modal = document.getElementById('modal-checkout-simulado');
        if (!modal) return;

        const planNameEl = card.querySelector('.plan-name');
        const planDurationEl = card.querySelector('.plan-duration');
        const activeFormatBtn = card.querySelector('.format-btn.active');
        const upsellCheckbox = card.querySelector('.upsell-checkbox');
        const priceDisplay = card.querySelector('.price-display');
        const amountSpan = priceDisplay ? priceDisplay.querySelector('.amount') : null;
        const centsSpan = priceDisplay ? priceDisplay.querySelector('.cents') : null;

        const planName = planNameEl ? planNameEl.textContent.trim() : 'Plano Legatum';
        const duration = planDurationEl ? planDurationEl.textContent.trim() : '2 Minutos';
        const formatPrimary = activeFormatBtn ? activeFormatBtn.getAttribute('data-format') : 'horizontal';
        const hasUpsell = upsellCheckbox ? upsellCheckbox.checked : false;

        let formatText = formatPrimary === 'horizontal' ? 'Formato Horizontal' : 'Formato Vertical';
        if (hasUpsell) {
            formatText = 'Formatos Horizontal + Vertical';
        }

        const priceText = 'R$ ' + (amountSpan ? amountSpan.textContent.trim() : '897') + (centsSpan ? centsSpan.textContent.trim() : ',00');
        
        let planId = 'emocao';
        if (planName.toLowerCase().includes('affectus') || duration.includes('1')) planId = 'essencial';
        else if (planName.toLowerCase().includes('tributum') || duration.includes('3')) planId = 'tributo';

        currentSelectedPlanData = {
            planId: planId,
            planName: planName,
            duration: duration,
            format: formatText,
            hasUpsell: hasUpsell,
            priceFormatted: priceText,
            priceVal: parseFloat(priceDisplay?.getAttribute('data-base') || 897) + (hasUpsell ? parseFloat(priceDisplay?.getAttribute('data-upsell') || 0) : 0)
        };

        const chkPlanName = document.getElementById('chk-plan-name');
        const chkPlanDetails = document.getElementById('chk-plan-details');
        const chkPlanPrice = document.getElementById('chk-plan-price');

        if (chkPlanName) chkPlanName.textContent = planName;
        if (chkPlanDetails) chkPlanDetails.textContent = `${duration} • ${formatText}`;
        if (chkPlanPrice) chkPlanPrice.textContent = priceText;

        // Algoritmo Oficial da Receita Federal para Validação de CPF (Módulo 11)
        window.validarCPF = function(cpf) {
            if (!cpf || typeof cpf !== 'string') return false;
            const limpo = cpf.replace(/\D/g, '');
            if (limpo.length !== 11) return false;
            if (/^(\d)\1{10}$/.test(limpo)) return false;

            let soma = 0;
            for (let i = 0; i < 9; i++) {
                soma += parseInt(limpo.charAt(i), 10) * (10 - i);
            }
            let resto = (soma * 10) % 11;
            if (resto === 10 || resto === 11) resto = 0;
            if (resto !== parseInt(limpo.charAt(9), 10)) return false;

            soma = 0;
            for (let i = 0; i < 10; i++) {
                soma += parseInt(limpo.charAt(i), 10) * (11 - i);
            }
            resto = (soma * 10) % 11;
            if (resto === 10 || resto === 11) resto = 0;
            if (resto !== parseInt(limpo.charAt(10), 10)) return false;

            return true;
        };

        // Se o formulário estiver vazio, preenche com dados padrão válidos de teste
        const nameInput = document.getElementById('chk-input-name');
        const cpfInput = document.getElementById('chk-input-cpf');
        const emailInput = document.getElementById('chk-input-email');
        const phoneInput = document.getElementById('chk-input-phone');

        if (nameInput && !nameInput.value) nameInput.value = 'Mariana Silva Santos';
        if (cpfInput && !cpfInput.value) cpfInput.value = '111.444.777-35';
        if (emailInput && !emailInput.value) emailInput.value = 'mariana.silva@exemplo.com';
        if (phoneInput && !phoneInput.value) phoneInput.value = '(11) 98765-4321';

        modal.style.display = 'flex';
        if (window.lucide) lucide.createIcons();
    };

    window.closeCheckoutModal = function() {
        const modal = document.getElementById('modal-checkout-simulado');
        if (modal) modal.style.display = 'none';
    };

    window.preencherDadosTesteCheckout = function() {
        const nameInput = document.getElementById('chk-input-name');
        const cpfInput = document.getElementById('chk-input-cpf');
        const emailInput = document.getElementById('chk-input-email');
        const phoneInput = document.getElementById('chk-input-phone');
        if (nameInput) nameInput.value = 'Mariana Silva Santos';
        if (cpfInput) cpfInput.value = '111.444.777-35';
        if (emailInput) emailInput.value = 'mariana.silva@exemplo.com';
        if (phoneInput) phoneInput.value = '(11) 98765-4321';
    };

    // Máscara do CPF no Checkout
    document.getElementById('chk-input-cpf')?.addEventListener('input', function(e) {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length > 11) v = v.slice(0, 11);
        if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
        else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
        else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
        e.target.value = v;
    });

    window.handleSimulateCheckout = function(e) {
        if (e) e.preventDefault();
        
        const name = (document.getElementById('chk-input-name')?.value || '').trim();
        const cpf = (document.getElementById('chk-input-cpf')?.value || '').trim();
        const email = (document.getElementById('chk-input-email')?.value || '').trim();
        const phone = (document.getElementById('chk-input-phone')?.value || '').trim();

        if (!name) {
            alert('Por favor, informe seu nome completo.');
            return;
        }

        if (!cpf || !window.validarCPF(cpf)) {
            alert('CPF inválido! Por favor, digite um CPF real e válido com os 11 dígitos corretos para prosseguir.');
            document.getElementById('chk-input-cpf')?.focus();
            return;
        }

        // Criar objeto de pedido
        const planInfo = currentSelectedPlanData || {
            planId: 'emocao',
            planName: 'Plano Legatum',
            duration: '2 Minutos',
            format: 'Formato Horizontal',
            hasUpsell: false,
            priceFormatted: 'R$ 897,00'
        };

        const orderData = {
            order_id: 'REVIVA-ORD-' + Date.now().toString(36).toUpperCase(),
            customer_name: name,
            customer_cpf: cpf,
            customer_email: email,
            customer_phone: phone,
            plan_id: planInfo.planId || 'emocao',
            plan_name: planInfo.planName || 'Plano Legatum',
            plan_duration: planInfo.duration || '2 Minutos',
            plan_format: planInfo.format || 'Formato Horizontal',
            has_upsell: !!planInfo.hasUpsell,
            total_price: planInfo.priceFormatted || 'R$ 897,00',
            status: 'paid',
            created_at: new Date().toISOString()
        };

        // Salvar na sessão local
        localStorage.setItem('reviva_order_data', JSON.stringify(orderData));
        localStorage.setItem('reviva_session_user', JSON.stringify({ name, cpf, email, phone }));
        
        // Resetar o termo para exigir assinatura nova com o nome e CPF desta simulação
        localStorage.removeItem('reviva_legal_term');

        // Atualizar estado mestre do painel
        let fullState = {};
        try {
            const raw = localStorage.getItem('reviva_full_session_state');
            if (raw) fullState = JSON.parse(raw);
        } catch(err) {}
        fullState.orderData = orderData;
        fullState.legalTermSigned = null; // forçar novo aceite do termo
        fullState.clientName = name;
        fullState.clientCpf = cpf;
        fullState.clientEmail = email;
        fullState.clientPhone = phone;
        localStorage.setItem('reviva_full_session_state', JSON.stringify(fullState));

        // Simular notificação interativa pós-compra
        const modalCheckout = document.getElementById('modal-checkout-simulado');
        if (modalCheckout) {
            modalCheckout.innerHTML = `
                <div style="text-align: center; padding: 20px 10px; font-family: 'Inter', sans-serif;">
                    <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(34, 197, 94, 0.15); border: 2px solid #4ade80; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; box-shadow: 0 0 20px rgba(74, 222, 128, 0.4);">
                        <i data-lucide="check" style="width: 32px; height: 32px; color: #4ade80;"></i>
                    </div>
                    <h3 style="font-family: 'Cormorant Garamond', serif; font-size: 1.6rem; color: #f6e3c5; margin: 0 0 6px 0;">PAGAMENTO APROVADO COM SUCESSO!</h3>
                    <p style="font-size: 0.85rem; color: #cbd5e1; margin: 0 0 20px 0; line-height: 1.4;">Parabéns, <strong>${name}</strong>! Seu pedido do <strong>${planInfo.planName}</strong> foi confirmado.</p>

                    <div style="background: rgba(14, 9, 6, 0.7); border: 1px solid rgba(197, 160, 89, 0.3); border-radius: 8px; padding: 14px; text-align: left; margin-bottom: 20px; font-size: 0.78rem; line-height: 1.6; color: #e2e8f0;">
                        <div style="color: #e5c378; font-weight: 700; text-transform: uppercase; font-size: 0.72rem; letter-spacing: 0.5px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                            <i data-lucide="send" style="width: 14px; height: 14px;"></i> NOTIFICAÇÕES DE ACESSO ENVIADAS:
                        </div>
                        <div style="margin-bottom: 6px;">📧 <strong>E-mail:</strong> Enviado para <em>${email}</em> com seu link de acesso exclusivo.</div>
                        <div style="margin-bottom: 6px;">💬 <strong>WhatsApp:</strong> Enviado para <em>${phone}</em> com as instruções do pedido.</div>
                        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(197, 160, 89, 0.2); color: #94a3b8; font-size: 0.73rem;">
                            🔒 <strong>Acesso Permanente:</strong> Você pode retornar ao seu painel a qualquer momento clicando em <strong>"MEU PAINEL"</strong> no site e digitando seu CPF (<em>${cpf}</em>).
                        </div>
                    </div>

                    <button type="button" onclick="window.location.href='termo.html'" style="width: 100%; padding: 14px; background: linear-gradient(135deg, #c5a059 0%, #9c7247 100%); border: 1px solid #e5c378; border-radius: 8px; color: #fff; font-weight: 700; font-size: 0.88rem; letter-spacing: 0.6px; cursor: pointer; box-shadow: 0 4px 20px rgba(197, 160, 89, 0.4); text-transform: uppercase;">
                        PROSSEGUIR PARA O PAINEL AGORA →
                    </button>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
        } else {
            window.location.href = 'termo.html';
        }
        return false;
    };

    // Vincular submit do form explicitamente
    const formChk = document.getElementById('form-checkout-simulado');
    if (formChk) {
        formChk.addEventListener('submit', window.handleSimulateCheckout);
    }

    // Vincular botões "Contratar" dos cards para abrir o checkout simulado
    document.querySelectorAll('.plan-buy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const card = btn.closest('.plan-card');
            if (card) {
                openCheckoutModal(card);
            }
        });
    });

    // Interatividade do FAQ (Spotlight Modal Centralizado com Fundo Desfocado)
    const faqModalBackdrop = document.getElementById('faqModalBackdrop');
    const faqModalQuestion = document.getElementById('faqModalQuestion');
    const faqModalAnswer = document.getElementById('faqModalAnswer');
    const faqModalCloseBtn = document.getElementById('faqModalCloseBtn');

    function openFaqModal(questionText, answerText) {
        if (!faqModalBackdrop || !faqModalQuestion || !faqModalAnswer) return;
        
        faqModalQuestion.textContent = questionText;
        faqModalAnswer.textContent = answerText;
        
        // Reinicia e dispara a animação manuscrita da tag "Dúvidas Frequentes"
        const badge = faqModalBackdrop.querySelector('.faq-modal-badge');
        if (badge) {
            badge.style.animation = 'none';
            badge.offsetHeight; // Força reflow para reiniciar o keyframe
            badge.style.animation = 'revealStaticText 1.2s linear forwards';
        }

        // Animação de revelação/desfoque do título da pergunta selecionada
        faqModalQuestion.style.animation = 'none';
        faqModalQuestion.offsetHeight; // Reflow
        faqModalQuestion.style.animation = 'blurFadeIn 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards';

        // Animação de slide e fade-in suave do texto da resposta
        faqModalAnswer.style.animation = 'none';
        faqModalAnswer.offsetHeight; // Reflow
        faqModalAnswer.style.animation = 'faqAnswerFadeIn 0.5s ease-out forwards';

        faqModalBackdrop.classList.add('active');
        document.body.classList.add('faq-modal-open');
    }

    function closeFaqModal() {
        if (!faqModalBackdrop) return;
        faqModalBackdrop.classList.remove('active');
        document.body.classList.remove('faq-modal-open');

        // Reseta o estado da tag para a próxima pergunta
        const badge = faqModalBackdrop.querySelector('.faq-modal-badge');
        if (badge) {
            badge.style.animation = 'none';
            badge.style.clipPath = 'inset(0 100% 0 0)';
        }
    }

    document.querySelectorAll('.faq-question').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const faqItem = button.closest('.faq-item');
            const questionSpan = button.querySelector('span');
            const answerP = faqItem ? faqItem.querySelector('.faq-answer p') : null;
            
            const questionText = questionSpan ? questionSpan.textContent.trim() : '';
            const answerText = answerP ? answerP.textContent.trim() : '';

            if (questionText && answerText) {
                openFaqModal(questionText, answerText);
            }
        });
    });

    if (faqModalCloseBtn) {
        faqModalCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeFaqModal();
        });
    }

    if (faqModalBackdrop) {
        faqModalBackdrop.addEventListener('click', (e) => {
            if (e.target === faqModalBackdrop) {
                closeFaqModal();
            }
        });
    }

    // Fechar modal FAQ com a tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && faqModalBackdrop && faqModalBackdrop.classList.contains('active')) {
            closeFaqModal();
        }
    });

    // ==========================================================================
    // Biblioteca de 10 Passagens Bíblicas no Rodapé com Exibição Aleatória
    // ==========================================================================
    const biblicalPassages = [
        '"A memória do justo é uma bênção eterna." — Provérbios 10:7',
        '"O amor é o vínculo perfeito que une para sempre." — Colossenses 3:14',
        '"Deus colocou a eternidade no coração do homem." — Eclesiastes 3:11',
        '"As muitas águas não podem apagar o amor, nem os rios afogá-lo." — Cânticos 8:7',
        '"Agradeço a Deus todas as vezes que me lembro de você." — Filipenses 1:3',
        '"Temos na eternidade uma morada feita de amor que nunca se desfaz." — 2 Coríntios 5:1',
        '"Ele enxugará dos seus olhos toda lágrima, e a dor já não existirá." — Apocalipse 21:4',
        '"O amor me acompanhará sempre, e habitarei na casa do Senhor para sempre." — Salmos 23:6',
        '"O choro pode durar uma noite, mas a alegria vem pela manhã." — Salmos 30:5',
        '"Combati o bom combate, guardei a fé e o amor permanece." — 2 Timóteo 4:7'
    ];

    let lastBiblicalIndex = -1;
    function getRandomBiblicalPassage() {
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * biblicalPassages.length);
        } while (newIndex === lastBiblicalIndex && biblicalPassages.length > 1);
        lastBiblicalIndex = newIndex;
        return biblicalPassages[newIndex];
    }

    const biblicalQuoteFooter = document.getElementById('biblicalQuoteFooter');
    const biblicalQuoteText = document.getElementById('biblicalQuoteText');

    function updateBiblicalQuote(activeSection) {
        if (!biblicalQuoteFooter || !biblicalQuoteText) return;

        const currentSec = activeSection || (sections && sections[currentIdx] ? sections[currentIdx] : document.querySelector('.intro-section'));
        
        // No primeiro slide (Intro), mantém oculto
        if (currentSec && (currentSec.classList.contains('intro-section') || currentSec.id === 'intro')) {
            biblicalQuoteFooter.classList.add('hidden');
            return;
        }

        // No último slide (Perguntas / #perguntas), exibe o crédito da Preview Studio Digital
        if (currentSec && (currentSec.classList.contains('faq-section') || currentSec.id === 'perguntas' || currentSec.id === 'faq')) {
            biblicalQuoteFooter.classList.remove('hidden');
            biblicalQuoteText.classList.add('fade-out');
            setTimeout(() => {
                biblicalQuoteText.innerHTML = '<a href="https://www.previewstudio.com.br" target="_blank" rel="noopener noreferrer" class="preview-studio-link">Desenvolvido por Preview Studio Digital</a>';
                biblicalQuoteText.classList.remove('fade-out');
            }, 300);
            return;
        }

        // Nos demais slides (Homenagens, Experiência, Ocasiões, Depoimentos, Propósito, Planos), exibe as passagens bíblicas
        biblicalQuoteFooter.classList.remove('hidden');
        biblicalQuoteText.classList.add('fade-out');
        setTimeout(() => {
            biblicalQuoteText.textContent = getRandomBiblicalPassage();
            biblicalQuoteText.classList.remove('fade-out');
        }, 400);
    }

    // Inicialização no carregamento
    const initialSec = sections && sections[currentIdx] ? sections[currentIdx] : document.querySelector('.intro-section');
    updateBiblicalQuote(initialSec);


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

#define NUM_LAYER 3.0
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
            // OTIMIZAÇÃO: Limita DPR a 1.0 para evitar sobrecarga em telas 2K/4K/Retina de laptops
            renderer.dpr = Math.min(window.devicePixelRatio || 1, 1.0);
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

        let animationFrameId = null;
        let isRunning = false;
        let isCtnVisible = true;

        const loop = (t) => {
            if (!isRunning) return;
            animationFrameId = requestAnimationFrame(loop);

            // OTIMIZAÇÃO DE PERFORMANCE: Pausa a renderização WebGL se o canvas não estiver visível
            if (!isCtnVisible) return;

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

        const startLoop = () => {
            if (!isRunning) {
                isRunning = true;
                animationFrameId = requestAnimationFrame(loop);
            }
        };

        const stopLoop = () => {
            isRunning = false;
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        };

        // Inicia o loop e escuta visibilidade da tela
        startLoop();

        window.addEventListener('resize', updatePlacement);
        updatePlacement();
    }

    // Único Fundo de Galáxia WebGL Global para todo o site
    const galaxyBg = document.getElementById('galaxyBg');
    if (galaxyBg) initGalaxy(galaxyBg, true);

    // Inicialização da Galeria de Acordeão com GSAP
    function initAccordionGallery() {
        const gallery = document.getElementById('heroAccordion');
        if (!gallery) return;

        // Imagens e Vídeos com seus respectivos títulos e ocasiões fixas
        const imagePool = [
            { src: 'gallery_homem_01.webm', poster: 'gallery_homem_01.jpg', label: 'ASSISTIR: VOVÔ - CHÁ REVELAÇÃO', type: 'video' },
            { src: 'gallery_homem_02.webm', poster: 'gallery_homem_02.jpg', label: 'ASSISTIR: PAI - HOMENAGEM DE 50 ANOS', type: 'video' },
            { src: 'gallery_homem_03.webm', poster: 'gallery_homem_03.jpg', label: 'ASSISTIR: PAI - HOMENAGEM PARA CASAMENTO', type: 'video' },
            { src: 'gallery_homem_04.webm', poster: 'gallery_homem_04.jpg', label: 'ASSISTIR: IRMÃO - HOMENAGEM DE 15 ANOS', type: 'video' },
            { src: 'gallery_mae_aniversario.webm', poster: 'gallery_mulher_02.jpg', label: 'ASSISTIR: MÃE - HOMENAGEM PARA ANIVERSÁRIO', type: 'video' },
            { src: 'gallery_mulher_01.webm', poster: 'gallery_mulher_01.jpg', label: 'ASSISTIR: IRMÃ - HOMENAGEM PARA ANIVERSÁRIO', type: 'video' },
            { src: 'gallery_mulher_03.webm', poster: 'gallery_mulher_03.jpg', label: 'ASSISTIR: MÃE - HOMENAGEM PARA FORMATURA', type: 'video' },
            { src: 'gallery_mulher_04.webm', poster: 'gallery_mulher_04.jpg', label: 'ASSISTIR: MÃE - HOMENAGEM 18 ANOS GÊMEAS', type: 'video' }
        ];

        // Embaralha a pool garantindo a diversidade visual
        const shuffledImages = [...imagePool].sort(() => Math.random() - 0.5);

        // Preenche o acordeão com as mídias antes de aplicar o GSAP
        const tempPanels = gallery.querySelectorAll('.ag-panel');

        tempPanels.forEach((panel, index) => {
            if (index < shuffledImages.length) {
                const itemData = shuffledImages[index];
                const mediaContainer = panel.querySelector('.ag-panel__media');
                const labelTextEl = panel.querySelector('.ag-panel__text');
                if (mediaContainer) {
                    if (itemData.type === 'video') {
                        mediaContainer.innerHTML = `
                            <img class="ag-card-poster" src="${itemData.poster || ''}" alt="" draggable="false">
                            <video class="ag-card-video" src="${itemData.src}" poster="${itemData.poster || ''}" playsinline muted preload="auto"></video>
                        `;
                        // Cria botão de play circular sem texto na base do vídeo
                        const playBtn = document.createElement('button');
                        playBtn.className = 'ag-panel-play-btn';
                        playBtn.setAttribute('aria-label', 'Reproduzir homenagem com som');
                        playBtn.innerHTML = `
                            <svg class="icon-play" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>
                            <svg class="icon-pause" viewBox="0 0 24 24" fill="currentColor" style="display:none;"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                        `;
                        panel.appendChild(playBtn);
                    } else {
                        mediaContainer.innerHTML = `
                            <img src="${itemData.src}" alt="${itemData.label}" draggable="false">
                        `;
                    }
                }

                if (labelTextEl) {
                    labelTextEl.textContent = itemData.type === 'video' ? '' : itemData.label;
                }
                panel.setAttribute('aria-label', itemData.label || 'Vídeo de homenagem');
                panel.dataset.type = itemData.type;
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

        function updateCardVideos(activeIdx) {
            panels.forEach((panel, i) => {
                const video = panel.querySelector('video.ag-card-video');
                const playBtn = panel.querySelector('.ag-panel-play-btn');
                if (!video) return;

                if (i === activeIdx) {
                    // Quando o card de vídeo fica ativo: toca um trecho de exatamente 10 segundos do meio (sem fades)
                    if (video.dataset.playingWithAudio !== 'true') {
                        video.muted = true;
                        
                        const dur = video.duration || 60;
                        // Centraliza uma janela de 10s exatamente no meio do vídeo (longe dos fades de início e fim)
                        const startPreviewTime = Math.max(5, (dur / 2) - 5);
                        const endPreviewTime = startPreviewTime + 10;

                        if (video.currentTime < startPreviewTime || video.currentTime >= endPreviewTime) {
                            video.currentTime = startPreviewTime;
                        }

                        // Monitora o tempo: ao atingir os 10s exatos do meio, avança para o próximo vídeo da galeria
                        video.ontimeupdate = () => {
                            if (video.dataset.playingWithAudio !== 'true') {
                                if (video.currentTime >= endPreviewTime) {
                                    video.ontimeupdate = null;
                                    video.pause();

                                    // Localiza o próximo painel de vídeo na galeria
                                    let nextVideoIndex = -1;
                                    for (let step = 1; step < count; step++) {
                                        const candidateIdx = (i + step) % count;
                                        if (panels[candidateIdx].dataset.type === 'video') {
                                            nextVideoIndex = candidateIdx;
                                            break;
                                        }
                                    }

                                    if (nextVideoIndex !== -1 && nextVideoIndex !== i) {
                                        activeIndex = nextVideoIndex;
                                        applyLayout(true);
                                    }
                                }
                            }
                        };

                        video.play().catch(() => {});
                    }
                } else {
                    // Quando o card de vídeo perde o foco: pausa, reseta posição, áudio e restaura música de fundo
                    if (video.dataset.playingWithAudio === 'true') {
                        video.dataset.playingWithAudio = 'false';
                        video.muted = true;
                        if (playBtn) {
                            playBtn.classList.remove('playing');
                            const iconPlay = playBtn.querySelector('.icon-play');
                            const iconPause = playBtn.querySelector('.icon-pause');
                            if (iconPlay) iconPlay.style.display = 'block';
                            if (iconPause) iconPause.style.display = 'none';
                        }
                        fadeAudioVolume(originalVolume, 1000);
                    }
                    video.ontimeupdate = null;
                    video.onended = null;
                    video.pause();
                    video.currentTime = 0;
                }
            });
        }

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

                // Anima a imagem/vídeo interna (efeito paralaxe, escala e escala de cinza)
                if (media) {
                    const drift = Math.max(-1.5, Math.min(1.5, activeIndex - i));
                    const shift = drift * parallax * mediaSize * 0.06;
                    const gray = grayscale ? (isActive ? 0 : 1) : 0;
                    
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

                // Anima as etiquetas apenas para fotos (painéis que têm texto)
                if (showLabels && bar && text) {
                    if (isActive && text.textContent.trim() !== '') {
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

            updateCardVideos(activeIndex);
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

        // Eventos de mouse, teclado e clique no botão de play na base do vídeo
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
                const playBtnClick = e.target.closest('.ag-panel-play-btn');
                
                // Se clicou no botão de play circular na base do vídeo
                if (playBtnClick && panel.dataset.type === 'video') {
                    e.stopPropagation();
                    const video = panel.querySelector('video.ag-card-video');
                    const iconPlay = playBtnClick.querySelector('.icon-play');
                    const iconPause = playBtnClick.querySelector('.icon-pause');

                    if (video) {
                        if (video.dataset.playingWithAudio === 'true') {
                            // Pausa e volta para mudo
                            video.dataset.playingWithAudio = 'false';
                            video.muted = true;
                            playBtnClick.classList.remove('playing');
                            if (iconPlay) iconPlay.style.display = 'block';
                            if (iconPause) iconPause.style.display = 'none';
                            fadeAudioVolume(originalVolume, 800);
                        } else {
                            // Toca do zero COM SOM dentro do próprio card
                            video.dataset.playingWithAudio = 'true';
                            video.currentTime = 0;
                            video.muted = false;
                            video.volume = 1;
                            video.play().catch(() => {});
                            
                            playBtnClick.classList.add('playing');
                            if (iconPlay) iconPlay.style.display = 'none';
                            if (iconPause) iconPause.style.display = 'block';
                            
                            // Aciona a música de fundo caso ainda não esteja tocando
                            const bgAudio = document.getElementById('bgAudio');
                            if (bgAudio) {
                                if (bgAudio.paused) {
                                    bgAudio.volume = 0.15;
                                    bgAudio.play().then(() => {
                                        document.querySelectorAll('.music-wave-toggle').forEach(w => w.classList.add('playing'));
                                    }).catch(() => {});
                                } else {
                                    fadeAudioVolume(0.15, 800);
                                }
                            }

                            // Ao terminar o vídeo com som, avança o foco para o próximo vídeo sem tocar sozinho
                            video.onended = () => {
                                video.dataset.playingWithAudio = 'false';
                                video.muted = true;
                                video.pause();
                                video.currentTime = 0;
                                playBtnClick.classList.remove('playing');
                                if (iconPlay) iconPlay.style.display = 'block';
                                if (iconPause) iconPause.style.display = 'none';

                                // Restaura o volume original da música de fundo do site
                                fadeAudioVolume(originalVolume, 1000);

                                // Localiza o próximo painel do tipo 'video' na galeria
                                let nextVideoIndex = -1;
                                for (let step = 1; step < count; step++) {
                                    const candidateIdx = (i + step) % count;
                                    if (panels[candidateIdx].dataset.type === 'video') {
                                        nextVideoIndex = candidateIdx;
                                        break;
                                    }
                                }

                                if (nextVideoIndex !== -1 && nextVideoIndex !== i) {
                                    // Move suavemente o foco do acordeão para o próximo card de vídeo
                                    activeIndex = nextVideoIndex;
                                    applyLayout(true);

                                    const nextPanel = panels[nextVideoIndex];
                                    if (nextPanel) {
                                        nextPanel.focus();
                                        nextPanel.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                                    }
                                }
                            };
                        }
                    }
                    return;
                }

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

    // Controle do Vídeo do Maderite na seção Propósito (Preview Mudo com Cortes + Play Completo Oficial)
    function initAboutMaderiteVideo() {
        if (window.lucide) {
            window.lucide.createIcons();
        }

        const aboutCard = document.getElementById('aboutMaderiteCard');
        const video = document.getElementById('aboutMaderiteVideo') || document.getElementById('aboutMaderiteVideoA');
        const playBtn = document.getElementById('aboutMaderitePlayBtn');
        const whiteFlash = document.getElementById('aboutVideoWhiteFlash');
        const bgAudio = document.getElementById('bgAudio');
        const originalVolume = 0.5;

        const VIDEO_PREVIEW_SRC = 'about_maderite_preview.webm';
        const VIDEO_FULL_SRC = 'about_maderite_full.webm';

        if (!video) return;

        let isPlayingWithAudio = false;
        let endingFadeTriggered = false;

        function triggerWhiteFadeIn(duration = 1000) {
            if (!whiteFlash) return;
            whiteFlash.style.transition = `opacity ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
            whiteFlash.style.opacity = '1';
        }

        function triggerWhiteFadeOut(duration = 1000) {
            if (!whiteFlash) return;
            whiteFlash.style.transition = `opacity ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
            whiteFlash.style.opacity = '0';
        }

        // Inicia o preview mudo em loop contínuo (usando o vídeo com os cortes editados e filtro sépia/marrom)
        function startMutedPreview() {
            if (isPlayingWithAudio) return;
            video.classList.remove('full-color');
            if (!video.src.includes(VIDEO_PREVIEW_SRC)) {
                video.src = VIDEO_PREVIEW_SRC;
                video.load();
            }
            video.muted = true;
            video.playsInline = true;
            video.loop = true;
            if (whiteFlash) whiteFlash.style.opacity = '0';
            
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {});
            }
        }

        function stopPreview() {
            if (isPlayingWithAudio) return;
            video.pause();
        }

        // Alterna a reprodução com som diretamente dentro do card no slide
        function toggleAudioPlay(e) {
            if (e) e.stopPropagation();

            const iconPlay = playBtn ? playBtn.querySelector('.icon-play') : null;
            const iconPause = playBtn ? playBtn.querySelector('.icon-pause') : null;

            if (isPlayingWithAudio) {
                // Pausar reprodução do vídeo completo e restaurar o preview
                isPlayingWithAudio = false;
                window.isPropositoVideoPlaying = false;
                document.body.classList.remove('proposito-video-playing');
                endingFadeTriggered = false;

                triggerWhiteFadeIn(400);

                setTimeout(() => {
                    video.classList.remove('full-color');
                    video.muted = true;
                    video.pause();

                    if (playBtn) playBtn.classList.remove('playing');
                    if (iconPlay) iconPlay.style.display = 'block';
                    if (iconPause) iconPause.style.display = 'none';

                    // Restaura música ambiente do site com fade suave de 2.8s
                    if (window.fadeAudioVolume) {
                        window.fadeAudioVolume(originalVolume, 2800);
                    } else if (bgAudio) {
                        bgAudio.volume = originalVolume;
                    }

                    // Volta para o preview mudo em loop com o vídeo de cortes
                    startMutedPreview();
                    setTimeout(() => {
                        triggerWhiteFadeOut(600);
                    }, 50);
                }, 400);
            } else {
                // Inicia a reprodução do vídeo COMPLETO de homenagem com som do início em cores reais
                isPlayingWithAudio = true;
                window.isPropositoVideoPlaying = true;
                document.body.classList.add('proposito-video-playing');
                endingFadeTriggered = false;

                // 1. Aplica tela branca imediata (respiro visual)
                if (whiteFlash) {
                    whiteFlash.style.transition = 'none';
                    whiteFlash.style.opacity = '1';
                }

                // 2. Carrega o vídeo completo pausado no segundo 0 com áudio pleno e cores reais
                video.classList.add('full-color');
                video.src = VIDEO_FULL_SRC;
                video.load();
                video.loop = false;
                video.muted = false;
                video.volume = 1.0;
                video.currentTime = 0;
                video.pause();

                // 3. Abaixa e zera a música de fundo do site de forma gradual
                if (window.fadeAudioVolume) {
                    window.fadeAudioVolume(0, 1500);
                } else if (bgAudio) {
                    bgAudio.volume = 0;
                }

                if (playBtn) playBtn.classList.add('playing');
                if (iconPlay) iconPlay.style.display = 'none';
                if (iconPause) iconPause.style.display = 'block';

                // 4. Delay de 1 segundo em tela branca ANTES de iniciar a reprodução do vídeo
                setTimeout(() => {
                    if (!isPlayingWithAudio) return;

                    // Desvanece a tela branca revelando o primeiro frame
                    triggerWhiteFadeOut(500);

                    // Inicia a reprodução exatamente a partir do segundo 0 sem cortar nada
                    video.currentTime = 0;
                    const playPromise = video.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(() => {});
                    }
                }, 1000);

                // 5. O vídeo toca 100% até o fim - nenhum corte antes do término
                video.ontimeupdate = null;

                video.onended = () => {
                    isPlayingWithAudio = false;
                    endingFadeTriggered = false;

                    if (playBtn) playBtn.classList.remove('playing');
                    if (iconPlay) iconPlay.style.display = 'block';
                    if (iconPause) iconPause.style.display = 'none';

                    // Ao terminar o vídeo por completo: fade para o branco
                    triggerWhiteFadeIn(800);

                    // Mantém em tela branca por 1 segundo após o término do vídeo
                    setTimeout(() => {
                        window.isPropositoVideoPlaying = false;
                        document.body.classList.remove('proposito-video-playing');
                        video.classList.remove('full-color');
                        // Restaura a música do site ao longo de 3.0s de forma acolhedora
                        if (window.fadeAudioVolume) {
                            window.fadeAudioVolume(originalVolume, 3000);
                        }

                        // Reinicia o preview mudo em loop com o vídeo de cortes
                        startMutedPreview();
                        setTimeout(() => {
                            triggerWhiteFadeOut(800);
                        }, 50);
                    }, 1000);
                };
            }
        }

        // Observer para rodar o preview mudo quando o usuário estiver no slide Propósito
        const aboutSection = document.getElementById('proposito') || document.getElementById('quem-somos');
        if (aboutSection) {
            const aboutObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        if (!isPlayingWithAudio) {
                            startMutedPreview();
                        }
                    } else {
                        if (isPlayingWithAudio) {
                            toggleAudioPlay();
                        }
                        stopPreview();
                    }
                });
            }, { threshold: 0.1 });

            aboutObserver.observe(aboutSection);
        }

        // Eventos de clique no botão de play e no card para tocar direto no slide
        if (playBtn) {
            playBtn.addEventListener('click', toggleAudioPlay);
        }

        if (aboutCard) {
            aboutCard.addEventListener('click', (e) => {
                if (!e.target.closest('#aboutMaderitePlayBtn')) {
                    toggleAudioPlay(e);
                }
            });
        }

        // Clicar fora do vídeo faz com que ele encerre a reprodução com som e a música de fundo volte a tocar
        document.addEventListener('click', (e) => {
            if (!isPlayingWithAudio) return;
            if (aboutCard && !aboutCard.contains(e.target)) {
                toggleAudioPlay();
            }
        });
    }

    initAboutMaderiteVideo();

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
                const sectionEl = tEl.closest('section');
                const sectionId = sectionEl ? sectionEl.id : null;
                if (sectionId && slidePhrases[sectionId]) {
                    slideCurrentIndices[sectionId] = (slideCurrentIndices[sectionId] + 1) % slidePhrases[sectionId].length;
                    const nextPhrase = slidePhrases[sectionId][slideCurrentIndices[sectionId]];
                    const line = tEl.querySelector('.title-line-1');
                    if (line) {
                        splitIntoBlurSpans(line, nextPhrase);
                    }
                    if (sectionId === 'depoimentos' && window.rotateDynamicTestimonials) {
                        window.rotateDynamicTestimonials(false);
                    }
                }

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
                        startFixedRotationTimer();
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
            const sectionEl = tEl.closest('section');
            const sectionId = sectionEl ? sectionEl.id : null;
            const wordsList = tEl.querySelectorAll('.blur-word');
            
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
                    if (sectionId && slidePhrases[sectionId]) {
                        slideCurrentIndices[sectionId] = (slideCurrentIndices[sectionId] + 1) % slidePhrases[sectionId].length;
                        const nextPhrase = slidePhrases[sectionId][slideCurrentIndices[sectionId]];
                        const line = tEl.querySelector('.title-line-1');
                        if (line) {
                            splitIntoBlurSpans(line, nextPhrase);
                        }

                        // Sincroniza a mudança dos depoimentos junto com o novo título
                        if (sectionId === 'depoimentos' && window.rotateDynamicTestimonials) {
                            window.rotateDynamicTestimonials(true);
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

        // Rotação de frases por tempo fixo de 15 segundos (independente de interação)
        let rotationTimer = null;

        function startFixedRotationTimer() {
            if (rotationTimer) clearInterval(rotationTimer);
            rotationTimer = setInterval(() => {
                // Não rotaciona se o modal de vídeo ou FAQ estiver aberto
                if (document.body.classList.contains('video-active') || document.body.classList.contains('faq-modal-open')) {
                    return;
                }
                if (activeTitleElement) {
                    replayTitle(activeTitleElement);
                }
            }, 15000);
        }

        startFixedRotationTimer();
    }

    initBlurText();

    // -------------------------------------------------------------
    // DEPOIMENTOS DINÂMICOS & SINCRONIZADOS COM A TROCA DE TÍTULO
    // -------------------------------------------------------------
    const testimonialsPool = [
        {
            text: "Ouvir de surpresa a voz da minha avó abençoando o nascimento do meu filho durante o batizado fez toda a nossa família se emocionar profundamente. Foi, sem dúvidas, o momento mais inesquecível das nossas vidas e uma recordação eterna.",
            name: "Camila M.",
            event: "Batizado",
            location: "Campinas, SP",
            avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80"
        },
        {
            text: "No meu aniversário de 15 anos, assistir à mensagem do meu querido avô me desejando felicidades foi um momento absolutamente mágico e emocionante. Todo mundo na festa chorou e sentiu a presença dele nos abençoando naquela noite especial.",
            name: "Beatriz R.",
            event: "Aniversário de 15 Anos",
            location: "Rio de Janeiro, RJ",
            avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80"
        },
        {
            text: "Receber esse vídeo de surpresa na minha formatura com a voz da minha avó foi o presente mais inestimável que ganhei dos meus pais. Sentir a presença e o carinho dela naquele dia tão importante para mim foi emocionante demais.",
            name: "Júlia C.",
            event: "Formatura de Medicina",
            location: "Curitiba, PR",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
        },
        {
            text: "Quando a mensagem surpresa do meu pai passou no telão antes de eu entrar na igreja, não houve uma única pessoa que não tenha chorado de emoção. Parecia que ele estava ali fisicamente, segurando a minha mão e me levando ao altar.",
            name: "Mariana S.",
            event: "Casamento",
            location: "São Paulo, SP",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
        },
        {
            text: "Quando a voz do meu pai ecoou no auditório durante a colação, falando do orgulho que tinha de me ver formado, o tempo parou. Foi o abraço que eu mais precisei e que nunca mais vou esquecer na minha vida.",
            name: "Lucas T.",
            event: "Formatura de Engenharia",
            location: "Belo Horizonte, MG",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
        },
        {
            text: "Ver minha mãe no telão abençoando as nossas bodas como se estivesse conosco foi indescritível. A delicadeza da voz e o olhar dela trouxeram uma paz que confortou o coração de toda a família.",
            name: "Renata P.",
            event: "Bodas de Prata",
            location: "Porto Alegre, RS",
            avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80"
        },
        {
            text: "Ouvir meu avô dando as boas-vindas ao meu filho recém-nascido foi a experiência mais linda que já vivi. É uma ponte de amor eterno que meu filho guardará para sempre como um tesouro de família.",
            name: "Gustavo M.",
            event: "Nascimento do Filho",
            location: "Brasília, DF",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80"
        },
        {
            text: "Foi a surpresa mais emocionante de toda a minha festa de 50 anos. Ver meu pai falando comigo com aquele carinho de sempre fez parecer que a distância física não existia. Uma emoção indescritível.",
            name: "Cláudia F.",
            event: "Aniversário de 50 Anos",
            location: "Salvador, BA",
            avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80"
        },
        {
            text: "A mensagem da minha mãe durante o nosso noivado emocionou até quem achava que não iria chorar. A naturalidade da voz e das palavras parecia uma bênção vinda direto do coração dela para nós dois.",
            name: "Thiago A.",
            event: "Noivado",
            location: "Florianópolis, SC",
            avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80"
        },
        {
            text: "Reunimos os irmãos no almoço de Dia das Mães e colocamos o vídeo da nossa mãe. Foi um momento de pura comunhão, lágrimas de amor e muitas lembranças boas. Um verdadeiro bálsamo para a nossa saudade.",
            name: "Patrícia L.",
            event: "Dia das Mães",
            location: "Goiânia, GO",
            avatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=150&q=80"
        },
        {
            text: "Meu avô sempre sonhou em me ver advogada. Ouvir os conselhos dele no dia da minha formatura, com aquele jeito manso e sábio, foi o maior presente que a minha família poderia ter me proporcionado.",
            name: "Fernanda B.",
            event: "Formatura de Direito",
            location: "Recife, PE",
            avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150&q=80"
        },
        {
            text: "Ganhei esse vídeo nos meus 18 anos com uma mensagem do meu pai. Sentir a voz dele me orientando para a vida adulta foi emocionante demais. É uma lembrança que vou levar no peito para o resto da vida.",
            name: "Gabriel V.",
            event: "Aniversário de 18 Anos",
            location: "Vitória, ES",
            avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80"
        }
    ];

    let currentTestimonialBatch = 0;

    function updateTestimonialCardData(card, data) {
        if (!card || !data) return;
        const textEl = card.querySelector('.testimonial-text');
        const avatarEl = card.querySelector('.user-avatar');
        const nameEl = card.querySelector('.testimonial-user h4');
        const spans = card.querySelectorAll('.testimonial-user span');

        if (textEl) textEl.textContent = `"${data.text}"`;
        if (avatarEl) avatarEl.style.backgroundImage = `url('${data.avatar}')`;
        if (nameEl) nameEl.textContent = data.name;
        if (spans.length >= 2) {
            spans[0].textContent = data.event;
            spans[1].textContent = data.location;
        }
    }

    function rotateDynamicTestimonials(withAnimation = true) {
        const testimonialsContainer = document.querySelector('.testimonials-row');
        if (!testimonialsContainer) return;

        currentTestimonialBatch = (currentTestimonialBatch + 1) % 3; // 3 lotes de 4 depoimentos
        const startIdx = currentTestimonialBatch * 4;
        const selected = testimonialsPool.slice(startIdx, startIdx + 4);

        const cards = testimonialsContainer.querySelectorAll('.testimonial-card');

        if (cards.length === 0) {
            renderTestimonialsCards(testimonialsContainer, selected);
            return;
        }

        if (withAnimation && window.gsap) {
            gsap.killTweensOf(cards);
            gsap.timeline()
                .to(cards, {
                    opacity: 0,
                    y: -18,
                    duration: 0.32,
                    stagger: 0.05,
                    ease: 'power2.in',
                    onComplete: () => {
                        cards.forEach((card, idx) => {
                            if (selected[idx]) {
                                updateTestimonialCardData(card, selected[idx]);
                            }
                        });
                    }
                })
                .fromTo(cards,
                    { opacity: 0, y: 18 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.48,
                        stagger: 0.07,
                        ease: 'power2.out',
                        clearProps: 'transform,opacity'
                    }
                );
        } else {
            cards.forEach((card, idx) => {
                if (selected[idx]) {
                    updateTestimonialCardData(card, selected[idx]);
                }
            });
        }
    }
    window.rotateDynamicTestimonials = rotateDynamicTestimonials;

    // Inicialização do primeiro lote na carga da página
    const initialContainer = document.querySelector('.testimonials-row');
    if (initialContainer) {
        const initialSelected = testimonialsPool.slice(0, 4);
        renderTestimonialsCards(initialContainer, initialSelected);
    }
});
