/*
  # Estrutura do banco de dados para o Jogo da Forca

  1. Novas Tabelas
    - `rankings`
      - `id` (uuid, chave primária)
      - `user_id` (uuid, referência ao usuário autenticado)
      - `username` (texto, nome do jogador)
      - `victories` (inteiro, número de vitórias contra a IA)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `word_frequencies`
      - `id` (uuid, chave primária)
      - `word` (texto, palavra jogada)
      - `position` (inteiro, posição na palavra)
      - `letter` (texto, letra na posição)
      - `frequency` (inteiro, frequência da letra naquela posição)
      - `created_at` (timestamp)

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas para leitura e escrita
*/

-- Tabela de rankings
CREATE TABLE IF NOT EXISTS rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  username text NOT NULL,
  victories integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de frequências de letras
CREATE TABLE IF NOT EXISTS word_frequencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text NOT NULL,
  position integer NOT NULL,
  letter char(1) NOT NULL,
  frequency integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_frequencies ENABLE ROW LEVEL SECURITY;

-- Políticas para rankings
CREATE POLICY "Rankings são visíveis para todos"
  ON rankings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem atualizar seus próprios rankings"
  ON rankings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios rankings"
  ON rankings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Políticas para word_frequencies
CREATE POLICY "Frequências são visíveis para todos"
  ON word_frequencies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem adicionar frequências"
  ON word_frequencies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Função para atualizar o timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o timestamp
CREATE TRIGGER update_rankings_updated_at
  BEFORE UPDATE ON rankings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();