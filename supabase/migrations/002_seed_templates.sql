-- Inserir templates iniciais por categoria NR

-- Templates NR-10 (Segurança em Instalações e Serviços em Eletricidade)
INSERT INTO public.templates (title, description, thumbnail_url, category, nr_category, difficulty, duration, slides_count, is_premium, is_popular, tags, content) VALUES
('Fundamentos de Segurança Elétrica', 'Introdução aos conceitos básicos de segurança em instalações elétricas', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=electrical%20safety%20training%20presentation%20cover%20with%20safety%20helmet%20and%20electrical%20equipment&image_size=landscape_16_9', 'safety', 'NR-10', 'beginner', 1800, 15, false, true, '{"segurança", "eletricidade", "NR-10", "básico"}', '{}'),
('Procedimentos de Bloqueio e Etiquetagem', 'Aprenda os procedimentos corretos de LOTO (Lock Out Tag Out)', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=lockout%20tagout%20safety%20procedures%20electrical%20panel%20with%20locks%20and%20tags&image_size=landscape_16_9', 'safety', 'NR-10', 'intermediate', 2400, 20, true, false, '{"LOTO", "bloqueio", "etiquetagem", "NR-10"}', '{}'),
('EPI para Trabalhos Elétricos', 'Equipamentos de proteção individual obrigatórios', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=electrical%20worker%20wearing%20complete%20PPE%20safety%20equipment%20helmet%20gloves%20boots&image_size=landscape_16_9', 'safety', 'NR-10', 'beginner', 1200, 10, false, true, '{"EPI", "proteção", "equipamentos", "NR-10"}', '{}');

-- Templates NR-12 (Segurança no Trabalho em Máquinas e Equipamentos)
INSERT INTO public.templates (title, description, thumbnail_url, category, nr_category, difficulty, duration, slides_count, is_premium, is_popular, tags, content) VALUES
('Segurança em Máquinas Industriais', 'Princípios de segurança para operação de máquinas', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=industrial%20machinery%20safety%20training%20factory%20equipment%20with%20safety%20guards&image_size=landscape_16_9', 'safety', 'NR-12', 'intermediate', 2100, 18, false, true, '{"máquinas", "segurança", "NR-12", "industrial"}', '{}'),
('Dispositivos de Segurança', 'Sistemas de proteção e dispositivos de segurança', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=safety%20devices%20emergency%20stop%20buttons%20light%20curtains%20machine%20guards&image_size=landscape_16_9', 'safety', 'NR-12', 'advanced', 2700, 22, true, false, '{"dispositivos", "proteção", "emergência", "NR-12"}', '{}');

-- Templates NR-35 (Trabalho em Altura)
INSERT INTO public.templates (title, description, thumbnail_url, category, nr_category, difficulty, duration, slides_count, is_premium, is_popular, tags, content) VALUES
('Fundamentos do Trabalho em Altura', 'Conceitos básicos e riscos do trabalho em altura', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=worker%20with%20safety%20harness%20working%20at%20height%20construction%20site%20safety%20training&image_size=landscape_16_9', 'safety', 'NR-35', 'beginner', 2400, 20, false, true, '{"altura", "segurança", "NR-35", "básico"}', '{}'),
('Equipamentos de Proteção Contra Quedas', 'Cinturões, talabartes e sistemas anticapotamento', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=fall%20protection%20equipment%20safety%20harness%20ropes%20carabiners%20height%20safety&image_size=landscape_16_9', 'safety', 'NR-35', 'intermediate', 1800, 15, false, true, '{"EPC", "quedas", "proteção", "NR-35"}', '{}'),
('Análise de Risco em Altura', 'Metodologia para análise e controle de riscos', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=risk%20analysis%20checklist%20height%20work%20safety%20inspection%20clipboard&image_size=landscape_16_9', 'safety', 'NR-35', 'advanced', 3000, 25, true, false, '{"análise", "risco", "metodologia", "NR-35"}', '{}');

-- Templates NR-33 (Segurança e Saúde nos Trabalhos em Espaços Confinados)
INSERT INTO public.templates (title, description, thumbnail_url, category, nr_category, difficulty, duration, slides_count, is_premium, is_popular, tags, content) VALUES
('Identificação de Espaços Confinados', 'Como identificar e classificar espaços confinados', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=confined%20space%20entry%20tank%20vessel%20safety%20training%20warning%20signs&image_size=landscape_16_9', 'safety', 'NR-33', 'beginner', 1800, 15, false, true, '{"espaços", "confinados", "NR-33", "identificação"}', '{}'),
('Procedimentos de Entrada Segura', 'Permissão de entrada e procedimentos de segurança', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=confined%20space%20entry%20permit%20safety%20procedures%20gas%20detection%20equipment&image_size=landscape_16_9', 'safety', 'NR-33', 'intermediate', 2400, 20, true, false, '{"entrada", "permissão", "procedimentos", "NR-33"}', '{}');

-- Templates NR-06 (Equipamento de Proteção Individual)
INSERT INTO public.templates (title, description, thumbnail_url, category, nr_category, difficulty, duration, slides_count, is_premium, is_popular, tags, content) VALUES
('Seleção e Uso de EPIs', 'Como escolher e usar corretamente os EPIs', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=personal%20protective%20equipment%20PPE%20helmet%20gloves%20safety%20glasses%20boots&image_size=landscape_16_9', 'safety', 'NR-06', 'beginner', 1500, 12, false, true, '{"EPI", "seleção", "uso", "NR-06"}', '{}'),
('Manutenção e Conservação de EPIs', 'Cuidados com equipamentos de proteção individual', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=PPE%20maintenance%20cleaning%20storage%20safety%20equipment%20care&image_size=landscape_16_9', 'safety', 'NR-06', 'beginner', 1200, 10, false, false, '{"manutenção", "conservação", "EPI", "NR-06"}', '{}');

-- Templates NR-18 (Condições e Meio Ambiente de Trabalho na Indústria da Construção)
INSERT INTO public.templates (title, description, thumbnail_url, category, nr_category, difficulty, duration, slides_count, is_premium, is_popular, tags, content) VALUES
('Segurança na Construção Civil', 'Princípios básicos de segurança em obras', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=construction%20site%20safety%20workers%20helmets%20scaffolding%20building%20safety&image_size=landscape_16_9', 'safety', 'NR-18', 'beginner', 2100, 18, false, true, '{"construção", "obras", "segurança", "NR-18"}', '{}'),
('Andaimes e Plataformas de Trabalho', 'Montagem e uso seguro de andaimes', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=scaffolding%20construction%20safety%20platform%20workers%20building%20site&image_size=landscape_16_9', 'safety', 'NR-18', 'intermediate', 1800, 15, false, false, '{"andaimes", "plataformas", "montagem", "NR-18"}', '{}');

-- Templates Gerais de Segurança
INSERT INTO public.templates (title, description, thumbnail_url, category, nr_category, difficulty, duration, slides_count, is_premium, is_popular, tags, content) VALUES
('Primeiros Socorros no Trabalho', 'Procedimentos básicos de primeiros socorros', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=first%20aid%20training%20workplace%20emergency%20medical%20kit%20CPR%20demonstration&image_size=landscape_16_9', 'safety', 'GERAL', 'beginner', 2400, 20, false, true, '{"primeiros socorros", "emergência", "saúde", "segurança"}', '{}'),
('Prevenção de Incêndios', 'Medidas preventivas e combate a incêndios', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=fire%20prevention%20training%20extinguisher%20safety%20workplace%20emergency%20procedures&image_size=landscape_16_9', 'safety', 'GERAL', 'intermediate', 1800, 15, false, true, '{"incêndio", "prevenção", "extintor", "emergência"}', '{}'),
('Ergonomia no Trabalho', 'Princípios de ergonomia e prevenção de lesões', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=workplace%20ergonomics%20proper%20posture%20office%20worker%20healthy%20workspace&image_size=landscape_16_9', 'safety', 'GERAL', 'beginner', 1500, 12, false, false, '{"ergonomia", "postura", "prevenção", "lesões"}', '{}');

-- Atualizar timestamps
UPDATE public.templates SET created_at = NOW() - INTERVAL '30 days' WHERE nr_category = 'NR-10';
UPDATE public.templates SET created_at = NOW() - INTERVAL '25 days' WHERE nr_category = 'NR-12';
UPDATE public.templates SET created_at = NOW() - INTERVAL '20 days' WHERE nr_category = 'NR-35';
UPDATE public.templates SET created_at = NOW() - INTERVAL '15 days' WHERE nr_category = 'NR-33';
UPDATE public.templates SET created_at = NOW() - INTERVAL '10 days' WHERE nr_category = 'NR-06';
UPDATE public.templates SET created_at = NOW() - INTERVAL '5 days' WHERE nr_category = 'NR-18';
UPDATE public.templates SET created_at = NOW() - INTERVAL '2 days' WHERE nr_category = 'GERAL';