-- ==========================================================================
-- REVIVA MEMORIES - SUPABASE DATABASE SCHEMA & POLICIES
-- ==========================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DE PERFIS DE USUÁRIO (Vinculado ao auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABELA DE PEDIDOS (ORDERS)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    plan_name TEXT NOT NULL CHECK (plan_name IN ('affectus', 'legatum', 'tributum')), -- 1, 2 ou 3 min
    status TEXT NOT NULL DEFAULT 'onboarding' CHECK (
        status IN (
            'onboarding',            -- Preenchendo fotos, audios, entrevista
            'roteiro_aprovado',      -- Roteiro gerado e aprovado pelo cliente
            'em_producao_midias',    -- Estudio gerando foto tratada e voz clonada
            'aguardando_aprovacao',  -- Imagem com marca d'agua e audio prontos para cliente aprovar
            'midias_aprovadas',      -- Cliente aprovou imagem e audio
            'renderizando_video',    -- Estudio montando o video final
            'finalizado'             -- Video pronto e disponivel na pagina de revelacao
        )
    ),
    background_choice TEXT, -- ex: 'jardim', 'lar', 'por_do_sol', 'celestial', 'neutro', 'original'
    music_choice TEXT,      -- ex: 'piano_emocao', 'cordas_paz', 'acustico_afeto', 'sem_musica'
    public_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex') NOT NULL, -- Token para o QR Code
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABELA DE UPLOADS DE MÍDIAS (FOTOS E ÁUDIOS ENVIADOS PELO CLIENTE)
CREATE TABLE IF NOT EXISTS public.media_uploads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'audio_voice')),
    file_url TEXT NOT NULL,
    file_name TEXT,
    file_size_bytes BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABELA DA ENTREVISTA HUMANIZADA (BRIEFING PARA A IA)
CREATE TABLE IF NOT EXISTS public.interviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    loved_one_name TEXT NOT NULL,      -- Nome do ente querido
    loved_one_role TEXT NOT NULL,      -- Grau de parentesco (ex: Pai, Avó)
    honoree_name TEXT NOT NULL,        -- Nome de quem recebe a homenagem
    honoree_nickname TEXT,             -- Apelido carinhoso
    occasion TEXT NOT NULL,            -- Formatura, Casamento, Aniversário, Saudade
    memories_and_values TEXT NOT NULL, -- Lembranças, conselhos e frases marcantes
    family_mentions TEXT,              -- Parentes citados para bênção/abraço
    emotional_tone TEXT NOT NULL,      -- Solene/Sereno ou Alegre/Comemorativo
    special_question_answer TEXT,      -- "O que você gostaria de ouvir se o tempo se abrisse..."
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABELA DE ROTEIROS
CREATE TABLE IF NOT EXISTS public.scripts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    version_number INT DEFAULT 1 NOT NULL,
    generated_text TEXT NOT NULL,       -- Roteiro puro gerado pela IA
    approved_text TEXT,                -- Roteiro final editado/aprovado pelo cliente
    word_count INT,
    estimated_duration_sec INT,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABELA DE APROVAÇÕES E PRÉVIAS (COM MARCA D'ÁGUA)
CREATE TABLE IF NOT EXISTS public.approvals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    watermarked_image_url TEXT,         -- Imagem tratada com marca d'água
    voice_audio_preview_url TEXT,       -- Áudio narrado com voz clonada (ElevenLabs)
    image_approved BOOLEAN DEFAULT FALSE,
    audio_approved BOOLEAN DEFAULT FALSE,
    client_feedback TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TABELA DO PRODUTO FINAL (VÍDEO FINAL & SALA DE REVELAÇÃO)
CREATE TABLE IF NOT EXISTS public.final_videos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    video_url TEXT NOT NULL,            -- Vídeo final em alta resolução
    video_duration_sec INT,
    thumbnail_url TEXT,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================================
-- ROW LEVEL SECURITY (RLS) - SEGURANÇA POR USUÁRIO
-- ==========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.final_videos ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso do Usuário aos Seus Próprios Dados
CREATE POLICY "Usuário acessa próprio perfil" ON public.profiles
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Usuário acessa próprios pedidos" ON public.orders
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Usuário acessa uploads de seus pedidos" ON public.media_uploads
    FOR ALL USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));

CREATE POLICY "Usuário acessa entrevistas de seus pedidos" ON public.interviews
    FOR ALL USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));

CREATE POLICY "Usuário acessa roteiros de seus pedidos" ON public.scripts
    FOR ALL USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));

CREATE POLICY "Usuário acessa aprovações de seus pedidos" ON public.approvals
    FOR ALL USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));

CREATE POLICY "Usuário acessa vídeos finais de seus pedidos" ON public.final_videos
    FOR ALL USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));

-- Política de Acesso Público para a Página de Revelação do Vídeo (via public_token)
CREATE POLICY "Acesso público ao vídeo por token do pedido" ON public.final_videos
    FOR SELECT USING (
        order_id IN (SELECT id FROM public.orders WHERE public_token IS NOT NULL)
    );
