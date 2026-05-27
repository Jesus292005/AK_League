import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.MQTT,
    options: {
      url: 'mqtt://192.168.100.53:1883',
    },
  });

  await app.startAllMicroservices();
  await app.listen(3000);
  console.log('¡Backend de AKL corriendo y escuchando a Mosquitto!');
}
bootstrap();