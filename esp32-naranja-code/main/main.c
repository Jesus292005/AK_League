#include <stdio.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "nvs_flash.h"
#include "mqtt_client.h"

#define WIFI_SSID "MSI8576"
#define WIFI_PASS "4332815Ly"
#define BROKER_URL "mqtt://192.168.137.1"
#define SENSOR_PIN_1 4
#define SENSOR_PIN_2 5
#define COOLDOWN_MS 3000
#define LED_PORTERIA_PIN 25

esp_mqtt_client_handle_t client;

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
    vTaskDelay(5000 / portTICK_PERIOD_MS);
}

void sensor_task(void *pvParameters)
{
    gpio_reset_pin(SENSOR_PIN_1);
    gpio_set_direction(SENSOR_PIN_1, GPIO_MODE_INPUT);
    gpio_set_pull_mode(SENSOR_PIN_1, GPIO_PULLUP_ONLY);

    gpio_reset_pin(SENSOR_PIN_2);
    gpio_set_direction(SENSOR_PIN_2, GPIO_MODE_INPUT);
    gpio_set_pull_mode(SENSOR_PIN_2, GPIO_PULLUP_ONLY);

    gpio_reset_pin(2);
    gpio_set_direction(2, GPIO_MODE_OUTPUT);
    gpio_set_level(2, 0);
    
    gpio_reset_pin(LED_PORTERIA_PIN);
    gpio_set_direction(LED_PORTERIA_PIN, GPIO_MODE_OUTPUT);
    gpio_set_level(LED_PORTERIA_PIN, 0);

    printf("Sensor listo. Esperando lecturas.\n");

    while (1)
    {
        int estado_1 = gpio_get_level(SENSOR_PIN_1);
        int estado_2 = gpio_get_level(SENSOR_PIN_2);

        if (estado_1 == 0 || estado_2 == 0)
        {
            gpio_set_level(2, 1);
            printf("Gol detectado. Construyendo paquete MQTT...\n");
            
            char json_payload[100];
            
            sprintf(json_payload, "{\"pattern\":\"akl/cancha/goles\",\"data\":\"gol_naranja\"}");

            esp_mqtt_client_publish(client, "akl/cancha/goles", json_payload, 0, 1, 0);

            for (int i = 0; i < 10; i++) 
            {
                gpio_set_level(2, 1);
                gpio_set_level(LED_PORTERIA_PIN, 1);
                vTaskDelay(250 / portTICK_PERIOD_MS);
                
                gpio_set_level(2, 0);
                gpio_set_level(LED_PORTERIA_PIN, 0);
                vTaskDelay(250 / portTICK_PERIOD_MS); 
            }
            
            gpio_set_level(2, 0);
            gpio_set_level(LED_PORTERIA_PIN, 0);
            printf("Sistema listo para nueva lectura.\n");
        }

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
