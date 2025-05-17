package by.osinovii.hacathonback.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Controller
public class WebSocketController {

    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // Хранилище комнат и гостей (для демонстрации)
    private Map<String, Map<String, Object>> rooms = new HashMap<>();
    private Map<String, Map<String, Object>> guests = new HashMap<>();
    
    public WebSocketController() {
        // Инициализация демо-комнат
        initDemoData();
    }
    
    // Основная точка входа для всех WebSocket сообщений
    @MessageMapping("/socket")
    @SendTo("/topic/messages")
    public String handleSocketMessage(String message) {
        try {
            // Разбор входящего сообщения
            JsonNode rootNode = objectMapper.readTree(message);
            String action = rootNode.get("action").asText();
            JsonNode data = rootNode.get("data");
            
            // Выбор действия в зависимости от action
            switch (action) {
                case "get_rooms":
                    return getRooms();
                case "add_room":
                    return addRoom(data);
                case "update_room":
                    return updateRoom(data);
                case "delete_room":
                    return deleteRoom(data);
                case "get_guests":
                    return getGuests();
                case "add_guest":
                    return addGuest(data);
                case "update_guest":
                    return updateGuest(data);
                case "delete_guest":
                    return deleteGuest(data);
                case "assign_multiple_guests":
                    return assignMultipleGuests(data);
                default:
                    return createErrorResponse("Неизвестное действие: " + action);
            }
            
        } catch (Exception e) {
            return createErrorResponse("Ошибка обработки сообщения: " + e.getMessage());
        }
    }
    
    // Получение списка всех комнат
    private String getRooms() {
        try {
            ObjectNode response = objectMapper.createObjectNode();
            response.put("action", "initial_data");
            
            ObjectNode dataNode = objectMapper.createObjectNode();
            dataNode.set("rooms", objectMapper.valueToTree(rooms.values()));
            
            response.set("data", dataNode);
            return objectMapper.writeValueAsString(response);
        } catch (Exception e) {
            return createErrorResponse("Ошибка при получении комнат: " + e.getMessage());
        }
    }
    
    // Обновление информации о комнате
    private String updateRoom(JsonNode data) {
        try {
            String roomId = data.get("id").asText();
            
            if (!rooms.containsKey(roomId)) {
                return createErrorResponse("Комната с ID " + roomId + " не найдена");
            }
            
            Map<String, Object> room = rooms.get(roomId);
            
            // Обновляем статус если он указан
            if (data.has("status")) {
                room.put("status", data.get("status").asText());
            }
            
            // Обновляем дату изменения
            room.put("updated_at", getCurrentIsoDateTime());
            
            ObjectNode response = objectMapper.createObjectNode();
            response.put("action", "update_room");
            
            ObjectNode responseData = objectMapper.createObjectNode();
            responseData.put("id", roomId);
            responseData.put("status", (String) room.get("status"));
            responseData.put("updated_at", (String) room.get("updated_at"));
            
            response.set("data", responseData);
            return objectMapper.writeValueAsString(response);
        } catch (Exception e) {
            return createErrorResponse("Ошибка при обновлении комнаты: " + e.getMessage());
        }
    }
    
    // Получение списка всех гостей
    private String getGuests() {
        try {
            ObjectNode response = objectMapper.createObjectNode();
            response.put("action", "initial_data");
            
            ObjectNode dataNode = objectMapper.createObjectNode();
            dataNode.set("guests", objectMapper.valueToTree(guests.values()));
            
            response.set("data", dataNode);
            return objectMapper.writeValueAsString(response);
        } catch (Exception e) {
            return createErrorResponse("Ошибка при получении гостей: " + e.getMessage());
        }
    }
    
    // Добавление нового гостя
    private String addGuest(JsonNode data) {
        try {
            // Генерируем новый ID
            String guestId = UUID.randomUUID().toString().replace("-", "").substring(0, 9);
            
            Map<String, Object> newGuest = new HashMap<>();
            newGuest.put("id", guestId);
            newGuest.put("first_name", data.get("first_name").asText());
            newGuest.put("last_name", data.get("last_name").asText());
            newGuest.put("email", data.get("email").asText());
            newGuest.put("phone", data.get("phone").asText());
            newGuest.put("room_id", null);
            newGuest.put("check_in_date", null);
            newGuest.put("check_out_date", null);
            newGuest.put("created_at", getCurrentIsoDateTime());
            newGuest.put("updated_at", getCurrentIsoDateTime());
            
            // Сохраняем гостя
            guests.put(guestId, newGuest);
            
            ObjectNode response = objectMapper.createObjectNode();
            response.put("action", "add_guest");
            response.set("data", objectMapper.valueToTree(newGuest));
            
            return objectMapper.writeValueAsString(response);
        } catch (Exception e) {
            return createErrorResponse("Ошибка при добавлении гостя: " + e.getMessage());
        }
    }
    
    // Обновление информации о госте
    private String updateGuest(JsonNode data) {
        try {
            String guestId = data.get("id").asText();
            
            if (!guests.containsKey(guestId)) {
                return createErrorResponse("Гость с ID " + guestId + " не найден");
            }
            
            Map<String, Object> guest = guests.get(guestId);
            
            // Обновление полей гостя, если они указаны
            if (data.has("phone")) {
                guest.put("phone", data.get("phone").asText());
            }
            
            // Обработка заселения и выселения
            if (data.has("room_id")) {
                if (data.get("room_id").isNull()) {
                    // Выселение гостя
                    guest.put("room_id", null);
                    
                    if (data.has("check_out_date")) {
                        guest.put("check_out_date", data.get("check_out_date").asText());
                    } else {
                        guest.put("check_out_date", getCurrentIsoDateTime());
                    }
                } else {
                    // Заселение гостя
                    String roomId = data.get("room_id").asText();
                    
                    // Проверка существования комнаты
                    if (!rooms.containsKey(roomId)) {
                        return createErrorResponse("Комната с ID " + roomId + " не найдена");
                    }
                    
                    guest.put("room_id", roomId);
                    
                    if (data.has("check_in_date")) {
                        guest.put("check_in_date", data.get("check_in_date").asText());
                    } else {
                        guest.put("check_in_date", getCurrentIsoDateTime());
                    }
                    
                    // Обновляем статус комнаты
                    Map<String, Object> room = rooms.get(roomId);
                    room.put("status", "occupied");
                    room.put("updated_at", getCurrentIsoDateTime());
                    
                    // Добавляем гостя в список гостей комнаты
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> roomGuests = (List<Map<String, Object>>) room.getOrDefault("guests", new ArrayList<>());
                    
                    // Создаем краткую информацию о госте для комнаты
                    Map<String, Object> guestInfo = new HashMap<>();
                    guestInfo.put("id", guest.get("id"));
                    guestInfo.put("first_name", guest.get("first_name"));
                    guestInfo.put("last_name", guest.get("last_name"));
                    
                    roomGuests.add(guestInfo);
                    room.put("guests", roomGuests);
                    room.put("current_guests_count", roomGuests.size());
                }
            }
            
            guest.put("updated_at", getCurrentIsoDateTime());
            
            ObjectNode response = objectMapper.createObjectNode();
            response.put("action", "update_guest");
            response.set("data", objectMapper.valueToTree(guest));
            
            return objectMapper.writeValueAsString(response);
        } catch (Exception e) {
            return createErrorResponse("Ошибка при обновлении гостя: " + e.getMessage());
        }
    }
    
    // Удаление гостя
    private String deleteGuest(JsonNode data) {
        try {
            String guestId = data.get("id").asText();
            
            if (!guests.containsKey(guestId)) {
                return createErrorResponse("Гость с ID " + guestId + " не найден");
            }
            
            // Получаем информацию о госте перед удалением
            Map<String, Object> guest = guests.get(guestId);
            
            // Если гость был в комнате, обновляем информацию о комнате
            if (guest.get("room_id") != null) {
                String roomId = (String) guest.get("room_id");
                
                if (rooms.containsKey(roomId)) {
                    Map<String, Object> room = rooms.get(roomId);
                    
                    // Удаляем гостя из списка гостей комнаты
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> roomGuests = (List<Map<String, Object>>) room.get("guests");
                    roomGuests.removeIf(g -> g.get("id").equals(guestId));
                    
                    room.put("current_guests_count", roomGuests.size());
                    
                    // Если нет больше гостей, меняем статус комнаты
                    if (roomGuests.isEmpty()) {
                        room.put("status", "free");
                    }
                    
                    room.put("updated_at", getCurrentIsoDateTime());
                }
            }
            
            // Удаляем гостя
            guests.remove(guestId);
            
            ObjectNode response = objectMapper.createObjectNode();
            response.put("action", "delete_guest");
            
            ObjectNode responseData = objectMapper.createObjectNode();
            responseData.put("success", true);
            responseData.put("message", "Гость успешно удален");
            responseData.put("id", guestId);
            
            response.set("data", responseData);
            return objectMapper.writeValueAsString(response);
        } catch (Exception e) {
            return createErrorResponse("Ошибка при удалении гостя: " + e.getMessage());
        }
    }
    
    // Назначение нескольких гостей в одну комнату
    private String assignMultipleGuests(JsonNode data) {
        try {
            String roomId = data.get("room_id").asText();
            JsonNode guestIdsNode = data.get("guest_ids");
            String checkInDate = data.has("check_in_date") ? 
                data.get("check_in_date").asText() : getCurrentIsoDateTime();
            
            if (!rooms.containsKey(roomId)) {
                return createErrorResponse("Комната с ID " + roomId + " не найдена");
            }
            
            Map<String, Object> room = rooms.get(roomId);
            List<String> guestIds = new ArrayList<>();
            
            for (JsonNode guestIdNode : guestIdsNode) {
                guestIds.add(guestIdNode.asText());
            }
            
            // Проверяем существование всех гостей
            for (String guestId : guestIds) {
                if (!guests.containsKey(guestId)) {
                    return createErrorResponse("Гость с ID " + guestId + " не найден");
                }
            }
            
            // Обновляем информацию о комнате
            room.put("status", "occupied");
            
            // Очищаем текущий список гостей комнаты
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> roomGuests = new ArrayList<>();
            room.put("guests", roomGuests);
            
            // Обновляем информацию о гостях
            for (String guestId : guestIds) {
                Map<String, Object> guest = guests.get(guestId);
                
                // Обновляем информацию о госте
                guest.put("room_id", roomId);
                guest.put("check_in_date", checkInDate);
                guest.put("updated_at", getCurrentIsoDateTime());
                
                // Добавляем краткую информацию о госте в комнату
                Map<String, Object> guestInfo = new HashMap<>();
                guestInfo.put("id", guest.get("id"));
                guestInfo.put("first_name", guest.get("first_name"));
                guestInfo.put("last_name", guest.get("last_name"));
                
                roomGuests.add(guestInfo);
            }
            
            room.put("current_guests_count", roomGuests.size());
            room.put("updated_at", getCurrentIsoDateTime());
            
            // Формируем ответ
            ObjectNode response = objectMapper.createObjectNode();
            response.put("action", "assign_multiple_guests");
            
            ObjectNode responseData = objectMapper.createObjectNode();
            responseData.put("success", true);
            responseData.put("room_id", roomId);
            responseData.put("assigned_guests", guestIds.size());
            responseData.set("updated_room", objectMapper.valueToTree(room));
            
            response.set("data", responseData);
            return objectMapper.writeValueAsString(response);
        } catch (Exception e) {
            return createErrorResponse("Ошибка при назначении гостей: " + e.getMessage());
        }
    }
    
    // Добавление новой комнаты
    private String addRoom(JsonNode data) {
        try {
            // Генерируем новый ID
            String roomId = UUID.randomUUID().toString().replace("-", "").substring(0, 9);
            
            Map<String, Object> newRoom = new HashMap<>();
            newRoom.put("id", roomId);
            newRoom.put("room_number", data.get("room_number").asText());
            newRoom.put("room_type", data.get("room_type").asText());
            newRoom.put("status", data.get("status").asText());
            newRoom.put("price_per_night", data.get("price_per_night").asDouble());
            newRoom.put("created_at", getCurrentIsoDateTime());
            newRoom.put("updated_at", getCurrentIsoDateTime());
            newRoom.put("doorLocked", true);
            newRoom.put("max_guests", data.has("max_guests") ? data.get("max_guests").asInt() : 2);
            newRoom.put("current_guests_count", 0);
            
            // Добавляем пустой список гостей
            newRoom.put("guests", new ArrayList<>());
            
            // Добавляем данные с датчиков
            Map<String, Object> sensors = new HashMap<>();
            sensors.put("temperature", 22.0);
            sensors.put("humidity", 45);
            sensors.put("pressure", 1013);
            
            Map<String, Boolean> lights = new HashMap<>();
            lights.put("bathroom", false);
            lights.put("bedroom", false);
            lights.put("hallway", false);
            
            sensors.put("lights", lights);
            newRoom.put("sensors", sensors);
            
            // Сохраняем комнату
            rooms.put(roomId, newRoom);
            
            ObjectNode response = objectMapper.createObjectNode();
            response.put("action", "add_room");
            response.set("data", objectMapper.valueToTree(newRoom));
            
            return objectMapper.writeValueAsString(response);
        } catch (Exception e) {
            return createErrorResponse("Ошибка при добавлении комнаты: " + e.getMessage());
        }
    }
    
    // Удаление комнаты
    private String deleteRoom(JsonNode data) {
        try {
            String roomId = data.get("id").asText();
            
            if (!rooms.containsKey(roomId)) {
                return createErrorResponse("Комната с ID " + roomId + " не найдена");
            }
            
            // Получаем информацию о комнате перед удалением
            Map<String, Object> room = rooms.get(roomId);
            
            // Проверяем, нет ли в комнате гостей
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> roomGuests = (List<Map<String, Object>>) room.getOrDefault("guests", new ArrayList<>());
            
            if (!roomGuests.isEmpty()) {
                return createErrorResponse("Нельзя удалить комнату, в которой проживают гости");
            }
            
            // Удаляем комнату
            rooms.remove(roomId);
            
            // Формируем ответ
            ObjectNode response = objectMapper.createObjectNode();
            response.put("action", "delete_room");
            
            ObjectNode responseData = objectMapper.createObjectNode();
            responseData.put("success", true);
            responseData.put("message", "Комната успешно удалена");
            responseData.put("id", roomId);
            
            response.set("data", responseData);
            return objectMapper.writeValueAsString(response);
        } catch (Exception e) {
            return createErrorResponse("Ошибка при удалении комнаты: " + e.getMessage());
        }
    }
    
    // Вспомогательный метод для создания ответа с ошибкой
    private String createErrorResponse(String message) {
        try {
            ObjectNode response = objectMapper.createObjectNode();
            response.put("action", "error");
            
            ObjectNode data = objectMapper.createObjectNode();
            data.put("success", false);
            data.put("message", message);
            
            response.set("data", data);
            return objectMapper.writeValueAsString(response);
        } catch (Exception e) {
            return "{\"action\":\"error\",\"data\":{\"success\":false,\"message\":\"Ошибка создания ответа\"}}";
        }
    }
    
    // Получение текущей даты-времени в формате ISO
    private String getCurrentIsoDateTime() {
        return LocalDateTime.now().atOffset(ZoneOffset.UTC)
                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'"));
    }
    
    // Инициализация демонстрационных данных
    private void initDemoData() {
        // Создание нескольких комнат
        for (int i = 1; i <= 5; i++) {
            String roomId = "1000" + i;
            Map<String, Object> room = new HashMap<>();
            room.put("id", roomId);
            room.put("room_number", "10" + i);
            room.put("room_type", i <= 3 ? "standart" : (i == 4 ? "deluxe" : "suite"));
            room.put("status", "free");
            room.put("price_per_night", 100 * i);
            room.put("created_at", getCurrentIsoDateTime());
            room.put("updated_at", getCurrentIsoDateTime());
            room.put("doorLocked", true);
            room.put("max_guests", i == 5 ? 4 : (i >= 3 ? 3 : 2));
            room.put("current_guests_count", 0);
            
            // Добавляем пустой список гостей
            room.put("guests", new ArrayList<>());
            
            // Добавляем данные с датчиков
            Map<String, Object> sensors = new HashMap<>();
            sensors.put("temperature", 22.0 + i);
            sensors.put("humidity", 45 + i);
            sensors.put("pressure", 1013);
            
            Map<String, Boolean> lights = new HashMap<>();
            lights.put("bathroom", false);
            lights.put("bedroom", false);
            lights.put("hallway", false);
            
            sensors.put("lights", lights);
            room.put("sensors", sensors);
            
            rooms.put(roomId, room);
        }
    }
} 