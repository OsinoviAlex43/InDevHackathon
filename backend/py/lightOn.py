import asyncio
from bleak import BleakScanner, BleakClient
from controller_pb2 import IdentifyRequest, ControllerResponse, States, GetState

# По умолчанию
DEFAULT_DEVICE_NAME = "ROOM_35"
DEFAULT_TOKEN = "0jX7BvZ5450VqxVn"

async def _find_device(device_name: str) -> str | None:
    devices = await BleakScanner.discover()
    for dev in devices:
        if dev.name == device_name:
            return dev.address
    return None

async def _send_command(address: str, token: str, char_uuid: str, message_bytes: bytes) -> str:
    async with BleakClient(address) as client:
        if not client.is_connected:
            raise RuntimeError("Не удалось подключиться к устройству")
        # Авторизация
        identify = IdentifyRequest(Token=token)
        await client.write_gatt_char("0000ff02-0000-1000-8000-00805f9b34fb", identify.SerializeToString())
        # Подписка на уведомления
        events: list[str] = []
        def callback(_, data: bytes):
            events.append(data.hex())
        await client.start_notify("0000ff01-0000-1000-8000-00805f9b34fb", callback)
        # Отправка команды
        await client.write_gatt_char(char_uuid, message_bytes)
        await asyncio.sleep(1)
        await client.stop_notify("0000ff01-0000-1000-8000-00805f9b34fb")
        return events[-1] if events else ""

async def _send_state(device_name: str, token: str, state_value: int) -> str:
    address = await _find_device(device_name)
    if not address:
        raise RuntimeError(f"Устройство {device_name} не найдено")
    # Формирование Raw сообщения: префикс 0x08 + state
    raw = b"\x08" + state_value.to_bytes(1, 'little')
    return await _send_command(address, token, "0000ff01-0000-1000-8000-00805f9b34fb", raw)

async def open_door_async(device_name: str = DEFAULT_DEVICE_NAME, token: str = DEFAULT_TOKEN) -> str:
    # States.DoorLockOpen
    return await _send_state(device_name, token, States.DoorLockOpen)

async def close_door_async(device_name: str = DEFAULT_DEVICE_NAME, token: str = DEFAULT_TOKEN) -> str:
    return await _send_state(device_name, token, States.DoorLockClose)

async def light_on_async(device_name: str = DEFAULT_DEVICE_NAME, token: str = DEFAULT_TOKEN) -> str:
    return await _send_state(device_name, token, States.LightOn)

async def light_off_async(device_name: str = DEFAULT_DEVICE_NAME, token: str = DEFAULT_TOKEN) -> str:
    return await _send_state(device_name, token, States.LightOff)

# Синхронные обертки

def open_door(device_name: str = DEFAULT_DEVICE_NAME, token: str = DEFAULT_TOKEN) -> str:
    return asyncio.run(open_door_async(device_name, token))

def close_door(device_name: str = DEFAULT_DEVICE_NAME, token: str = DEFAULT_TOKEN) -> str:
    return asyncio.run(close_door_async(device_name, token))

def light_on(device_name: str = DEFAULT_DEVICE_NAME, token: str = DEFAULT_TOKEN) -> str:
    return asyncio.run(light_on_async(device_name, token))

def light_off(device_name: str = DEFAULT_DEVICE_NAME, token: str = DEFAULT_TOKEN) -> str:
    return asyncio.run(light_off_async(device_name, token))