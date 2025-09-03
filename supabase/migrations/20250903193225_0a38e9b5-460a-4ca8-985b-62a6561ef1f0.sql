-- Inserir alguns processos de exemplo
INSERT INTO public.processes (client_name, client_email, process_type, status, priority, description, due_date, progress) VALUES
('Maria Silva Santos', 'maria.santos@email.com', 'Divórcio', 'Em andamento', 'Alta', 'Processo de divórcio consensual com partilha de bens', '2024-02-15 23:59:59', 65),
('João Oliveira', 'joao.oliveira@email.com', 'Inventário', 'Pendente', 'Média', 'Inventário de bens do espólio de familiar falecido', '2024-02-28 23:59:59', 30),
('Ana Costa Lima', 'ana.costa@email.com', 'Pensão Alimentícia', 'Em andamento', 'Alta', 'Revisão de valores de pensão alimentícia', '2024-02-10 23:59:59', 80),
('Carlos Mendes', 'carlos.mendes@email.com', 'Ação Trabalhista', 'Concluído', 'Baixa', 'Ação por rescisão indireta do contrato de trabalho', '2024-01-30 23:59:59', 100),
('Fernanda Rodrigues', 'fernanda.r@email.com', 'Ação Civil', 'Em andamento', 'Média', 'Ação indenizatória por danos morais', '2024-03-05 23:59:59', 45);