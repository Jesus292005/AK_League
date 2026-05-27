import { Controller, Post } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AppGateway } from './app.gateway';

@Controller()
export class AppController {
  // Ahora manejamos 3 estados posibles
  private estadoPartido: 'detenido' | 'jugando' | 'pausado' = 'detenido';
  private tiempoUltimoGol: number = 0;
  private readonly COOLDOWN_MS = 5000;

  constructor(private readonly appGateway: AppGateway) {}

  // ==========================================
  // ENDPOINTS DE CONTROL DEL JUEGO
  // ==========================================
  
  @Post('iniciar')
  iniciarPartido() {
    this.estadoPartido = 'jugando';
    this.tiempoUltimoGol = 0;
    console.log('🏁 ¡El partido ha comenzado! Marcador en 0.');
    return { mensaje: 'Partido iniciado' };
  }

  @Post('pausar')
  pausarPartido() {
    this.estadoPartido = 'pausado';
    console.log('⏸️ Partido pausado. Sensores en espera.');
    return { mensaje: 'Partido pausado' };
  }

  @Post('reanudar')
  reanudarPartido() {
    this.estadoPartido = 'jugando';
    this.tiempoUltimoGol = 0; // Se reinicia el reloj de cooldown por seguridad
    console.log('▶️ Partido reanudado. Sensores activos.');
    return { mensaje: 'Partido reanudado' };
  }

  @Post('finalizar')
  finalizarPartido() {
    this.estadoPartido = 'detenido';
    console.log('🛑 Partido finalizado. Marcador definitivo.');
    return { mensaje: 'Partido finalizado' };
  }

  // ==========================================
  // RECEPCIÓN DE SENSORES (MQTT)
  // ==========================================

  @EventPattern('akl/cancha/goles')
  handleGoal(@Payload() equipo: string) {
    // Solo aceptamos goles si el estado es exactamente 'jugando'
    if (this.estadoPartido !== 'jugando') {
      console.log(`[Rechazado] Gol de ${equipo} ignorado. Estado actual: ${this.estadoPartido}`);
      return; 
    }

    const tiempoActual = Date.now();
    if (tiempoActual - this.tiempoUltimoGol < this.COOLDOWN_MS) {
      console.log(`[Rechazado] Objeto en portería de ${equipo} durante el cooldown.`);
      return; 
    }

    this.tiempoUltimoGol = tiempoActual;
    console.log(`⚽ ¡GOL VÁLIDO REGISTRADO!: ${equipo}`);
    this.estadoPartido = 'pausado';
    this.appGateway.notificarGol(equipo);
  }
}