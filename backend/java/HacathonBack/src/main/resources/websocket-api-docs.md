# WebSocket API для системы управления отелем

Документация описывает доступные WebSocket эндпоинты и соответствующие им сообщения для взаимодействия с бэкендом системы управления отелем.

## Подключение к WebSocket

### Основные эндпоинты для подключения

- **Основной эндпоинт**: `/ws`
- **Эндпоинт для гостей**: `/guest-ws`

### Подключение с использованием SockJS

```javascript
// Пример подключения с использованием SockJS и STOMP
var socket = new SockJS('/ws');
var stompClient = Stomp.over(socket);

stompClient.connect({}, function(frame) {
  console.log('Подключено: ' + frame);
  
  // Подписка на канал
  stompClient.subscribe('/topic/rooms', function(response) {
    var rooms = JSON.parse(response.body);
    console.log('Получены комнаты:', rooms);
  });
});
```

## Общие маршруты для работы с отелем

### Получение списка всех комнат

- **Маршрут отправки**: `/app/rooms`
- **Маршрут подписки**: `/topic/rooms`
- **Параметры**: нет
- **Возвращает**: Список всех комнат отеля

```javascript
// Пример отправки запроса
stompClient.send("/app/rooms", {}, {});

// Пример обработки ответа при подписке
stompClient.subscribe('/topic/rooms', function(response) {
  var rooms = JSON.parse(response.body);
  console.log(rooms);
});
```

### Получение списка доступных комнат

- **Маршрут отправки**: `/app/rooms/available`
- **Маршрут подписки**: `/topic/rooms/available`
- **Параметры**: нет
- **Возвращает**: Список свободных комнат

### Получение списка занятых комнат

- **Маршрут отправки**: `/app/rooms/occupied`
- **Маршрут подписки**: `/topic/rooms/occupied`
- **Параметры**: нет
- **Возвращает**: Список занятых комнат

### Получение списка всех гостей

- **Маршрут отправки**: `/app/guests`
- **Маршрут подписки**: `/topic/guests`
- **Параметры**: нет
- **Возвращает**: Список всех гостей отеля

### Получение статистики отеля

- **Маршрут отправки**: `/app/stats`
- **Маршрут подписки**: `/topic/stats`
- **Параметры**: нет
- **Возвращает**: Статистику отеля

Пример ответа:
```json
{
  "totalGuests": 5,
  "totalRooms": 10,
  "availableRooms": 5,
  "occupiedRooms": 4,
  "maintenanceRooms": 1,
  "occupancyRate": 40.0
}
```

## Маршруты для работы с комнатами (RoomControllerWS)

### Изменение статуса комнаты

- **Маршрут отправки**: `/app/room/update-status`
- **Маршрут подписки для общих обновлений**: `/topic/room-updated`
- **Маршрут подписки для результата операции**: `/user/queue/room-update-result`
- **Параметры**:
  - `roomId`: ID комнаты
  - `status`: Новый статус комнаты ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE')
  - `requesterId`: ID запрашивающего пользователя (для получения персонального ответа)

```javascript
stompClient.send("/app/room/update-status", {}, JSON.stringify({
  roomId: 1,
  status: "MAINTENANCE",
  requesterId: "user123"
}));
```

### Изменение цены комнаты

- **Маршрут отправки**: `/app/room/update-price`
- **Маршрут подписки для общих обновлений**: `/topic/room-price-updated`
- **Маршрут подписки для результата операции**: `/user/queue/room-update-result`
- **Параметры**:
  - `roomId`: ID комнаты
  - `price`: Новая цена
  - `requesterId`: ID запрашивающего пользователя

### Получение комнат по типу

- **Маршрут отправки**: `/app/rooms/by-type`
- **Маршрут подписки**: `/user/queue/rooms-by-type`
- **Параметры**:
  - `type`: Тип комнаты ('STANDARD', 'DELUXE', 'SUITE')
  - `requesterId`: ID запрашивающего пользователя

### Получение комнат по ценовому диапазону

- **Маршрут отправки**: `/app/rooms/by-price-range`
- **Маршрут подписки**: `/user/queue/rooms-by-price`
- **Параметры**:
  - `minPrice`: Минимальная цена
  - `maxPrice`: Максимальная цена
  - `requesterId`: ID запрашивающего пользователя

## Маршруты для работы с гостями (GuestControllerWS)

### Заселение нового гостя

- **Маршрут отправки**: `/app/guest/check-in`
- **Маршрут подписки для общих обновлений**: `/topic/guest-checked-in`
- **Маршрут подписки для результата операции**: `/user/queue/check-in-result`
- **Параметры**:
  - `firstName`: Имя гостя
  - `lastName`: Фамилия гостя
  - `email`: Email гостя
  - `phone`: Телефон гостя
  - `roomNumber`: Номер комнаты
  - `checkOutDate`: Дата выезда (опционально, формат 'YYYY-MM-DD')
  - `requesterId`: ID запрашивающего пользователя

```javascript
stompClient.send("/app/guest/check-in", {}, JSON.stringify({
  firstName: "Иван",
  lastName: "Иванов",
  email: "ivan@example.com",
  phone: "+79991234567",
  roomNumber: "101",
  checkOutDate: "2023-06-15",
  requesterId: "admin1"
}));
```

### Выселение гостя

- **Маршрут отправки**: `/app/guest/check-out`
- **Маршрут подписки для общих обновлений**: `/topic/guest-checked-out`
- **Маршрут подписки для результата операции**: `/user/queue/check-out-result`
- **Параметры**:
  - `guestId`: ID гостя
  - `requesterId`: ID запрашивающего пользователя

### Получение гостей по комнате

- **Маршрут отправки**: `/app/guests/by-room`
- **Маршрут подписки**: `/user/queue/guests-by-room`
- **Параметры**:
  - `roomNumber`: Номер комнаты
  - `requesterId`: ID запрашивающего пользователя

### Продление проживания гостя

- **Маршрут отправки**: `/app/guest/extend-stay`
- **Маршрут подписки для общих обновлений**: `/topic/guest-stay-extended`
- **Маршрут подписки для результата операции**: `/user/queue/extend-stay-result`
- **Параметры**:
  - `guestId`: ID гостя
  - `newCheckOutDate`: Новая дата выезда (формат 'YYYY-MM-DD')
  - `requesterId`: ID запрашивающего пользователя

## Примеры дополнительных запросов

### Получение гостя по ID

- **Маршрут отправки**: `/app/guest`
- **Маршрут подписки**: `/user/queue/guest`
- **Параметры**:
  - `id`: ID гостя
  - `requesterId`: ID запрашивающего пользователя

### Поиск комнаты по номеру

- **Маршрут отправки**: `/app/room/search`
- **Маршрут подписки**: `/user/queue/room`
- **Параметры**:
  - `roomNumber`: Номер комнаты
  - `requesterId`: ID запрашивающего пользователя

### Поиск гостей по фамилии

- **Маршрут отправки**: `/app/guests/search`
- **Маршрут подписки**: `/user/queue/guests`
- **Параметры**:
  - `lastName`: Фамилия для поиска
  - `requesterId`: ID запрашивающего пользователя

### Получение гостей, заселенных сегодня

- **Маршрут отправки**: `/app/guests/today`
- **Маршрут подписки**: `/topic/guests/today`
- **Параметры**: нет
- **Возвращает**: Информацию о гостях, заселенных сегодня

## Обработка ошибок

При возникновении ошибок сервер отправит сообщение с информацией об ошибке в соответствующий канал ответа. Общий формат ответа с ошибкой:

```json
{
  "success": false,
  "message": "Описание ошибки"
}
```

## Инструкция по использованию в клиентском приложении

1. Подключитесь к WebSocket серверу
2. Подпишитесь на нужные каналы сообщений
3. Отправляйте запросы в соответствующие маршруты
4. Обрабатывайте полученные ответы

```javascript
// Пример полного цикла работы с WebSocket API

// Подключение
var socket = new SockJS('/ws');
var stompClient = Stomp.over(socket);
var userId = "user_" + Math.floor(Math.random() * 1000);

stompClient.connect({}, function(frame) {
  console.log('Подключено: ' + frame);
  
  // Подписка на общие обновления
  stompClient.subscribe('/topic/rooms', function(response) {
    console.log('Получены все комнаты:', JSON.parse(response.body));
  });
  
  // Подписка на персональные ответы
  stompClient.subscribe('/user/queue/room', function(response) {
    console.log('Получена информация о комнате:', JSON.parse(response.body));
  });
  
  // Подписка на обработку ошибок
  stompClient.subscribe('/user/queue/error', function(response) {
    console.error('Ошибка:', JSON.parse(response.body));
  });
  
  // Отправка запроса на получение всех комнат
  stompClient.send("/app/rooms", {}, {});
  
  // Отправка запроса на поиск комнаты по номеру
  stompClient.send("/app/room/search", {}, JSON.stringify({
    roomNumber: "101",
    requesterId: userId
  }));
});
``` 