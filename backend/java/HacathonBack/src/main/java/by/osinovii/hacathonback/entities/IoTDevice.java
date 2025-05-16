package by.osinovii.hacathonback.entities;

import lombok.Data;

@Data // Lombok
public class IoTDevice {
    private String deviceId;
    private String type; // "LIGHT", "THERMOSTAT", "DOOR_LOCK"
    private String status; // "ON", "OFF", "ERROR"
}