-- Criação do banco de dados e tabelas para o sistema de scrape do jogo do bicho

-- Tabela de resultados das loterias
CREATE TABLE IF NOT EXISTS lottery_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lottery_type VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    results JSONB NOT NULL,
    prizes JSONB,
    source VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(lottery_type, date)
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_lottery_results_date ON lottery_results(date);
CREATE INDEX IF NOT EXISTS idx_lottery_results_type ON lottery_results(lottery_type);
CREATE INDEX IF NOT EXISTS idx_lottery_results_status ON lottery_results(status);
CREATE INDEX IF NOT EXISTS idx_lottery_results_date_type ON lottery_results(date, lottery_type);

-- Tabela de templates de mensagens
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    lottery_types TEXT[] DEFAULT '{}',
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações de grupos
CREATE TABLE IF NOT EXISTS group_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('whatsapp', 'telegram')),
    group_id VARCHAR(255) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    lottery_types TEXT[] DEFAULT '{}',
    template_id UUID REFERENCES message_templates(id),
    schedule VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações de scrape
CREATE TABLE IF NOT EXISTS scrape_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lottery_type VARCHAR(50) NOT NULL UNIQUE,
    url VARCHAR(500) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    selectors JSONB DEFAULT '{}',
    headers JSONB,
    proxy_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de logs do sistema
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    level VARCHAR(20) NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
    message TEXT NOT NULL,
    context JSONB,
    source VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_source ON system_logs(source);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    cron_expression VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    lottery_types TEXT[] DEFAULT '{}',
    groups TEXT[] DEFAULT '{}',
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de histórico de envios
CREATE TABLE IF NOT EXISTS send_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES group_configs(id),
    lottery_result_id UUID REFERENCES lottery_results(id),
    message_content TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para histórico
CREATE INDEX IF NOT EXISTS idx_send_history_group ON send_history(group_id);
CREATE INDEX IF NOT EXISTS idx_send_history_result ON send_history(lottery_result_id);
CREATE INDEX IF NOT EXISTS idx_send_history_sent_at ON send_history(sent_at);

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_lottery_results_updated_at 
    BEFORE UPDATE ON lottery_results 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at 
    BEFORE UPDATE ON message_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_configs_updated_at 
    BEFORE UPDATE ON group_configs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scrape_configs_updated_at 
    BEFORE UPDATE ON scrape_configs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at 
    BEFORE UPDATE ON schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir configurações padrão de scrape
INSERT INTO scrape_configs (lottery_type, url, selectors, enabled) VALUES
('FEDERAL', 'https://www.jogodobicho.net/federal', '{"results": ".result-federal .numbers"}', true),
('RIO_DE_JANEIRO', 'https://www.jogodobicho.net/rio-de-janeiro', '{"results": ".result-rio .numbers"}', true),
('LOOK_GO', 'https://www.jogodobicho.net/goias', '{"results": ".result-go .numbers"}', true),
('PT_SP', 'https://www.jogodobicho.net/sao-paulo', '{"results": ".result-sp .numbers"}', true),
('NACIONAL', 'https://www.jogodobicho.net/nacional', '{"results": ".result-nacional .numbers"}', true),
('MALUQUINHA_RJ', 'https://www.jogodobicho.net/maluquinha', '{"results": ".result-maluquinha .numbers"}', true),
('LOTEP', 'https://www.loterias.caixa.gov.br/Paginas/LOTEP.aspx', '{"results": ".result-lotep .numbers"}', true),
('LOTECE', 'https://www.loterias.caixa.gov.br/Paginas/LOTECE.aspx', '{"results": ".result-lotece .numbers"}', true),
('MINAS_GERAIS', 'https://www.jogodobicho.net/minas-gerais', '{"results": ".result-mg .numbers"}', true),
('BOA_SORTE', 'https://www.jogodobicho.net/boa-sorte', '{"results": ".result-boa-sorte .numbers"}', true),
('LOTERIAS_CAIXA', 'https://loterias.caixa.gov.br', '{"results": ".result-loterias .numbers"}', true);

-- Inserir templates de mensagem padrão
INSERT INTO message_templates (name, content, variables, lottery_types, enabled) VALUES
('Padrão Completo', '🎯 RESULTADO {lottery_name} - {date}\n\n1º Prêmio: {first}\n2º Prêmio: {second}\n3º Prêmio: {third}\n4º Prêmio: {fourth}\n5º Prêmio: {fifth}\n\n📊 Fonte: {source}', '{"lottery_name", "date", "first", "second", "third", "fourth", "fifth", "source"}', '{"FEDERAL", "RIO_DE_JANEIRO", "LOOK_GO", "PT_SP", "NACIONAL", "MALUQUINHA_RJ", "LOTEP", "LOTECE", "MINAS_GERAIS", "BOA_SORTE", "LOTERIAS_CAIXA"}', true),
('Resumo Rápido', '🎯 {lottery_name}: {first} - {second} - {third} - {fourth} - {fifth}', '{"lottery_name", "first", "second", "third", "fourth", "fifth"}', '{"FEDERAL", "RIO_DE_JANEIRO", "LOOK_GO", "PT_SP", "NACIONAL", "MALUQUINHA_RJ", "LOTEP", "LOTECE", "MINAS_GERAIS", "BOA_SORTE", "LOTERIAS_CAIXA"}', true),
('Apenas 1º Prêmio', '🎯 {lottery_name} - 1º: {first}', '{"lottery_name", "first"}', '{"FEDERAL", "RIO_DE_JANEIRO", "LOOK_GO", "PT_SP", "NACIONAL", "MALUQUINHA_RJ", "LOTEP", "LOTECE", "MINAS_GERAIS", "BOA_SORTE", "LOTERIAS_CAIXA"}', true);

-- Habilitar RLS (Row Level Security)
ALTER TABLE lottery_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE send_history ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança básicas (para anon e authenticated)
CREATE POLICY "Permitir leitura de resultados" ON lottery_results FOR SELECT USING (true);
CREATE POLICY "Permitir leitura de templates" ON message_templates FOR SELECT USING (true);
CREATE POLICY "Permitir leitura de configurações" ON group_configs FOR SELECT USING (true);
CREATE POLICY "Permitir leitura de configs scrape" ON scrape_configs FOR SELECT USING (true);

-- Políticas para usuários autenticados (criação e atualização)
CREATE POLICY "Permitir criação de resultados" ON lottery_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de resultados" ON lottery_results FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de resultados" ON lottery_results FOR DELETE USING (true);

CREATE POLICY "Permitir criação de templates" ON message_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de templates" ON message_templates FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de templates" ON message_templates FOR DELETE USING (true);

CREATE POLICY "Permitir criação de grupos" ON group_configs FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de grupos" ON group_configs FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de grupos" ON group_configs FOR DELETE USING (true);

-- Conceder permissões
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;