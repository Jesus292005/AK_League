import { Controller, Get, Post } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AppGateway } from './app.gateway';

@Controller()
export class AppController {

  private partidoActivo: boolean = false;
  private tiempoUltimoGol: number = 0;
  private readonly COOLDOWN_MS = 5000;

  constructor(private readonly appGateway: AppGateway) {}

  @Post('iniciar')
  iniciarPartido() {
    this.partidoActivo = true;
    this.tiempoUltimoGol = 0; 
    console.log('🏁 ¡El partido ha comenzado! Sensores activados.');
    return { mensaje: 'Partido iniciado' };
  }

  @Post('detener')
  detenerPartido() {
    this.partidoActivo = false;
    console.log('🛑 Partido detenido. Sensores ignorados.');
    return { mensaje: 'Partido detenido' };
  }

  @EventPattern('akl/cancha/goles')
  handleGoal(@Payload() equipo: string) {

    if (!this.partidoActivo) {
      console.log(`[Rechazado] Se detectó movimiento de ${equipo}, pero el partido está detenido.`);
      return; 
    }

    const tiempoActual = Date.now();
    if (tiempoActual - this.tiempoUltimoGol < this.COOLDOWN_MS) {
      console.log(`[Rechazado] Objeto detectado en portería de ${equipo} durante el cooldown.`);
      return; 
    }

    this.tiempoUltimoGol = tiempoActual;
    console.log(`⚽ ¡GOL VÁLIDO REGISTRADO!: ${equipo}`);
    
    this.appGateway.notificarGol(equipo);
  }
}