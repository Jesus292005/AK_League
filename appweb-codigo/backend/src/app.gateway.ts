import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class AppGateway {
  @WebSocketServer()
  server!: Server;

  notificarGol(equipo: string) {
    this.server.emit('nuevo_gol', equipo);
  }
}