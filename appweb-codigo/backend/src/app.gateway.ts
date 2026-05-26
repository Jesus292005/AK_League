import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

// Habilitamos CORS para que React (que corre en otro puerto) pueda conectarse
@WebSocketGateway({ cors: true })
export class AppGateway {
  @WebSocketServer()
  server!: Server;

  // Esta función avisa a todos los navegadores conectados que hubo gol
  notificarGol(equipo: string) {
    this.server.emit('nuevo_gol', equipo);
  }
}