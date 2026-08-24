/**
 * Reviva Memories - Supabase Client Configuration
 * Permite conexão com o Supabase ou modo Simulação (Mock) local para testes e desenvolvimento.
 */

const SUPABASE_CONFIG = {
    // Insira sua URL e Anon Key do Supabase aqui quando desejar conectar em produção:
    url: window.ENV_SUPABASE_URL || 'https://sua-instancia.supabase.co',
    anonKey: window.ENV_SUPABASE_ANON_KEY || 'sua-anon-key-aqui'
};

class RevivaDataService {
    constructor() {
        this.isMock = !window.ENV_SUPABASE_URL || window.ENV_SUPABASE_URL.includes('sua-instancia');
        this.supabase = null;

        if (!this.isMock && window.supabase) {
            this.supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
            console.log("🕊️ [Reviva] Conectado ao Supabase em Produção");
        } else {
            console.log("✨ [Reviva] Modo Simulação / Local Storage Ativo (Pronto para testes)");
        }
    }

    // Obter dados da sessão do usuário
    async getCurrentUser() {
        if (!this.isMock && this.supabase) {
            const { data: { user } } = await this.supabase.auth.getUser();
            return user;
        }
        const saved = localStorage.getItem('reviva_mock_user');
        return saved ? JSON.parse(saved) : {
            id: 'mock-user-123',
            email: 'cliente@exemplo.com',
            user_metadata: { full_name: 'Mariana Silva' }
        };
    }

    // Salvar ou atualizar pedido do cliente
    async saveOrderProgress(orderData) {
        if (!this.isMock && this.supabase) {
            const { data, error } = await this.supabase.from('orders').upsert(orderData).select();
            if (error) throw error;
            return data[0];
        }
        const current = JSON.parse(localStorage.getItem('reviva_current_order') || '{}');
        const updated = { ...current, ...orderData, updated_at: new Date().toISOString() };
        localStorage.setItem('reviva_current_order', JSON.stringify(updated));
        return updated;
    }

    // Carregar pedido atual
    async getCurrentOrder() {
        if (!this.isMock && this.supabase) {
            const user = await this.getCurrentUser();
            if (!user) return null;
            const { data, error } = await this.supabase
                .from('orders')
                .select('*, interviews(*), scripts(*), approvals(*), final_videos(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            return data;
        }
        const saved = localStorage.getItem('reviva_current_order');
        if (saved) {
            const parsed = JSON.parse(saved);
            const urlPlan = new URLSearchParams(window.location.search).get('plano') || new URLSearchParams(window.location.search).get('plan');
            parsed.plan_name = urlPlan || 'affectus';
            return parsed;
        }

        // Estado inicial de exemplo para demonstração (Padrão: Plano Affectus - 1 Minuto)
        const initialOrder = {
            id: 'ord-demo-001',
            user_id: 'mock-user-123',
            plan_name: 'affectus', // 1 minuto (Padrão Oficial de Testes)
            status: 'onboarding',
            background_choice: 'jardim',
            music_choice: 'piano_emocao',
            public_token: 'reviva_token_exemplo_777',
            photos: [],
            audios: [],
            interview: null,
            script: null,
            approval: {
                watermarked_image_url: 'gallery_homem_01.jpg',
                voice_audio_preview_url: 'bg_music.mp3',
                image_approved: false,
                audio_approved: false
            },
            final_video: {
                video_url: 'video_01.webm',
                duration_sec: 60
            }
        };
        localStorage.setItem('reviva_current_order', JSON.stringify(initialOrder));
        return initialOrder;
    }

    // Salvar Roteiro Aprovado
    async saveApprovedScript(orderId, scriptText, wordCount) {
        if (!this.isMock && this.supabase) {
            const { data, error } = await this.supabase.from('scripts').insert({
                order_id: orderId,
                generated_text: scriptText,
                approved_text: scriptText,
                word_count: wordCount,
                approved_at: new Date().toISOString()
            }).select();
            if (error) throw error;
            await this.supabase.from('orders').update({ status: 'em_producao_midias' }).eq('id', orderId);
            return data[0];
        }
        const order = await this.getCurrentOrder();
        order.script = {
            approved_text: scriptText,
            word_count: wordCount,
            approved_at: new Date().toISOString()
        };
        order.status = 'em_producao_midias';
        localStorage.setItem('reviva_current_order', JSON.stringify(order));
        return order.script;
    }

    // Salvar Aprovação de Imagem e Áudio
    async saveMediaApproval(orderId, isImageApproved, isAudioApproved, feedback = '') {
        if (!this.isMock && this.supabase) {
            const { data, error } = await this.supabase.from('approvals').upsert({
                order_id: orderId,
                image_approved: isImageApproved,
                audio_approved: isAudioApproved,
                client_feedback: feedback,
                approved_at: new Date().toISOString()
            }).select();
            if (error) throw error;
            await this.supabase.from('orders').update({ status: 'renderizando_video' }).eq('id', orderId);
            return data[0];
        }
        const order = await this.getCurrentOrder();
        order.approval = {
            ...order.approval,
            image_approved: isImageApproved,
            audio_approved: isAudioApproved,
            client_feedback: feedback,
            approved_at: new Date().toISOString()
        };
        order.status = 'renderizando_video';
        localStorage.setItem('reviva_current_order', JSON.stringify(order));
        return order.approval;
    }
}

window.revivaData = new RevivaDataService();
