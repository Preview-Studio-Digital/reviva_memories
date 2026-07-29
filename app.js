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

    // Smooth scroll para links internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
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
});
