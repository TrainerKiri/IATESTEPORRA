import random
import string
import json
import sqlite3
import os
from collections import Counter, defaultdict
import urllib.request
import urllib.parse
import unicodedata

class ForcaIA:
    def __init__(self):
        # Frequência das letras em português por posição
        self.letras_frequentes = {
            'inicio': list('capemdtsfr'),
            'meio': list('aeiorstndml'),
            'fim': list('aosremldiu')
        }
        
        # Mapa de acentuação
        self.mapa_acentos = {
            'a': 'áàâãä',
            'e': 'éèêë',
            'i': 'íìîï',
            'o': 'óòôõö',
            'u': 'úùûü',
            'c': 'ç',
            'n': 'ñ'
        }
        
        # Criar mapa reverso de acentos
        self.mapa_reverso = {}
        for letra, acentos in self.mapa_acentos.items():
            for acento in acentos:
                self.mapa_reverso[acento] = letra
        
        # N-gramas comuns em português
        self.bigramas = ['ar', 'er', 'os', 'as', 'do', 'es', 'de', 'ra', 'ao']
        self.trigramas = ['que', 'ent', 'com', 'par', 'ara', 'ada', 'dos']
        
        self.letras_usadas = set()
        self.palavra_atual = []
        self.palavra_original = []  # Mantém a palavra com acentos
        self.tentativas = 0
        self.historico_palavras = []
        self.padrao_atual = ''
        
        # Dicionário para armazenar frequências aprendidas
        self.freq_aprendida = defaultdict(Counter)
        
        # Inicializar banco de dados
        self.inicializar_banco()
        # Carregar dados salvos se existirem
        self.carregar_dados()
    
    def normalizar_letra(self, letra):
        """Normaliza uma letra removendo acentos"""
        return self.mapa_reverso.get(letra, letra)
    
    def normalizar_palavra(self, palavra):
        """Remove acentos de uma palavra"""
        return ''.join(self.normalizar_letra(c) for c in palavra.lower())
    
    def inicializar_banco(self):
        """Inicializa o banco de dados SQLite"""
        self.conn = sqlite3.connect('forca_dados.db')
        self.cursor = self.conn.cursor()
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS dados (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                palavra TEXT,
                frequencias TEXT
            )
        ''')
        self.conn.commit()

    def salvar_dados(self):
        """Salva os dados de aprendizado no banco de dados"""
        for palavra in self.historico_palavras:
            frequencias = {str(k): dict(v) for k, v in self.freq_aprendida.items()}
            self.cursor.execute('''
                INSERT INTO dados (palavra, frequencias) VALUES (?, ?)
            ''', (palavra, json.dumps(frequencias)))
        self.conn.commit()
            
    def carregar_dados(self):
        """Carrega os dados de aprendizado do banco de dados"""
        self.cursor.execute('SELECT palavra, frequencias FROM dados')
        for palavra, frequencias in self.cursor.fetchall():
            self.historico_palavras.append(palavra)
            self.freq_aprendida = defaultdict(Counter)
            freq_dict = json.loads(frequencias)
            for k, v in freq_dict.items():
                self.freq_aprendida[int(k)].update(v)
    
    def consultar_dicionario(self, palavra):
        """Consulta se a palavra existe no dicionário online"""
        try:
            url = f"https://api.dicionario-aberto.net/word/{urllib.parse.quote(palavra)}"
            with urllib.request.urlopen(url) as response:
                return response.getcode() == 200
        except:
            # Se houver erro na consulta, assume que a palavra é válida
            return True
    
    def analisar_silabas(self, palavra):
        """Analisa padrões de sílabas comuns em português"""
        silabas_comuns = ['ca', 'co', 'ce', 'ci', 'ta', 'to', 'te', 'ti', 
                         'pa', 'po', 'pe', 'pi', 'ma', 'mo', 'me', 'mi',
                         'da', 'do', 'de', 'di', 'ra', 'ro', 're', 'ri']
        
        letras_provaveis = set()
        palavra_str = ''.join(self.palavra_atual)
        
        for silaba in silabas_comuns:
            if silaba[0] in palavra_str and '_' in palavra_str:
                letras_provaveis.add(silaba[1])
            elif silaba[1] in palavra_str and '_' in palavra_str:
                letras_provaveis.add(silaba[0])
                
        return letras_provaveis
    
    def iniciar_jogo(self, palavra_original):
        """Inicia o jogo com uma palavra, mantendo os acentos originais"""
        self.palavra_original = list(palavra_original)
        palavra_normalizada = self.normalizar_palavra(palavra_original)
        self.palavra_atual = ['_'] * len(palavra_normalizada)
        self.letras_usadas = set()
        self.tentativas = 0
        self.padrao_atual = '.' * len(palavra_normalizada)
    
    def analisar_padrao(self):
        """Analisa o padrão atual da palavra para identificar possíveis letras"""
        padrao = ''.join(self.palavra_atual)
        letras_provaveis = set()
        
        # Analisa bigramas
        for i in range(len(padrao)-1):
            if padrao[i] != '_' and padrao[i+1] == '_':
                for bigrama in self.bigramas:
                    if bigrama.startswith(padrao[i]):
                        letras_provaveis.add(bigrama[1])
            elif padrao[i] == '_' and padrao[i+1] != '_':
                for bigrama in self.bigramas:
                    if bigrama.endswith(padrao[i+1]):
                        letras_provaveis.add(bigrama[0])
        
        # Adiciona análise de sílabas
        letras_provaveis.update(self.analisar_silabas(''.join(self.palavra_atual)))
        
        # Adiciona vogais quando encontra consoantes
        for i, letra in enumerate(self.palavra_atual):
            if letra != '_' and letra not in 'aeiou':
                letras_provaveis.update('aeiou')
        
        return letras_provaveis
    
    def calcular_probabilidade_letra(self, letra, posicao):
        """Calcula a probabilidade de uma letra baseada na posição e contexto"""
        score = 0
        
        # Frequência baseada na posição
        if posicao == 0 and letra in self.letras_frequentes['inicio']:
            score += 3
        elif posicao == len(self.palavra_atual)-1 and letra in self.letras_frequentes['fim']:
            score += 3
        elif letra in self.letras_frequentes['meio']:
            score += 2
            
        # Frequência aprendida (com peso maior)
        if self.freq_aprendida[posicao][letra] > 0:
            score += self.freq_aprendida[posicao][letra] * 2
            
        # Análise de padrões
        if letra in self.analisar_padrao():
            score += 4
            
        # Bônus para vogais em palavras longas
        if letra in 'aeiou' and len(self.palavra_atual) > 8:
            score += 2
            
        # Bônus para letras que podem ter acentos
        if letra in self.mapa_acentos:
            score += 1
            
        return score
    
    def tentar_letra(self):
        """Escolhe a próxima letra baseada em múltiplos fatores"""
        letras_scores = defaultdict(int)
        
        # Avalia cada letra não usada
        for letra in string.ascii_lowercase:
            if letra not in self.letras_usadas:
                # Calcula score para cada posição
                for pos in range(len(self.palavra_atual)):
                    if self.palavra_atual[pos] == '_':
                        letras_scores[letra] += self.calcular_probabilidade_letra(letra, pos)
        
        if not letras_scores:
            return None
            
        # Escolhe a letra com maior score
        letra_escolhida = max(letras_scores.items(), key=lambda x: x[1])[0]
        self.letras_usadas.add(letra_escolhida)
        return letra_escolhida
    
    def atualizar_palavra(self, letra, posicoes):
        """Atualiza a palavra e aprende com o resultado"""
        for pos in posicoes:
            self.palavra_atual[pos] = letra
            # Atualiza frequências aprendidas
            self.freq_aprendida[pos][letra] += 1
    
    def palavra_completa(self):
        """Verifica se a palavra foi completada"""
        palavra_normalizada = self.normalizar_palavra(''.join(self.palavra_original))
        return ''.join(self.palavra_atual) == palavra_normalizada
    
    def registrar_palavra(self, palavra):
        """Registra uma palavra completa para aprendizado"""
        self.historico_palavras.append(palavra)
        palavra_norm = self.normalizar_palavra(palavra)
        # Atualiza frequências por posição
        for i, letra in enumerate(palavra_norm):
            self.freq_aprendida[i][letra] += 1
        # Salva os dados atualizados
        self.salvar_dados()

def main():
    print("\n=== Jogo da Forca com IA Avançada ===")
    print("A IA tentará adivinhar a palavra que você escolher!")
    print("\nMelhorias implementadas:")
    print("✓ Análise de padrões de palavras")
    print("✓ Frequência contextual de letras")
    print("✓ Aprendizado com tentativas anteriores")
    print("✓ Uso de n-gramas e sílabas")
    print("✓ Sistema de pontuação adaptativo")
    print("✓ Persistência de dados")
    print("✓ Consulta a dicionário online")
    print("✓ Suporte completo a acentuação")
    
    ia = ForcaIA()
    
    while True:
        palavra_secreta = input("\nDigite a palavra secreta (ou 'sair' para encerrar): ").lower()
        
        if palavra_secreta == 'sair':
            break
        
        if not all(c.isalpha() or c in 'áàâãäéèêëíìîïóòôõöúùûüçñ' for c in palavra_secreta):
            print("Por favor, use apenas letras (acentuadas ou não)!")
            continue
            
        # Verifica se a palavra existe no dicionário
        if not ia.consultar_dicionario(palavra_secreta):
            print("Aviso: Essa palavra não foi encontrada no dicionário, mas vamos continuar...")
        
        ia.iniciar_jogo(palavra_secreta)
        print("\nPalavra:", ' '.join(ia.palavra_atual))
        
        while not ia.palavra_completa():
            letra = ia.tentar_letra()
            ia.tentativas += 1
            
            # Encontra todas as posições onde a letra aparece (incluindo versões acentuadas)
            posicoes = []
            palavra_norm = ia.normalizar_palavra(palavra_secreta)
            for i, l in enumerate(palavra_norm):
                if l == letra:
                    posicoes.append(i)
            
            print(f"\nTentativa {ia.tentativas}: letra '{letra}'")
            
            if posicoes:
                print("✓ Acertou!")
                ia.atualizar_palavra(letra, posicoes)
            else:
                print("✗ Errou!")
            
            print("Palavra:", ' '.join(ia.palavra_atual))
            print("Letras usadas:", ', '.join(sorted(ia.letras_usadas)))
            
            input("Pressione Enter para continuar...")
        
        # Registra a palavra para aprendizado
        ia.registrar_palavra(palavra_secreta)
        
        print(f"\nParabéns! A IA descobriu a palavra '{palavra_secreta}'")
        print(f"Número total de tentativas: {ia.tentativas}")
        
        # Estatísticas de aprendizado
        print("\nEstatísticas de aprendizado:")
        print(f"Palavras aprendidas: {len(ia.historico_palavras)}")
        print("Letras mais comuns por posição:")
        for pos in range(len(palavra_secreta)):
            mais_comum = ia.freq_aprendida[pos].most_common(1)
            if mais_comum:
                letra, freq = mais_comum[0]
                print(f"Posição {pos+1}: '{letra}' ({freq} vezes)")

if __name__ == "__main__":
    main()
