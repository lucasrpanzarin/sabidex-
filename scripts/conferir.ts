// Confere um capítulo com as regras de src/lib/conteudo.ts (não usa internet nem custa nada).
// Uso:
//   npm run conferir -- historia-11            mostra os problemas
//   npm run conferir -- historia-11 --ano 3    usa as regras de outro ano escolar
//   npm run conferir -- historia-11 --espalhar espalha as respostas certas da prova entre A, B, C e D
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import type { Capitulo } from '../src/data/tipos';
import { validarCapitulo, espalharRespostas } from '../src/lib/conteudo';

const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith('--'));
const ano = Number(args[args.indexOf('--ano') + 1]) || 4;
if (!id) { console.log('Diga o capítulo. Ex.: npm run conferir -- historia-11'); process.exit(1); }

const arquivo = `src/data/${id.replace(/-/g, '')}.ts`;
if (!existsSync(arquivo)) { console.log(`Não achei ${arquivo}.`); process.exit(1); }
const mod = await import(pathToFileURL(arquivo).href) as Record<string, Capitulo>;
const cap = Object.values(mod).find((v) => v && typeof v === 'object' && 'prova' in v);
if (!cap) { console.log(`${arquivo} não exporta um capítulo.`); process.exit(1); }

if (args.includes('--espalhar')) {
  const texto = readFileSync(arquivo, 'utf8');
  const i = texto.indexOf('= {');
  const novo = { ...cap, prova: espalharRespostas(cap.prova) };
  writeFileSync(arquivo, texto.slice(0, i) + '= ' + JSON.stringify(novo, null, 2) + ';\n');
  Object.assign(cap, novo);
  console.log('Respostas certas espalhadas:', cap.prova.map((q) => 'ABCD'[q.certa]).join(' '));
}

const problemas = validarCapitulo(cap, ano);
console.log(`\n${cap.titulo} (${id}, regras do ${ano}º ano)`);
if (!problemas.length) console.log('Tudo dentro das regras.');
for (const p of problemas) console.log(' - ' + p);
process.exit(problemas.some((p) => p.startsWith('ERRO')) ? 1 : 0);
