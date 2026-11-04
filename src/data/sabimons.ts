// Os Sabimons: bichos colecionáveis que vêm nos pacotes.
// Guia completo (tipos, raridades, desenhos): docs/ARTE-SABIMONS.md e arte/sabimons/lista.json.
// Para lançar um Sabimon novo, adicione-o aqui. Os fatos precisam ser verdadeiros.
// Quando um desenho novo chegar, rode `python3 scripts/recortar-sabimons.py` e preencha `imagem`.

import type { Sabimon } from './tipos';

const img = (n: string, forma: number) => `sabimons/${n}-${forma}.webp`;

export const sabimons: Sabimon[] = [
  {
    id: 's001', numero: 1, tipo: 'Fogo', raridade: 'comum',
    fato: 'A capivara é o maior roedor do mundo e nada muito bem.',
    formas: [
      { nome: 'Brasinho', poderes: ['Brasa Quentinha', 'Cabeçada em Chamas'], imagem: img('001', 1) },
      { nome: 'Brasão', poderes: ['Juba de Fogo', 'Soco Brasa'] },
      { nome: 'Fornalhuda', poderes: ['Coroa Vulcânica', 'Rio de Lava'] },
    ],
  },
  {
    id: 's002', numero: 2, tipo: 'Água', raridade: 'comum',
    fato: 'O boto-cor-de-rosa vive nos rios da Amazônia. É o maior golfinho de rio do mundo.',
    formas: [
      { nome: 'Pingoró', poderes: ['Bolha Saltitante', 'Esguicho'], imagem: img('002', 1) },
      { nome: 'Botorrão', poderes: ['Onda Curvada', 'Nadadeira Giratória'] },
      { nome: 'Marabotão', poderes: ['Anel das Águas', 'Tromba-d’Água'] },
    ],
  },
  {
    id: 's003', numero: 3, tipo: 'Planta', raridade: 'comum',
    fato: 'O tatu-bola se fecha como uma bola para se proteger. Ele só existe no Brasil.',
    formas: [
      { nome: 'Sementú', poderes: ['Chicote de Cipó', 'Bola de Folhas'], imagem: img('003', 1) },
      { nome: 'Tatuflora', poderes: ['Flor Perfumada', 'Laço de Cipó'] },
      { nome: 'Matatu', poderes: ['Floresta Viva', 'Raiz Gigante'] },
    ],
  },
  {
    id: 's004', numero: 4, tipo: 'Raio', raridade: 'comum',
    fato: 'O vaga-lume faz luz com uma mistura química dentro do corpo, e essa luz quase não esquenta.',
    formas: [
      { nome: 'Zapinho', poderes: ['Pisca-Pisca', 'Choquinho'], imagem: img('004', 1) },
      { nome: 'Faiscaluz', poderes: ['Asa Relâmpago', 'Faísca Dupla'] },
      { nome: 'Trovalume', poderes: ['Lanterna Trovão', 'Armadura Elétrica'] },
    ],
  },
  {
    id: 's005', numero: 5, tipo: 'Pedra', raridade: 'rara',
    fato: 'O jabuti é uma tartaruga que vive em terra firme e pode passar dos 50 anos de idade.',
    formas: [
      { nome: 'Pedrolho', poderes: ['Casco Duro', 'Cristal Brilhante'], imagem: img('005', 1) },
      { nome: 'Cristabuti', poderes: ['Chuva de Ametista', 'Pisada Firme'] },
      { nome: 'Montabuti', poderes: ['Montanha de Cristal', 'Terremoto Lento'] },
    ],
  },
  {
    id: 's006', numero: 6, tipo: 'Vento', raridade: 'rara',
    fato: 'O beija-flor bate as asas muitas vezes por segundo e consegue até voar de ré.',
    formas: [
      { nome: 'Ventilu', poderes: ['Brisa Ligeira', 'Bicada Veloz'], imagem: img('006', 1) },
      { nome: 'Rajadinho', poderes: ['Rastro de Vento', 'Rajada Dupla'], imagem: img('006', 2) },
      { nome: 'Furacolibri', poderes: ['Furacão de Penas', 'Tornado Real'], imagem: img('006', 3) },
    ],
  },
  {
    id: 's007', numero: 7, tipo: 'Areia', raridade: 'rara',
    fato: 'As patas de trás do siri são achatadas como remos. Por isso ele nada muito bem.',
    formas: [
      { nome: 'Arenito', poderes: ['Pinça Rápida', 'Esconde na Areia'], imagem: img('007', 1) },
      { nome: 'Dunasiri', poderes: ['Redemoinho de Areia', 'Garra de Arenito'] },
      { nome: 'Tempestasiri', poderes: ['Tempestade de Areia', 'Casco de Duna'] },
    ],
  },
  {
    id: 's008', numero: 8, tipo: 'Gelo', raridade: 'epica',
    fato: 'No pelo do bicho-preguiça crescem algas, que deixam ele meio verde e ajudam a se esconder nas árvores.',
    formas: [
      { nome: 'Nevim', poderes: ['Sopro Gelado', 'Abraço de Neve'], imagem: img('008', 1) },
      { nome: 'Friozão', poderes: ['Garra de Gelo', 'Pingente Pendurado'] },
      { nome: 'Glaciaré', poderes: ['Coroa Glacial', 'Nevasca Sonolenta'] },
    ],
  },
  {
    id: 's009', numero: 9, tipo: 'Som', raridade: 'epica',
    fato: 'O uirapuru vive na Floresta Amazônica e é famoso pelo canto, que parece uma flauta.',
    formas: [
      { nome: 'Cantaru', poderes: ['Nota Aguda', 'Assobio Mágico'], imagem: img('009', 1) },
      { nome: 'Melodiru', poderes: ['Canção Brilhante', 'Eco da Floresta'] },
      { nome: 'Sinfonuru', poderes: ['Onda Arco-Íris', 'Grande Sinfonia'] },
    ],
  },
  {
    id: 's010', numero: 10, tipo: 'Estrela', raridade: 'lendaria',
    fato: 'O tamanduá-mirim não tem dentes. Ele pega formigas e cupins com a língua comprida e grudenta.',
    formas: [
      { nome: 'Estrelim', poderes: ['Pó de Estrela', 'Língua Cometa'], imagem: img('010', 1) },
      { nome: 'Constelão', poderes: ['Chuva de Meteoros', 'Lua Crescente'], imagem: img('010', 2) },
      { nome: 'Galaxiá', poderes: ['Explosão Estelar', 'Galáxia Giratória'], imagem: img('010', 3) },
    ],
  },
];

/** Quantos Sabimons a coleção completa vai ter. */
export const TOTAL_PLANEJADO = 99;

export const sabimonPorId = new Map(sabimons.map((s) => [s.id, s]));
