idf_component_register(SRCS "main.c"
                       INCLUDE_DIRS ""
                       REQUIRES esp_netif esp_wifi mqtt driver nvs_flash)