// Inicialização dos Ícones Lucide e Interações Dinâmicas
document.addEventListener('DOMContentLoaded', () => {
    // Renderizar Ícones Lucide
    if (window.lucide) {
        lucide.createIcons();
    }

    // Scroll Navbar Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.padding = '14px 0';
            navbar.style.background = 'transparent';
            navbar.style.boxShadow = 'none';
        } else {
            navbar.style.padding = '20px 0';
            navbar.style.background = 'transparent';
            navbar.style.boxShadow = 'none';
        }
    });

    // Clique na Logo - Recarrega a página limpa do início para reexecutar todas as animações
    document.querySelectorAll('.brand-logo').forEach(logo => {
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = window.location.pathname;
        });
    });

    // Detectar dinamicamente a lista de slides de acordo com o dispositivo (Desktop vs Mobile)
    let sections;
    let currentIdx = 0;
    let observer;

    function updateSectionsList() {
        if (observer) {
            observer.disconnect();
        }

        sections = document.querySelectorAll('.hero-section, .how-it-works, .use-cases, .testimonials, .contrate-section, .faq-section');

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
                } else {
                    // Esconde o texto dos slides que saíram da tela para reiniciar
                    if (title) {
                        title.style.animation = 'none';
                        title.style.clipPath = 'inset(0 100% 0 0)';
                    }
                }
            });
        }, observerOptions);

        sections.forEach(sec => observer.observe(sec));
    }

    updateSectionsList();
    window.addEventListener('resize', updateSectionsList);

    function goToSlide(index) {
        if (!sections || index < 0 || index >= sections.length) return;
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
    }

    // Smooth scroll para links internos e sincronização do slide ativo
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Temporariamente desativar scroll snap para evitar conflitos na animação
                document.documentElement.classList.add('disable-snap');
                
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Dispara a animação no clique instantaneamente (atraso zero)
                const targetTitle = targetElement.querySelector('.handwritten-title');
                if (targetTitle) {
                    targetTitle.style.animation = 'none';
                    targetTitle.offsetHeight; // Reflow
                    targetTitle.style.animation = 'revealStaticText 1.5s linear forwards';
                }
                
                // Sincroniza o índice do slide ativo
                let targetIdx = -1;
                sections.forEach((sec, idx) => {
                    if (sec === targetElement || targetElement.contains(sec)) {
                        if (targetIdx === -1) targetIdx = idx;
                    }
                });
                if (targetIdx !== -1) {
                    currentIdx = targetIdx;
                }

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

    // Animação de Ondas Douradas Sutis em Canvas (Fundo Preto com Desfoque)
    const canvas = document.getElementById('wavesCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        
        // Reduz a resolução interna do canvas para otimizar drasticamente a performance de renderização.
        // O navegador fará o upscale bilinear automático no CSS, gerando um desfoque suave e natural.
        const scale = 0.25;
        let width = canvas.width = Math.floor(window.innerWidth * scale);
        let height = canvas.height = Math.floor(window.innerHeight * scale);

        // Configuração inicial das Ondas Douradas (com amplitude escalada)
        let waves = [
            { y: height * 0.5, length: 0.005, amplitude: 90 * scale, speed: 0.008, color: 'rgba(156, 114, 71, 0.25)' },
            { y: height * 0.45, length: 0.004, amplitude: 120 * scale, speed: 0.005, color: 'rgba(180, 140, 100, 0.18)' },
            { y: height * 0.55, length: 0.006, amplitude: 70 * scale, speed: 0.011, color: 'rgba(130, 90, 50, 0.22)' },
            { y: height * 0.6, length: 0.003, amplitude: 140 * scale, speed: 0.004, color: 'rgba(156, 114, 71, 0.12)' }
        ];

        window.addEventListener('resize', () => {
            width = canvas.width = Math.floor(window.innerWidth * scale);
            height = canvas.height = Math.floor(window.innerHeight * scale);
            
            // Atualizar posições e amplitudes conforme a nova altura escalada
            waves[0].y = height * 0.5; waves[0].amplitude = 90 * scale;
            waves[1].y = height * 0.45; waves[1].amplitude = 120 * scale;
            waves[2].y = height * 0.55; waves[2].amplitude = 70 * scale;
            waves[3].y = height * 0.6; waves[3].amplitude = 140 * scale;
        });

        let increment = 0;

        function animateWaves() {
            // Se o modal de vídeo estiver ativo ou a página oculta, pausa o processamento gráfico
            if (document.body.classList.contains('video-active') || document.hidden) {
                requestAnimationFrame(animateWaves);
                return;
            }

            ctx.clearRect(0, 0, width, height);

            waves.forEach(wave => {
                ctx.beginPath();
                ctx.moveTo(0, wave.y);

                // Incremento de 8 pixels por passo no loop reduz o uso de CPU/GPU em 87%
                const step = 8;
                for (let i = 0; i < width + step; i += step) {
                    // Ajusta a coordenada x na função seno multiplicando por 1/scale para manter a mesma frequência original no espaço real
                    const realX = i / scale;
                    ctx.lineTo(i, wave.y + Math.sin(realX * wave.length + increment * wave.speed * 100) * wave.amplitude);
                }

                ctx.lineTo(width, height);
                ctx.lineTo(0, height);
                ctx.closePath();

                const gradient = ctx.createLinearGradient(0, 0, 0, height);
                gradient.addColorStop(0, 'rgba(156, 114, 71, 0.0)');
                gradient.addColorStop(0.5, wave.color);
                gradient.addColorStop(1, 'rgba(156, 114, 71, 0.65)');

                ctx.fillStyle = gradient;
                ctx.fill();
            });

            increment += 0.015;
            requestAnimationFrame(animateWaves);
        }

        animateWaves();
    }

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

    // Lógica do Player de Áudio Fixo Minimalista
    const playlist = [
        'bg_music.mp3',
        'bg_music_02.mp3'
    ];

    const bgAudio = document.getElementById('bgAudio');
    if (bgAudio) {
        // Escolhe uma música aleatoriamente da playlist no carregamento/recarregamento da página
        const randomTrack = playlist[Math.floor(Math.random() * playlist.length)];
        bgAudio.src = randomTrack;
        bgAudio.load();
    }

    const audioToggleBtn = document.getElementById('audioToggleBtn');
    const audioIconPlay = document.getElementById('audioIconPlay');
    const audioIconPause = document.getElementById('audioIconPause');
    const soundWaves = document.querySelectorAll('.sound-waves');

    if (bgAudio) {
        bgAudio.addEventListener('play', () => updateAudioUI(true));
        bgAudio.addEventListener('pause', () => updateAudioUI(false));

        function updateAudioUI(isPlaying) {
            if (isPlaying) {
                if (audioIconPlay) audioIconPlay.style.display = 'none';
                if (audioIconPause) audioIconPause.style.display = 'inline-block';
                if (audioToggleBtn) audioToggleBtn.classList.add('is-playing');
                soundWaves.forEach(wave => wave.classList.add('playing'));
            } else {
                if (audioIconPlay) audioIconPlay.style.display = 'inline-block';
                if (audioIconPause) audioIconPause.style.display = 'none';
                if (audioToggleBtn) audioToggleBtn.classList.remove('is-playing');
                soundWaves.forEach(wave => wave.classList.remove('playing'));
            }
        }

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
                
                // Atualizar dinamicamente o texto do Upsell com base no formato primário selecionado
                const upsellTitle = card.querySelector('.upsell-text strong');
                if (upsellTitle) {
                    const format = btn.getAttribute('data-format');
                    if (format === 'horizontal') {
                        upsellTitle.textContent = 'Adicionar formato Vertical (+50%)';
                    } else {
                        upsellTitle.textContent = 'Adicionar formato Horizontal (+50%)';
                    }
                }
            });
        });

        // Atualizar preço dinamicamente ao marcar/desmarcar o Upsell Multiformato
        if (upsellCheckbox) {
            upsellCheckbox.addEventListener('change', (e) => {
                // Se foi um evento simulado (desmarcando por causa da troca de card), evita loop infinito
                if (e.isTrigger || !upsellCheckbox.checked) {
                    // apenas atualiza o preço para o original
                    const formatted = basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    const parts = formatted.split(',');
                    amountSpan.textContent = parts[0];
                    if (centsSpan) centsSpan.textContent = ',00';
                    if (subtitleSpan) subtitleSpan.textContent = 'Formato único à escolha (Horizontal ou Vertical)';
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
                    if (subtitleSpan) subtitleSpan.textContent = 'Multiformato Incluído (Horizontal + Vertical)';
                } else {
                    const formatted = basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    const parts = formatted.split(',');
                    amountSpan.textContent = parts[0];
                    if (centsSpan) centsSpan.textContent = ',00';
                    if (subtitleSpan) subtitleSpan.textContent = 'Formato único à escolha (Horizontal ou Vertical)';
                }
            });
        }
    });

    // Interatividade do FAQ Accordion (Esconde/Mostra Respostas)
    document.querySelectorAll('.faq-question').forEach(button => {
        button.addEventListener('click', () => {
            const faqItem = button.parentElement;
            const isOpen = faqItem.classList.contains('active');
            
            // Fecha todos os outros itens para um efeito sanfona limpo
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
                const answer = item.querySelector('.faq-answer');
                if (answer) {
                    answer.style.maxHeight = null;
                }
            });
            
            // Se o item clicado não estava aberto, abre-o
            if (!isOpen) {
                faqItem.classList.add('active');
                const answer = faqItem.querySelector('.faq-answer');
                if (answer) {
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                }
            }
        });
    });



    // Inicialização do Fundo de Raios de Luz WebGL (OGL)
    function initGalaxy() {
        const ctn = document.getElementById('galaxyBg');
        if (!ctn || !window.ogl) return;

        const { Renderer, Program, Mesh, Triangle } = window.ogl;

        const renderer = new Renderer({
            dpr: Math.min(window.devicePixelRatio, 2),
            alpha: true
        });
        const gl = renderer.gl;
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

uniform float iTime;
uniform vec2  iResolution;

uniform vec2  rayPos;
uniform vec2  rayDir;
uniform vec3  raysColor;
uniform float raysSpeed;
uniform float lightSpread;
uniform float rayLength;
uniform float pulsating;
uniform float fadeDistance;
uniform float saturation;
uniform vec2  mousePos;
uniform float mouseInfluence;
uniform float noiseAmount;
uniform float distortion;

varying vec2 vUv;

float noise(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord,
                  float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  vec2 dirNorm = normalize(sourceToCoord);
  float cosAngle = dot(dirNorm, rayRefDirection);

  float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;
  
  float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));

  float distance = length(sourceToCoord);
  float maxDistance = iResolution.x * rayLength;
  float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);
  
  float fadeFalloff = clamp((iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance), 0.5, 1.0);
  float pulse = pulsating > 0.5 ? (0.8 + 0.2 * sin(iTime * speed * 3.0)) : 1.0;

  float baseStrength = clamp(
    (0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) +
    (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)),
    0.0, 1.0
  );

  return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
  
  vec2 finalRayDir = rayDir;
  if (mouseInfluence > 0.0) {
    vec2 mouseScreenPos = mousePos * iResolution.xy;
    vec2 mouseDirection = normalize(mouseScreenPos - rayPos);
    finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));
  }

  vec4 rays1 = vec4(1.0) *
               rayStrength(rayPos, finalRayDir, coord, 36.2214, 21.11349,
                           1.5 * raysSpeed);
  vec4 rays2 = vec4(1.0) *
               rayStrength(rayPos, finalRayDir, coord, 22.3991, 18.0234,
                           1.1 * raysSpeed);

  fragColor = rays1 * 0.5 + rays2 * 0.4;

  if (noiseAmount > 0.0) {
    float n = noise(coord * 0.01 + iTime * 0.1);
    fragColor.rgb *= (1.0 - noiseAmount + noiseAmount * n);
  }

  float brightness = 1.0 - (coord.y / iResolution.y);
  fragColor.x *= mix(0.61, 0.9, brightness);
  fragColor.y *= mix(0.45, 0.9, brightness);
  fragColor.z *= mix(0.28, 1.0, brightness);

  if (saturation != 1.0) {
    float gray = dot(fragColor.rgb, vec3(0.299, 0.587, 0.114));
    fragColor.rgb = mix(vec3(gray), fragColor.rgb, saturation);
  }

  fragColor.rgb *= raysColor;
}

void main() {
  vec4 color;
  mainImage(color, gl_FragCoord.xy);
  gl_FragColor  = color;
}`;

        const hexToRgb = (hex) => {
            const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [1, 1, 1];
        };

        const getAnchorAndDir = (origin, w, h) => {
            const outside = 0.2;
            switch (origin) {
                case 'top-left':
                    return { anchor: [0, -outside * h], dir: [0, 1] };
                case 'top-right':
                    return { anchor: [w, -outside * h], dir: [0, 1] };
                case 'left':
                    return { anchor: [-outside * w, 0.5 * h], dir: [1, 0] };
                case 'right':
                    return { anchor: [(1 + outside) * w, 0.5 * h], dir: [-1, 0] };
                case 'bottom-left':
                    return { anchor: [0, (1 + outside) * h], dir: [0, -1] };
                case 'bottom-center':
                    return { anchor: [0.5 * w, (1 + outside) * h], dir: [0, -1] };
                case 'bottom-right':
                    return { anchor: [w, (1 + outside) * h], dir: [0, -1] };
                default: // "top-center"
                    return { anchor: [0.5 * w, -outside * h], dir: [0, 1] };
            }
        };

        const raysColor = '#ffffff';
        const raysOrigin = 'top-center';
        const raysSpeed = 1.0;
        const lightSpread = 1.0;
        const rayLength = 2.0;
        const pulsating = false;
        const fadeDistance = 1.0;
        const saturation = 1.0;
        const followMouse = true;
        const mouseInfluence = 0.1;
        const noiseAmount = 0.0;
        const distortion = 0.0;

        const uniforms = {
            iTime: { value: 0 },
            iResolution: { value: [1, 1] },
            rayPos: { value: [0, 0] },
            rayDir: { value: [0, 1] },
            raysColor: { value: hexToRgb(raysColor) },
            raysSpeed: { value: raysSpeed },
            lightSpread: { value: lightSpread },
            rayLength: { value: rayLength },
            pulsating: { value: pulsating ? 1.0 : 0.0 },
            fadeDistance: { value: fadeDistance },
            saturation: { value: saturation },
            mousePos: { value: [0.5, 0.5] },
            mouseInfluence: { value: mouseInfluence },
            noiseAmount: { value: noiseAmount },
            distortion: { value: distortion }
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
            const dpr = renderer.dpr;
            const w = wCSS * dpr;
            const h = hCSS * dpr;
            uniforms.iResolution.value = [w, h];
            const { anchor, dir } = getAnchorAndDir(raysOrigin, w, h);
            uniforms.rayPos.value = anchor;
            uniforms.rayDir.value = dir;
        };

        const mouse = { x: 0.5, y: 0.5 };
        const smoothMouse = { x: 0.5, y: 0.5 };

        if (followMouse) {
            window.addEventListener('mousemove', (e) => {
                const rect = ctn.getBoundingClientRect();
                mouse.x = (e.clientX - rect.left) / rect.width;
                mouse.y = (e.clientY - rect.top) / rect.height;
            });
        }

        let animationFrameId;
        const loop = (t) => {
            uniforms.iTime.value = t * 0.001;

            if (followMouse && mouseInfluence > 0.0) {
                const smoothing = 0.92;
                smoothMouse.x = smoothMouse.x * smoothing + mouse.x * (1 - smoothing);
                smoothMouse.y = smoothMouse.y * smoothing + mouse.y * (1 - smoothing);
                uniforms.mousePos.value = [smoothMouse.x, smoothMouse.y];
            }

            try {
                renderer.render({ scene: mesh });
                animationFrameId = requestAnimationFrame(loop);
            } catch (error) {
                console.warn('WebGL rendering error:', error);
            }
        };

        window.addEventListener('resize', updatePlacement);
        updatePlacement();
        animationFrameId = requestAnimationFrame(loop);
    }

    initGalaxy();

    // Inicialização da Galeria de Acordeão com GSAP
    function initAccordionGallery() {
        const gallery = document.getElementById('heroAccordion');
        if (!gallery) return;

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
});

