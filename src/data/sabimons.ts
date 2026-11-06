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
      { nome: 'Brasão', poderes: ['Juba de Fogo', 'Soco Brasa'], imagem: img('001', 2) },
      { nome: 'Fornalhuda', poderes: ['Coroa Vulcânica', 'Rio de Lava'], imagem: img('001', 3) },
    ],
  },
  {
    id: 's002', numero: 2, tipo: 'Água', raridade: 'comum',
    fato: 'O boto-cor-de-rosa vive nos rios da Amazônia. É o maior golfinho de rio do mundo.',
    formas: [
      { nome: 'Pingoró', poderes: ['Bolha Saltitante', 'Esguicho'], imagem: img('002', 1) },
      { nome: 'Botorrão', poderes: ['Onda Curvada', 'Nadadeira Giratória'], imagem: img('002', 2) },
      { nome: 'Marabotão', poderes: ['Anel das Águas', 'Tromba-d’Água'], imagem: img('002', 3) },
    ],
  },
  {
    id: 's003', numero: 3, tipo: 'Planta', raridade: 'comum',
    fato: 'O tatu-bola se fecha como uma bola para se proteger. Ele só existe no Brasil.',
    formas: [
      { nome: 'Sementú', poderes: ['Chicote de Cipó', 'Bola de Folhas'], imagem: img('003', 1) },
      { nome: 'Tatuflora', poderes: ['Flor Perfumada', 'Laço de Cipó'], imagem: img('003', 2) },
      { nome: 'Matatu', poderes: ['Floresta Viva', 'Raiz Gigante'], imagem: img('003', 3) },
    ],
  },
  {
    id: 's004', numero: 4, tipo: 'Raio', raridade: 'comum',
    fato: 'O vaga-lume faz luz com uma mistura química dentro do corpo, e essa luz quase não esquenta.',
    formas: [
      { nome: 'Zapinho', poderes: ['Pisca-Pisca', 'Choquinho'], imagem: img('004', 1) },
      { nome: 'Faiscaluz', poderes: ['Asa Relâmpago', 'Faísca Dupla'], imagem: img('004', 2) },
      { nome: 'Trovalume', poderes: ['Lanterna Trovão', 'Armadura Elétrica'], imagem: img('004', 3) },
    ],
  },
  {
    id: 's005', numero: 5, tipo: 'Pedra', raridade: 'rara',
    fato: 'O jabuti é uma tartaruga que vive em terra firme e pode passar dos 50 anos de idade.',
    formas: [
      { nome: 'Pedrolho', poderes: ['Casco Duro', 'Cristal Brilhante'], imagem: img('005', 1) },
      { nome: 'Cristabuti', poderes: ['Cristal Rosa', 'Pisada Turquesa'], imagem: img('005', 2) },
      { nome: 'Montabuti', poderes: ['Soco de Geodo', 'Golem de Cristal'], imagem: img('005', 3) },
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
    fato: 'A maria-farinha corre de lado bem rápido na areia da praia. O guaiamum é um caranguejo azul que vive perto dos manguezais.',
    formas: [
      { nome: 'Arenito', poderes: ['Pinça Rápida', 'Esconde na Areia'], imagem: img('007', 1) },
      { nome: 'Dunasiri', poderes: ['Redemoinho de Areia', 'Garra de Arenito'], imagem: img('007', 2) },
      { nome: 'Tempestasiri', poderes: ['Tempestade de Areia', 'Casco de Duna'], imagem: img('007', 3) },
    ],
  },
  {
    id: 's008', numero: 8, tipo: 'Gelo', raridade: 'epica',
    fato: 'No pelo do bicho-preguiça crescem algas, que deixam ele meio verde e ajudam a se esconder nas árvores.',
    formas: [
      { nome: 'Nevim', poderes: ['Sopro Gelado', 'Abraço de Neve'], imagem: img('008', 1) },
      { nome: 'Friozão', poderes: ['Garra de Gelo', 'Pingente Pendurado'], imagem: img('008', 2) },
      { nome: 'Glaciaré', poderes: ['Coroa Glacial', 'Nevasca Sonolenta'], imagem: img('008', 3) },
    ],
  },
  {
    id: 's009', numero: 9, tipo: 'Som', raridade: 'epica',
    fato: 'O uirapuru vive na Floresta Amazônica e é famoso pelo canto, que parece uma flauta.',
    formas: [
      { nome: 'Cantaru', poderes: ['Nota Aguda', 'Assobio Mágico'], imagem: img('009', 1) },
      { nome: 'Melodiru', poderes: ['Canção Brilhante', 'Eco da Floresta'], imagem: img('009', 2) },
      { nome: 'Sinfonuru', poderes: ['Onda Arco-Íris', 'Grande Sinfonia'], imagem: img('009', 3) },
    ],
  },
  {
    id: 's010', numero: 10, tipo: 'Estrela', raridade: 'lendaria',
    fato: 'O tamanduá-bandeira não tem dentes. Ele pega formigas e cupins com a língua, que pode passar de meio metro.',
    formas: [
      { nome: 'Estrelim', poderes: ['Pó de Estrela', 'Língua Cometa'], imagem: img('010', 1) },
      { nome: 'Constelão', poderes: ['Chuva de Meteoros', 'Lua Crescente'], imagem: img('010', 2) },
      { nome: 'Galaxiá', poderes: ['Explosão Estelar', 'Galáxia Giratória'], imagem: img('010', 3) },
    ],
  },
  {
    id: 's011', numero: 11, tipo: 'Água', raridade: 'comum',
    fato: 'O peixe-boi é um mamífero que vive na água e só come plantas.',
    formas: [
      { nome: 'Bolhudo', poderes: ['Rajada de Bolhas', 'Rabo Remador'], imagem: img('011', 1) },
      { nome: 'Bolhão', poderes: ['Escudo de Água', 'Anel de Onda'], imagem: img('011', 2) },
      { nome: 'Maremanso', poderes: ['Redemoinho Gigante', 'Coroa das Águas'], imagem: img('011', 3) },
    ],
  },
  {
    id: 's012', numero: 12, tipo: 'Planta', raridade: 'comum',
    fato: 'Muitas pererecas têm ventosas nos dedos, que ajudam a grudar em folhas e galhos.',
    formas: [
      { nome: 'Folhapé', poderes: ['Pulo de Folha', 'Cipó Grudento'], imagem: img('012', 1) },
      { nome: 'Saltifolha', poderes: ['Capa de Folhas', 'Salto Florido'], imagem: img('012', 2) },
      { nome: 'Pereflora', poderes: ['Jardim Vivo', 'Chicote de Orquídea'], imagem: img('012', 3) },
    ],
  },
  {
    id: 's013', numero: 13, tipo: 'Vento', raridade: 'comum',
    fato: 'O bico do tucano é enorme, mas é leve, porque por dentro é cheio de espaços com ar.',
    formas: [
      { nome: 'Tucanuvem', poderes: ['Sopro de Bico', 'Pena Ligeira'], imagem: img('013', 1) },
      { nome: 'Bicorrente', poderes: ['Mergulho do Vento', 'Nuvem Giratória'], imagem: img('013', 2) },
      { nome: 'Tucaventania', poderes: ['Ciclone de Penas', 'Bico Ventania'], imagem: img('013', 3) },
    ],
  },
  {
    id: 's014', numero: 14, tipo: 'Areia', raridade: 'comum',
    fato: 'A tartaruga-marinha passa a vida no mar, mas volta à praia para botar os ovos na areia.',
    formas: [
      { nome: 'Areiruga', poderes: ['Nadadeira de Areia', 'Casco Espiral'], imagem: img('014', 1) },
      { nome: 'Conchaduna', poderes: ['Chuva de Conchas', 'Redemoinho Dourado'], imagem: img('014', 2) },
      { nome: 'Tartamaré', poderes: ['Duna Gigante', 'Anel de Areia'], imagem: img('014', 3) },
    ],
  },
  {
    id: 's015', numero: 15, tipo: 'Raio', raridade: 'rara',
    fato: 'O poraquê é um peixe da Amazônia que dá choques elétricos para se defender e para caçar.',
    formas: [
      { nome: 'Faiscaraqué', poderes: ['Choque de Rio', 'Corpo Faísca'], imagem: img('015', 1) },
      { nome: 'Voltaraqué', poderes: ['Espiral Elétrica', 'Barbatana Raio'], imagem: img('015', 2) },
      { nome: 'Trovaraqué', poderes: ['Coroa de Trovão', 'Arco Relâmpago'], imagem: img('015', 3) },
    ],
  },
  {
    id: 's016', numero: 16, tipo: 'Fogo', raridade: 'rara',
    fato: 'O lobo-guará vive no Cerrado. As pernas compridas ajudam ele a enxergar por cima do capim alto.',
    formas: [
      { nome: 'Guarabrasa', poderes: ['Juba de Brasa', 'Corrida do Cerrado'], imagem: img('016', 1) },
      { nome: 'Juballama', poderes: ['Crista de Chamas', 'Pata Fogosa'], imagem: img('016', 2) },
      { nome: 'Guaravulcão', poderes: ['Armadura de Lava', 'Uivo Vulcânico'], imagem: img('016', 3) },
    ],
  },
  {
    id: 's017', numero: 17, tipo: 'Pedra', raridade: 'rara',
    fato: 'A anta é o maior mamífero terrestre do Brasil. A tromba curta ajuda a pegar folhas e frutas.',
    formas: [
      { nome: 'Antarocha', poderes: ['Tromba Pedrada', 'Pedrinhas Voadoras'], imagem: img('017', 1) },
      { nome: 'Pedranta', poderes: ['Investida de Pedra', 'Espinha de Cristal'], imagem: img('017', 2) },
      { nome: 'Montanta', poderes: ['Serra de Cristal', 'Chuva de Rochas'], imagem: img('017', 3) },
    ],
  },
  {
    id: 's018', numero: 18, tipo: 'Gelo', raridade: 'epica',
    fato: 'O pinguim-de-magalhães vive mais ao sul, mas às vezes aparece no litoral do Brasil no inverno.',
    formas: [
      { nome: 'Geladim', poderes: ['Escorregão Gelado', 'Bafo de Gelo'], imagem: img('018', 1) },
      { nome: 'Pinguigelo', poderes: ['Asa Lâmina', 'Nevasca Rodopiante'], imagem: img('018', 2) },
      { nome: 'Glaciguim', poderes: ['Espinhos de Geleira', 'Anel de Flocos'], imagem: img('018', 3) },
    ],
  },
  {
    id: 's019', numero: 19, tipo: 'Som', raridade: 'epica',
    fato: 'O ronco do bugio é tão forte que pode ser ouvido a quilômetros de distância.',
    formas: [
      { nome: 'Bugiurro', poderes: ['Ronco Forte', 'Rabo Laço'], imagem: img('019', 1) },
      { nome: 'Ecobugio', poderes: ['Anéis de Som', 'Eco da Mata'], imagem: img('019', 2) },
      { nome: 'Bugitroante', poderes: ['Onda de Choque', 'Coroa Sonora'], imagem: img('019', 3) },
    ],
  },
  {
    id: 's020', numero: 20, tipo: 'Estrela', raridade: 'lendaria',
    fato: 'A onça-pintada é o maior felino das Américas e nada muito bem.',
    formas: [
      { nome: 'Oncelestre', poderes: ['Pintas Brilhantes', 'Bote Estrelado'], imagem: img('020', 1) },
      { nome: 'Onçastral', poderes: ['Salto da Lua', 'Poeira de Estrelas'], imagem: img('020', 2) },
      { nome: 'Constelonça', poderes: ['Galáxia Pintada', 'Chuva de Cometas'], imagem: img('020', 3) },
    ],
  },
  {
    id: 's021', numero: 21, tipo: 'Água', raridade: 'epica',
    fato: 'A orca é o maior golfinho do mundo. Ela vive no mar e às vezes visita o litoral do Brasil.',
    formas: [
      { nome: 'Ondorca', poderes: ['Salto Espirrado', 'Bolha Turquesa'], imagem: img('021', 1) },
      { nome: 'Marorca', poderes: ['Barbatana Lâmina', 'Surfe na Onda'], imagem: img('021', 2) },
      { nome: 'Tsunorca', poderes: ['Coroa das Ondas', 'Tsunami'], imagem: img('021', 3) },
    ],
  },
  // Lendas do Brasil (Lucas, 06/11/2026): personagens do folclore. O "fato" conta o que diz a lenda.
  {
    id: 's022', numero: 22, tipo: 'Vento', raridade: 'lendaria', lenda: true,
    fato: 'A lenda conta que o Saci tem uma perna só, usa um gorro vermelho e se esconde nos redemoinhos de vento.',
    formas: [
      { nome: 'Sacizinho', poderes: ['Pulo de Uma Perna', 'Gorro Ventania'], imagem: img('022', 1) },
      { nome: 'Redemoinhaci', poderes: ['Redemoinho', 'Sumiço no Vento'], imagem: img('022', 2) },
      { nome: 'Saciclone', poderes: ['Ciclone Vermelho', 'Furacão Travesso'], imagem: img('022', 3) },
    ],
  },
  {
    id: 's023', numero: 23, tipo: 'Planta', raridade: 'epica', lenda: true,
    fato: 'A lenda conta que o Curupira tem cabelo de fogo e pés virados para trás, para confundir quem caça na mata.',
    formas: [
      { nome: 'Curupirinha', poderes: ['Pegada ao Contrário', 'Assobio da Mata'], imagem: img('023', 1) },
      { nome: 'Pegadapira', poderes: ['Cipó Laçador', 'Trilha Falsa'], imagem: img('023', 2) },
      { nome: 'Curupirão', poderes: ['Floresta Guardiã', 'Raízes Gigantes'], imagem: img('023', 3) },
    ],
  },
  {
    id: 's024', numero: 24, tipo: 'Fogo', raridade: 'epica', lenda: true,
    fato: 'A lenda conta que a Mula sem cabeça solta fogo pelo pescoço e galopa pelos campos nas noites escuras.',
    formas: [
      { nome: 'Faiscamula', poderes: ['Galope Faísca', 'Coice Quente'], imagem: img('024', 1) },
      { nome: 'Mulabrasa', poderes: ['Chama Galopante', 'Ferradura de Brasa'], imagem: img('024', 2) },
      { nome: 'Mulavulcão', poderes: ['Estouro de Lava', 'Trilha de Fogo'], imagem: img('024', 3) },
    ],
  },
  {
    id: 's025', numero: 25, tipo: 'Pedra', raridade: 'epica', lenda: true,
    fato: 'A lenda conta que a Caipora protege os bichos da mata e anda montada num porco-do-mato.',
    formas: [
      { nome: 'Caiporita', poderes: ['Pedrada da Mata', 'Galope do Queixada'], imagem: img('025', 1) },
      { nome: 'Caipotrilha', poderes: ['Trilha de Pedra', 'Escudo de Rocha'], imagem: img('025', 2) },
      { nome: 'Caiporainha', poderes: ['Muralha da Floresta', 'Terremoto'], imagem: img('025', 3) },
    ],
  },
  {
    id: 's026', numero: 26, tipo: 'Fogo', raridade: 'lendaria', lenda: true,
    fato: 'A lenda conta que o Boitatá é uma cobra de fogo de olhos enormes que protege as matas de quem põe fogo nelas.',
    formas: [
      { nome: 'Faiscatá', poderes: ['Olhar Brilhante', 'Faísca Rasteira'], imagem: img('026', 1) },
      { nome: 'Chamatá', poderes: ['Anel de Chamas', 'Bote Flamejante'], imagem: img('026', 2) },
      { nome: 'Boitatão', poderes: ['Serpente Solar', 'Rio de Fogo'], imagem: img('026', 3) },
    ],
  },
  {
    id: 's027', numero: 27, tipo: 'Água', raridade: 'lendaria', lenda: true,
    fato: 'A lenda conta que a Iara é metade moça e metade peixe e encanta as pessoas com o seu canto nos rios.',
    formas: [
      { nome: 'Iarinha', poderes: ['Canto do Rio', 'Bolha Encantada'], imagem: img('027', 1) },
      { nome: 'Cantaiara', poderes: ['Onda Melodiosa', 'Cauda Turquesa'], imagem: img('027', 2) },
      { nome: 'Rainhiara', poderes: ['Coroa do Rio', 'Canto das Águas'], imagem: img('027', 3) },
    ],
  },
  {
    id: 's028', numero: 28, tipo: 'Estrela', raridade: 'epica', lenda: true,
    fato: 'A lenda conta que o Lobisomem é um homem que vira lobo nas noites de lua cheia.',
    formas: [
      { nome: 'Uivinho', poderes: ['Uivo da Lua', 'Garra Prateada'], imagem: img('028', 1) },
      { nome: 'Uivolua', poderes: ['Salto Lunar', 'Lua Cheia'], imagem: img('028', 2) },
      { nome: 'Lobisolar', poderes: ['Eclipse Uivante', 'Chuva de Estrelas'], imagem: img('028', 3) },
    ],
  },
  {
    id: 's029', numero: 29, tipo: 'Som', raridade: 'epica', lenda: true,
    fato: 'O Boi-bumbá é uma festa com um boi que dança. A festa de Parintins, no Amazonas, é uma das maiores do Brasil.',
    formas: [
      { nome: 'Bumbinho', poderes: ['Batida do Tambor', 'Dança do Boi'], imagem: img('029', 1) },
      { nome: 'Bumbazão', poderes: ['Toada Forte', 'Fitas Coloridas'], imagem: img('029', 2) },
      { nome: 'Bumbaréu', poderes: ['Grande Festa', 'Arena do Som'], imagem: img('029', 3) },
    ],
  },
];

export const sabimonPorId = new Map(sabimons.map((s) => [s.id, s]));
