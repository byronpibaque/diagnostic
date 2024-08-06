import OpenAI from 'openai';
import MedicoService from './medicoService';
import parametroDetService from './parametroDetService';


class PrediagnosticoService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generarPrediagnostico(nombre: string, sintomas: string): Promise<any> {
    const respuestaIA = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente médico que ayuda a diagnosticar enfermedades basadas en síntomas.'
        },
        {
          role: 'user',
          content: `Paciente ${nombre} presenta los siguientes síntomas: ${sintomas}. ¿Cuál podría ser el diagnóstico y qué recomendaciones se pueden dar?`
        }
      ],
      max_tokens: 4096,
    });

    const prediagnostico = respuestaIA.choices && respuestaIA.choices.length > 0 ? respuestaIA.choices[0].message.content?.trim() : '';

    const especialidad = await this.obtenerEspecialidad(prediagnostico);
    const medicoRecomendadoPromise = MedicoService.getOneMedicoByParams({ especialidad });
    const medicoRecomendado = await medicoRecomendadoPromise;

    return {
      prediagnostico,
      recomendaciones: `Se recomienda consultar con un especialista en ${especialidad}.`,
      medicoRecomendado,
    };
  }

  private async obtenerEspecialidad(prediagnostico: string | undefined): Promise<string> {
    prediagnostico = prediagnostico ?? '';
    const especialidadesArray = await parametroDetService.getParametroDetsByDescripcion('ESPECIALIDADES');
    for (const especialidad of especialidadesArray) {
      if (prediagnostico.toLowerCase().includes(especialidad.valor.toLowerCase())) {
        return especialidad.clave;
      }
    }
    return 'GENERAL';
  }
}

export default new PrediagnosticoService();