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
            { y: height * 0.5, length: 0.005, amplitude: 90 * scale, speed: 0.008, color: 'rgba(197, 160, 89, 0.25)' },
            { y: height * 0.45, length: 0.004, amplitude: 120 * scale, speed: 0.005, color: 'rgba(247, 230, 165, 0.18)' },
            { y: height * 0.55, length: 0.006, amplitude: 70 * scale, speed: 0.011, color: 'rgba(158, 123, 54, 0.22)' },
            { y: height * 0.6, length: 0.003, amplitude: 140 * scale, speed: 0.004, color: 'rgba(255, 215, 0, 0.12)' }
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

            ctx.fillStyle = '#0b0b0c';
            ctx.fillRect(0, 0, width, height);

            waves.forEach(wave => {
                ctx.beginPath();
                ctx.moveTo(0, wave.y);

                // Incremento de 8 pixels por passo no loop reduz o uso de CPU/GPU em 87%
                const step = 8;
                for (let i = 0; i < width + step; i += step) {
                    // Ajusta a coordenada x na função seno multiplicando por 1/scale para manter a mesma frequência original no espaço real
                    const realX = i / scale;
                    ctx.lineTo(i, wave.y + Math.sin(realX * wave.length + increment * wave.speed * 100) * wave.amplitude * Math.sin(increment * 0.005));
                }

                ctx.lineTo(width, height);
                ctx.lineTo(0, height);
                ctx.closePath();

                const gradient = ctx.createLinearGradient(0, 0, width, height);
                gradient.addColorStop(0, wave.color);
                gradient.addColorStop(0.5, 'rgba(197, 160, 89, 0.15)');
                gradient.addColorStop(1, 'rgba(11, 11, 12, 0.9)');

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
        if (bgAudio && !bgAudio.paused) {
            originalVolume = bgAudio.volume || 1;
            // Abaixar volume da música de fundo imediatamente para 0.25
            bgAudio.volume = 0.25;
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
    const bgAudio = document.getElementById('bgAudio');
    const audioToggleBtn = document.getElementById('audioToggleBtn');
    const audioIconPlay = document.getElementById('audioIconPlay');
    const audioIconPause = document.getElementById('audioIconPause');
    const soundWaves = document.querySelectorAll('.sound-waves');

    if (bgAudio && audioToggleBtn) {
        audioToggleBtn.addEventListener('click', () => {
            if (bgAudio.paused) {
                bgAudio.play().then(() => {
                    updateAudioUI(true);
                }).catch(err => {
                    console.log("Erro ao reproduzir áudio:", err);
                });
            } else {
                bgAudio.pause();
                updateAudioUI(false);
            }
        });

        bgAudio.addEventListener('play', () => updateAudioUI(true));
        bgAudio.addEventListener('pause', () => updateAudioUI(false));

        function updateAudioUI(isPlaying) {
            if (isPlaying) {
                audioIconPlay.style.display = 'none';
                audioIconPause.style.display = 'inline-block';
                audioToggleBtn.classList.add('is-playing');
                soundWaves.forEach(wave => wave.classList.add('playing'));
            } else {
                audioIconPlay.style.display = 'inline-block';
                audioIconPause.style.display = 'none';
                audioToggleBtn.classList.remove('is-playing');
                soundWaves.forEach(wave => wave.classList.remove('playing'));
            }
        }

        // TEMPORARIAMENTE DESABILITADO (Toque/clique na tela para auto-play)
        /*
        function startAudioOnFirstInteraction() {
            if (bgAudio.paused && !document.body.classList.contains('video-active')) {
                bgAudio.play().then(() => {
                    updateAudioUI(true);
                }).catch(err => {
                    console.log("Aguardando interação para reprodução:", err);
                });
            }
            document.removeEventListener('touchstart', startAudioOnFirstInteraction);
            document.removeEventListener('click', startAudioOnFirstInteraction);
        }

        document.addEventListener('touchstart', startAudioOnFirstInteraction, { passive: true });
        document.addEventListener('click', startAudioOnFirstInteraction);
        */
    }

    // Interatividade da Tabela de Planos (Seleção de Formato e Upsell Multiformato)
    document.querySelectorAll('.plan-card').forEach(card => {
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
            upsellCheckbox.addEventListener('change', () => {
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



    // Inicialização do Fundo de Galáxia WebGL (OGL)
    function initGalaxy() {
        const ctn = document.getElementById('galaxyBg');
        if (!ctn || !window.ogl) return;

        const { Renderer, Program, Mesh, Color, Triangle } = window.ogl;

        // Configurações padrão do componente
        const focal = [0.5, 0.5];
        const rotation = [1.0, 0.0];
        const starSpeed = 0.5;
        const density = 0.7; // Restaurado para 0.7
        const hueShift = 360; // Atualizado de 140 para 360
        const disableAnimation = false;
        const speed = 1.0;
        const mouseInteraction = true; // Mantido ativo
        const glowIntensity = 0.3; // Restaurado para 0.3
        const saturation = 0.6; // Atualizado de 0.0 para 0.6 (adiciona cor suave às estrelas)
        const mouseRepulsion = false; // Desativado (muda para o efeito de paralaxe suave)
        const repulsionStrength = 2;
        const twinkleIntensity = 0.3;
        const rotationSpeed = 0.1;
        const autoCenterRepulsion = 0;
        const transparent = true;

        const targetMousePos = { x: 0.5, y: 0.5 };
        const smoothMousePos = { x: 0.5, y: 0.5 };
        let targetMouseActive = 0.0;
        let smoothMouseActive = 0.0;

        const renderer = new Renderer({
            alpha: transparent,
            premultipliedAlpha: false
        });
        const gl = renderer.gl;

        if (transparent) {
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.clearColor(0, 0, 0, 0);
        } else {
            gl.clearColor(0, 0, 0, 1);
        }

        let program;

        function resize() {
            const scale = 1;
            renderer.setSize(ctn.offsetWidth * scale, ctn.offsetHeight * scale);
            if (program) {
                program.uniforms.uResolution.value = new Color(
                    gl.canvas.width,
                    gl.canvas.height,
                    gl.canvas.width / gl.canvas.height
                );
            }
        }
        window.addEventListener('resize', resize, false);

        const vertexShader = `
        attribute vec2 uv;
        attribute vec2 position;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 0, 1);
        }
        `;

        const fragmentShader = `
        precision highp float;
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
              float flareSize = smoothstep(0.9, 1.0, size) * tri(uStarSpeed / (PERIOD * seed + 1.0));
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
            gl_FragColor = vec4(col * alpha, alpha);
          } else {
            gl_FragColor = vec4(col, 1.0);
          }
        }
        `;

        const geometry = new Triangle(gl);
        program = new Program(gl, {
            vertex: vertexShader,
            fragment: fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uResolution: {
                    value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height)
                },
                uFocal: { value: new Float32Array(focal) },
                uRotation: { value: new Float32Array(rotation) },
                uStarSpeed: { value: starSpeed },
                uDensity: { value: density },
                uHueShift: { value: hueShift },
                uSpeed: { value: speed },
                uMouse: {
                    value: new Float32Array([smoothMousePos.x, smoothMousePos.y])
                },
                uGlowIntensity: { value: glowIntensity },
                uSaturation: { value: saturation },
                uMouseRepulsion: { value: mouseRepulsion },
                uTwinkleIntensity: { value: twinkleIntensity },
                uRotationSpeed: { value: rotationSpeed },
                uRepulsionStrength: { value: repulsionStrength },
                uMouseActiveFactor: { value: 0.0 },
                uAutoCenterRepulsion: { value: autoCenterRepulsion },
                uTransparent: { value: transparent }
            }
        });

        const mesh = new Mesh(gl, { geometry, program });
        let animateId;

        function update(t) {
            animateId = requestAnimationFrame(update);
            if (!disableAnimation) {
                program.uniforms.uTime.value = t * 0.001;
                program.uniforms.uStarSpeed.value = (t * 0.001 * starSpeed) / 10.0;
            }

            const lerpFactor = 0.05;
            smoothMousePos.x += (targetMousePos.x - smoothMousePos.x) * lerpFactor;
            smoothMousePos.y += (targetMousePos.y - smoothMousePos.y) * lerpFactor;
            smoothMouseActive += (targetMouseActive - smoothMouseActive) * lerpFactor;

            program.uniforms.uMouse.value[0] = smoothMousePos.x;
            program.uniforms.uMouse.value[1] = smoothMousePos.y;
            program.uniforms.uMouseActiveFactor.value = smoothMouseActive;

            renderer.render({ scene: mesh });
        }

        resize();
        animateId = requestAnimationFrame(update);
        ctn.appendChild(gl.canvas);

        function handleMouseMove(e) {
            const rect = ctn.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = 1.0 - (e.clientY - rect.top) / rect.height;
            targetMousePos.x = x;
            targetMousePos.y = y;
            targetMouseActive = 1.0;
        }

        function handleMouseLeave() {
            targetMouseActive = 0.0;
        }

        if (mouseInteraction) {
            ctn.addEventListener('mousemove', handleMouseMove);
            ctn.addEventListener('mouseleave', handleMouseLeave);
        }
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

