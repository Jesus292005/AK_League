import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, MqttContext, Payload } from '@nestjs/microservices';
import { AppGateway } from './app.gateway';

@Controller()
export class AppController {
  // Inyectamos el Gateway
  constructor(private readonly appGateway: AppGateway) {}
  
  @EventPattern('akl/cancha/goles')
  handleGoal(@Payload() payload: any, @Ctx() context: MqttContext) {
    console.log(`📢 ¡GOLAZO RECIBIDO EN EL BACKEND!: ${payload}`);
    
    // Le decimos al Gateway que mande la señal a React
    this.appGateway.notificarGol(payload);
  }
}