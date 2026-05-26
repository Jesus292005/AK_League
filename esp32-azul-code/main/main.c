#include <stdio.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "nvs_flash.h"
#include "mqtt_client.h"

#define WIFI_SSID "Totalplay-70AF"
#define WIFI_PASS "70AF954By6BfW28a"
#define BROKER_URL "mqtt://192.168.100.53"
#define SENSOR_PIN_1 4
#define SENSOR_PIN_2 5
#define COOLDOWN_MS 3000

esp_mqtt_client_handle_t client;

// Función para inicializar el Wi-Fi rápido
void init_wifi()
{
    nvs_flash_init();
    esp_netif_init();
    esp_event_loop_create_default();
    esp_netif_create_default_wifi_sta();
    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    esp_wifi_init(&cfg);

    wifi_config_t wifi_config = {
        .sta = {
            .ssid = WIFI_SSID,
            .password = WIFI_PASS,
        },
    };
    esp_wifi_set_mode(WIFI_MODE_STA);
    esp_wifi_set_config(WIFI_IF_STA, &wifi_config);
    esp_wifi_start();
    esp_wifi_connect();
    printf("Conectando al Wi-Fi...\n");
    vTaskDelay(5000 / portTICK_PERIOD_MS); // Espera 5 seg a que conecte
}

// Tarea principal que lee el sensor
void sensor_task(void *pvParameters)
{
    // 1. Configuración de los pines de los sensores como entrada
    gpio_reset_pin(SENSOR_PIN_1);
    gpio_set_direction(SENSOR_PIN_1, GPIO_MODE_INPUT);
    gpio_set_pull_mode(SENSOR_PIN_1, GPIO_PULLUP_ONLY);

    gpio_reset_pin(SENSOR_PIN_2);
    gpio_set_direction(SENSOR_PIN_2, GPIO_MODE_INPUT);
    gpio_set_pull_mode(SENSOR_PIN_2, GPIO_PULLUP_ONLY);

    // 2. Configuración del pin del LED integrado como salida
    gpio_reset_pin(2);
    gpio_set_direction(2, GPIO_MODE_OUTPUT);
    gpio_set_level(2, 0); // Asegurar que inicie apagado

    printf("Sensores listos en pines %d y %d. Esperando lecturas...\n", SENSOR_PIN_1, SENSOR_PIN_2);

    while (1)
    {
        // 3. Leer el estado actual de ambos sensores
        int estado_1 = gpio_get_level(SENSOR_PIN_1);
        int estado_2 = gpio_get_level(SENSOR_PIN_2);

        // 4. Evaluar si alguno de los dos sensores detecta un objeto (asumiendo lógica negada)
        if (estado_1 == 0 || estado_2 == 0)
        {
            // Encender el LED para indicar detección
            gpio_set_level(2, 1);
            printf("Gol detectado. Construyendo paquete MQTT...\n");
            
            // Construir el JSON con el formato requerido por NestJS
            char json_payload[100];
            
            // IMPORTANTE: En el código del segundo ESP32, cambia "gol_azul" por "gol_naranja"
            sprintf(json_payload, "{\"pattern\":\"akl/cancha/goles\",\"data\":\"gol_azul\"}");

            // Publicar el mensaje en el broker
            esp_mqtt_client_publish(client, "akl/cancha/goles", json_payload, 0, 1, 0);

            // Detener la tarea durante el tiempo de cooldown para evitar lecturas múltiples
            printf("Cooldown activado (%d ms)...\n", COOLDOWN_MS);
            vTaskDelay(COOLDOWN_MS / portTICK_PERIOD_MS);
            
            // Apagar el LED tras concluir el cooldown
            gpio_set_level(2, 0);
            printf("Sistema listo para nueva lectura.\n");
        }

        // 5. Pequeño retardo obligatorio para liberar el procesador (Watchdog)
        vTaskDelay(50 / portTICK_PERIOD_MS);
    }
}

void app_main(void)
{

    init_wifi();

    esp_mqtt_client_config_t mqtt_cfg = {
        .broker.address.uri = BROKER_URL,
    };
    client = esp_mqtt_client_init(&mqtt_cfg);
    esp_mqtt_client_start(client);

    vTaskDelay(2000 / portTICK_PERIOD_MS);

    xTaskCreate(sensor_task, "sensor_task", 2048, NULL, 5, NULL);
}
