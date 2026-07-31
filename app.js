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
            navbar.style.background = 'rgba(11, 11, 12, 0.95)';
            navbar.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
        } else {
            navbar.style.padding = '20px 0';
            navbar.style.background = 'rgba(11, 11, 12, 0.6)';
            navbar.style.boxShadow = 'none';
        }
    });

    // Detectar dinamicamente a lista de slides de acordo com o dispositivo (Desktop vs Mobile)
    let sections;
    let currentIdx = 0;
    let observer;

    function updateSectionsList() {
        if (observer) {
            observer.disconnect();
        }

        if (window.innerWidth <= 768) {
            // Mobile: Dividido por cabeçalhos e rows de 2 em 2
            sections = document.querySelectorAll('.hero-section, .how-it-works .section-header, .steps-row, .use-cases .section-header, .cases-row, .testimonials .section-header, .testimonials-row, .contrate-section');
        } else {
            // Desktop: Seções inteiras tradicionais
            sections = document.querySelectorAll('.hero-section, .how-it-works, .use-cases, .testimonials, .contrate-section');
        }

        // Re-sincronizar o IntersectionObserver
        const observerOptions = {
            root: null,
            rootMargin: '-5% 0px -5% 0px',
            threshold: 0.2
        };

        observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const index = Array.from(sections).indexOf(entry.target);
                    if (index !== -1) {
                        currentIdx = index;
                    }

                    // Reiniciar a revelação suave da esquerda para a direita mantendo o texto 100% estático
                    const title = entry.target.querySelector('.handwritten-title');
                    if (title) {
                        title.style.animation = 'none';
                        title.offsetHeight; // Reflow
                        title.style.animation = 'revealStaticText 2.5s cubic-bezier(0.25, 1, 0.5, 1) forwards';
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
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Sincroniza o índice do slide ativo logo após o início do scroll
                setTimeout(() => {
                    let targetIdx = -1;
                    sections.forEach((sec, idx) => {
                        if (sec === targetElement || targetElement.contains(sec)) {
                            if (targetIdx === -1) targetIdx = idx;
                        }
                    });
                    if (targetIdx !== -1) {
                        currentIdx = targetIdx;
                    }
                }, 600);
            }
        });
    });

    // Animação de Ondas Douradas Sutis em Canvas (Fundo Preto com Desfoque)
    const canvas = document.getElementById('wavesCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });

        // Configuração das Ondas Douradas
        const waves = [
            { y: height * 0.5, length: 0.005, amplitude: 90, speed: 0.008, color: 'rgba(197, 160, 89, 0.25)' },
            { y: height * 0.45, length: 0.004, amplitude: 120, speed: 0.005, color: 'rgba(247, 230, 165, 0.18)' },
            { y: height * 0.55, length: 0.006, amplitude: 70, speed: 0.011, color: 'rgba(158, 123, 54, 0.22)' },
            { y: height * 0.6, length: 0.003, amplitude: 140, speed: 0.004, color: 'rgba(255, 215, 0, 0.12)' }
        ];

        let increment = 0;

        function animateWaves() {
            ctx.fillStyle = '#0b0b0c';
            ctx.fillRect(0, 0, width, height);

            waves.forEach(wave => {
                ctx.beginPath();
                ctx.moveTo(0, wave.y);

                for (let i = 0; i < width; i++) {
                    ctx.lineTo(i, wave.y + Math.sin(i * wave.length + increment * wave.speed * 100) * wave.amplitude * Math.sin(increment * 0.005));
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

    if (videoModal) {
        // Abrir Modal
        document.querySelectorAll('.watch-video-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
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

        // Fechar ao clicar no fundo escuro do Modal
        videoModal.addEventListener('click', (e) => {
            if (e.target === videoModal) {
                closeVideoModal();
            }
        });

        // Fechar com a Tecla ESC (Escape)
        document.addEventListener('keydown', (e) => {
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
    }
});

