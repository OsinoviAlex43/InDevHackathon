package by.osinovii.hacathonback.services;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class IoTService {
    private final SimpMessagingTemplate messagingTemplate;

    public IoTService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void updateDeviceStatus(String deviceId, String command) {
        // Здесь логика взаимодействия с реальными IoT-устройствами (MQTT/HTTP API)
        String newStatus = "ON".equals(command) ? "ON" : "OFF";

        // Отправка обновления всем подписчикам
        messagingTemplate.convertAndSend(
                "/topic/iot_updates",
                "Device " + deviceId + " is now " + newStatus
        );
    }
}