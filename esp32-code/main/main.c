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
#define SENSOR_PIN 4
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
    gpio_reset_pin(SENSOR_PIN);
    gpio_set_direction(SENSOR_PIN, GPIO_MODE_INPUT);
    gpio_set_pull_mode(SENSOR_PIN, GPIO_PULLUP_ONLY);

    printf("Sensor listo. Esperando goles...\n");

    while (1)
    {
        int estado_sensor = gpio_get_level(SENSOR_PIN);

        gpio_reset_pin(2);
        gpio_set_direction(2, GPIO_MODE_OUTPUT);

        if (estado_sensor == 0)
        {
            gpio_set_level(2, 1);
            printf("¡GOL DETECTADO! Enviando a Mosquitto...\n");
            char json_payload[100];
            sprintf(json_payload, "{\"pattern\":\"akl/cancha/goles\",\"data\":\"gol_azul\"}");

            // Publicamos el JSON en lugar del texto plano
            esp_mqtt_client_publish(client, "akl/cancha/goles", json_payload, 0, 1, 0);

            // Filtro anti-rebote: esperar para no mandar 50 goles seguidos
            printf("Cooldown activado (%d ms)...\n", COOLDOWN_MS);
            vTaskDelay(COOLDOWN_MS / portTICK_PERIOD_MS);
            gpio_set_level(2, 0);
            printf("Listo para otro gol.\n");
        }

        // Pequeño delay para no saturar el procesador
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
