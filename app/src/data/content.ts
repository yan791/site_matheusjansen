// Todo o texto do site vive aqui. Mudou uma frase? É só editar este arquivo.

import facetasMacro from '../assets/img/facetas-macro.jpg'
import facetasMacroBlur from '../assets/img/facetas-macro-blur.jpg'
import facetasIsolamento from '../assets/img/facetas-isolamento.jpg'
import facetasSorriso from '../assets/img/facetas-sorriso.jpg'
import implantePlanejamento from '../assets/img/implante-planejamento.jpg'
import implanteResultado from '../assets/img/implante-resultado.jpg'
import drMatheus from '../assets/img/dr-matheus.jpg'

export const img = {
  facetasMacro,
  facetasMacroBlur,
  facetasIsolamento,
  facetasSorriso,
  implantePlanejamento,
  implanteResultado,
  drMatheus,
}

/** Contato. Preencher com os dados do consultório. */
export const contato = {
  // Só números, com DDI e DDD. Ex.: '5511999999999'
  whatsapp: '',
  mensagem: 'Olá! Vi o site e gostaria de agendar uma consulta com o Dr. Matheus Jansen.',
  // Link da página do Treinamento em Resina Composta (abre em outra aba)
  treinamento: '',
  instagram: '',
  endereco: '',
  cro: '',
}

export function linkTreinamento() {
  return contato.treinamento || '#'
}

export function linkAgendar() {
  if (!contato.whatsapp) return '#agendar'
  return `https://wa.me/${contato.whatsapp}?text=${encodeURIComponent(contato.mensagem)}`
}

export const capitulos = [
  { n: '01', nome: 'Quem faz' },
  { n: '02', nome: 'Resultado' },
  { n: '03', nome: 'Detalhe' },
  { n: '04', nome: 'Padrão' },
  { n: '05', nome: 'Caso real' },
]

export const marcacoesDente = [
  { n: '01', titulo: 'Forma', texto: 'Proporção desenhada para o seu rosto' },
  { n: '02', titulo: 'Textura', texto: 'Microtextura que reflete a luz como esmalte natural' },
  { n: '03', titulo: 'Translucidez', texto: 'Borda que deixa a luz atravessar' },
  { n: '04', titulo: 'Acabamento', texto: 'Polimento em camadas, sem brilho artificial' },
]

export const marcacoesImplante = [
  { titulo: 'Implante de titânio', texto: 'A raiz nova, firme no osso' },
  { titulo: 'Pilar protético', texto: 'A ponte entre o implante e o dente' },
  { titulo: 'Coroa em cerâmica', texto: 'O que todo mundo vê quando você sorri' },
]

export type Avaliacao = {
  nome: string
  texto: string
  curto: string
}

export const avaliacoes: Avaliacao[] = [
  {
    nome: 'Alice Sereno',
    texto:
      'Atendimento impecável do início ao fim. Dá para perceber o cuidado, o profissionalismo e o respeito com o paciente em cada etapa do atendimento. Recepção muito acolhedora. Matheus é extremamente competente, atencioso e transmite muita segurança. A equipe e o ambiente tornam tudo ainda melhor. Recomendo de olhos fechados!',
    curto: 'Matheus é extremamente competente, atencioso e transmite muita segurança.',
  },
  {
    nome: 'Tassia Tuanny',
    texto:
      'O atendimento do consultório é excelente, com uma equipe acolhedora, atenciosa e muito profissional. O Dr. Matheus é muito paciente, demonstra um cuidado em cada etapa do atendimento e realiza um trabalho de muita qualidade. Vânia, da recepção, é sempre muito solícita, educada e prestativa, tornando toda a experiência ainda mais agradável.',
    curto: 'O Dr. Matheus é muito paciente e realiza um trabalho de muita qualidade.',
  },
  {
    nome: 'Airton Meneses',
    texto:
      'Recomendo demais! Matheus é um excelente profissional. Atencioso e sempre explica tudo de forma detalhada e com muito conhecimento envolvido.',
    curto: 'Sempre explica tudo de forma detalhada e com muito conhecimento envolvido.',
  },
  {
    nome: 'Aiane Siqueira',
    texto:
      'Ambiente acolhedor, com excelentes profissionais que tratam o paciente com dedicação e respeito. Muito profissionalismo envolvido. Recomendo de olhos fechados.',
    curto: 'Excelentes profissionais que tratam o paciente com dedicação e respeito.',
  },
]
