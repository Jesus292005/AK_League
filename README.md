# Cancha de futbol inteligente

Este proyecto es un sistema IoT diseñado para detectar goles en una portería mediante hardware y reflejar el marcador o los eventos en tiempo real en una interfaz web, sin necesidad de utilizar una base de datos.

## Arquitectura y Tecnologías
1. **Hardware:** Microcontrolador ESP32, Sensores Infrarrojos (para detectar el paso del balón) y LEDs (diseño visual físico).
2. **Backend:** NestJS
3. **Frontend:** React / Vite. 

---

## Requisitos Previos

* **Para el Hardware:** Tener descargado la extensión ESP-IDF para poder trabajar el esp32.
* **Para el Software:** [Node.js](https://nodejs.org/) (v18 o superior), instalador de paquetes(pnpm, npm, etc.).
* **Broker MQTT:** Descargar Mosquitto.
* **Red:** Un broker MQTT (local o en la nube) y que todos los dispositivos estén en la misma red local si se prueba desde casa.

---

## Configuración y Ejecución

Debes levantar las 3 partes del proyecto para que la comunicación fluya correctamente.

### 1. Configuración del ESP32 (Hardware)

1. Abre el código fuente de los ESP32
2. Asegúrate de instalar las librerías de WiFi y del cliente MQTT que estan en los códigos.
3. Modifica las credenciales de conexión en la cabecera del código:
   ```cpp
   #define WIFI_SSID = "TU_RED_WIFI";
   #define WIFI_PASS = "TU_PASSWORD";
   #define BROKER_URL = "IP_DE_TU_BROKER_O_COMPUTADORA";
4. Conectar cables en los pines establecidos en el código.
5. Ejecutar cada código (equipo azul y equipo naranja) en cada ESP32.

### 2. Configuración del sistema web
1. Entrar en carpeta Backend, hacer pnpm install y repetir este paso en la carpeta Front.
2. Una vez instalado los paquetes, escribir "pnpm run dev" en ambas carpetas en terminales separadas para correr los servicios.

### 3. Jugar
1. Una vez los codigos de los ESP32 compilados y corriendo, junto con los servicios back y front web corriendo ya se puede utilizar el sistema entero.
