-- Seeding inicial de documentos jurídicos no banco UPTPortal

USE UPTPortal;

INSERT INTO LegalDocuments (Type, Version, Content, HashSHA256, Active)
VALUES 
('terms-of-use', '1.0', N'Termos de Uso e Contrato do Jogo Universo Priston Tale. O uso deste jogo está condicionado à aceitação destes termos.', 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855', 1),
('privacy-notice', '1.0', N'Aviso de Privacidade. Nós tratamos seus dados em conformidade com a LGPD.', 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855', 1),
('game-license', '1.0', N'Contrato de Licença de Usuário Final (EULA). Licença pessoal, intransferível e revogável.', 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855', 1),
('community-rules', '1.0', N'Regras de Conduta da Comunidade UPT. Proibido cheat, ofensas e comportamento tóxico.', 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855', 1),
('game-rating-notice', '1.0', N'Classificação Indicativa: Não recomendado para menores de 12 anos por conter violência leve e interação online.', 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855', 1),
('guardian-consent', '1.0', N'Consentimento dos pais ou responsáveis para o tratamento de dados pessoais de crianças.', 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855', 1);
