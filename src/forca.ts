export class ForcaIA {
  private letras_frequentes: { [key: string]: string[] };
  private mapa_acentos: { [key: string]: string };
  private mapa_reverso: { [key: string]: string };
  private bigramas: string[];
  private trigramas: string[];
  private letras_usadas: Set<string>;
  private palavra_atual: string[];
  private palavra_original: string[];
  private tentativas: number;
  private historico_palavras: string[];
  private freq_aprendida: Map<number, Map<string, number>>;

  constructor() {
    this.letras_frequentes = {
      inicio: ['c', 'a', 'p', 'e', 'm', 'd', 't', 's', 'f', 'r'],
      meio: ['a', 'e', 'i', 'o', 'r', 's', 't', 'n', 'd', 'm', 'l'],
      fim: ['a', 'o', 's', 'r', 'e', 'm', 'l', 'd', 'i', 'u']
    };

    this.mapa_acentos = {
      'a': 'áàâãä',
      'e': 'éèêë',
      'i': 'íìîï',
      'o': 'óòôõö',
      'u': 'úùûü',
      'c': 'ç',
      'n': 'ñ'
    };

    this.mapa_reverso = {};
    Object.entries(this.mapa_acentos).forEach(([letra, acentos]) => {
      for (const acento of acentos) {
        this.mapa_reverso[acento] = letra;
      }
    });

    this.bigramas = ['ar', 'er', 'os', 'as', 'do', 'es', 'de', 'ra', 'ao'];
    this.trigramas = ['que', 'ent', 'com', 'par', 'ara', 'ada', 'dos'];
    
    this.letras_usadas = new Set();
    this.palavra_atual = [];
    this.palavra_original = [];
    this.tentativas = 0;
    this.historico_palavras = [];
    this.freq_aprendida = new Map();

    this.carregar_dados();
  }

  private normalizar_letra(letra: string): string {
    return this.mapa_reverso[letra] || letra;
  }

  public normalizar_palavra(palavra: string): string {
    return Array.from(palavra.toLowerCase()).map(l => this.normalizar_letra(l)).join('');
  }

  private carregar_dados(): void {
    try {
      const dados = localStorage.getItem('forca_dados');
      if (dados) {
        const { historico_palavras, freq_aprendida } = JSON.parse(dados);
        this.historico_palavras = historico_palavras;
        this.freq_aprendida = new Map(Object.entries(freq_aprendida).map(([k, v]) => [
          parseInt(k),
          new Map(Object.entries(v as { [key: string]: number }))
        ]));
      }
    } catch (e) {
      console.log('Iniciando novo histórico');
    }
  }

  private salvar_dados(): void {
    const dados = {
      historico_palavras: this.historico_palavras,
      freq_aprendida: Object.fromEntries(
        Array.from(this.freq_aprendida.entries()).map(([k, v]) => [
          k,
          Object.fromEntries(v)
        ])
      )
    };
    localStorage.setItem('forca_dados', JSON.stringify(dados));
  }

  private analisar_silabas(): Set<string> {
    const silabas_comuns = [
      'ca', 'co', 'ce', 'ci', 'ta', 'to', 'te', 'ti',
      'pa', 'po', 'pe', 'pi', 'ma', 'mo', 'me', 'mi',
      'da', 'do', 'de', 'di', 'ra', 'ro', 're', 'ri'
    ];

    const letras_provaveis = new Set<string>();
    const palavra_str = this.palavra_atual.join('');

    for (const silaba of silabas_comuns) {
      if (palavra_str.includes(silaba[0]) && palavra_str.includes('_')) {
        letras_provaveis.add(silaba[1]);
      } else if (palavra_str.includes(silaba[1]) && palavra_str.includes('_')) {
        letras_provaveis.add(silaba[0]);
      }
    }

    return letras_provaveis;
  }

  public iniciar_jogo(palavra_original: string): void {
    this.palavra_original = Array.from(palavra_original);
    const palavra_normalizada = this.normalizar_palavra(palavra_original);
    this.palavra_atual = Array(palavra_normalizada.length).fill('_');
    this.letras_usadas.clear();
    this.tentativas = 0;
  }

  private analisar_padrao(): Set<string> {
    const letras_provaveis = new Set<string>();
    const palavra_str = this.palavra_atual.join('');

    // Análise de bigramas
    for (let i = 0; i < palavra_str.length - 1; i++) {
      if (palavra_str[i] !== '_' && palavra_str[i + 1] === '_') {
        for (const bigrama of this.bigramas) {
          if (bigrama.startsWith(palavra_str[i])) {
            letras_provaveis.add(bigrama[1]);
          }
        }
      } else if (palavra_str[i] === '_' && palavra_str[i + 1] !== '_') {
        for (const bigrama of this.bigramas) {
          if (bigrama.endsWith(palavra_str[i + 1])) {
            letras_provaveis.add(bigrama[0]);
          }
        }
      }
    }

    // Adiciona análise de sílabas
    const silabas = this.analisar_silabas();
    silabas.forEach(l => letras_provaveis.add(l));

    // Adiciona vogais quando encontra consoantes
    this.palavra_atual.forEach(letra => {
      if (letra !== '_' && !'aeiou'.includes(letra)) {
        'aeiou'.split('').forEach(v => letras_provaveis.add(v));
      }
    });

    return letras_provaveis;
  }

  private calcular_probabilidade_letra(letra: string, posicao: number): number {
    let score = 0;

    // Frequência baseada na posição
    if (posicao === 0 && this.letras_frequentes.inicio.includes(letra)) {
      score += 3;
    } else if (posicao === this.palavra_atual.length - 1 && this.letras_frequentes.fim.includes(letra)) {
      score += 3;
    } else if (this.letras_frequentes.meio.includes(letra)) {
      score += 2;
    }

    // Frequência aprendida
    const freq_pos = this.freq_aprendida.get(posicao);
    if (freq_pos && freq_pos.get(letra)) {
      score += freq_pos.get(letra)! * 2;
    }

    // Análise de padrões
    if (this.analisar_padrao().has(letra)) {
      score += 4;
    }

    // Bônus para vogais em palavras longas
    if ('aeiou'.includes(letra) && this.palavra_atual.length > 8) {
      score += 2;
    }

    // Bônus para letras que podem ter acentos
    if (letra in this.mapa_acentos) {
      score += 1;
    }

    return score;
  }

  public tentar_letra(): string | null {
    const letras_scores: Map<string, number> = new Map();

    // Avalia cada letra não usada
    for (const letra of 'abcdefghijklmnopqrstuvwxyz') {
      if (!this.letras_usadas.has(letra)) {
        let score = 0;
        for (let pos = 0; pos < this.palavra_atual.length; pos++) {
          if (this.palavra_atual[pos] === '_') {
            score += this.calcular_probabilidade_letra(letra, pos);
          }
        }
        letras_scores.set(letra, score);
      }
    }

    if (letras_scores.size === 0) return null;

    // Escolhe a letra com maior score
    const [letra_escolhida] = Array.from(letras_scores.entries())
      .reduce((max, atual) => atual[1] > max[1] ? atual : max);

    this.letras_usadas.add(letra_escolhida);
    return letra_escolhida;
  }

  public registrar_palavra(palavra: string): void {
    this.historico_palavras.push(palavra);
    const palavra_norm = this.normalizar_palavra(palavra);

    // Atualiza frequências por posição
    Array.from(palavra_norm).forEach((letra, i) => {
      if (!this.freq_aprendida.has(i)) {
        this.freq_aprendida.set(i, new Map());
      }
      const freq_pos = this.freq_aprendida.get(i)!;
      freq_pos.set(letra, (freq_pos.get(letra) || 0) + 1);
    });

    this.salvar_dados();
  }
}