import socket
import controller_pb2
import tkinter as tk
from tkinter import messagebox

# Настройки подключения
IP = "192.168.1.100"
PORT = 7000

def get_info():
    # Создаем сообщение
    msg = controller_pb2.ClientMessage()
    msg.get_info.CopyFrom(controller_pb2.GetInfo())
    data = msg.SerializeToString()

    try:
        # Подключаемся к контроллеру
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.connect((IP, PORT))
            sock.sendall(data)
            response_data = sock.recv(1024)

        # Разбираем ответ
        response = controller_pb2.ControllerResponse()
        response.ParseFromString(response_data)

        if response.HasField("info"):
            info = response.info
            message = (
                f"Информация о контроллере:\n"
                f"IP: {info.ip}\n"
                f"MAC: {info.mac}\n"
                f"BLE Name: {info.ble_name}\n"
                f"Token: {info.token}"
            )
            messagebox.showinfo("Информация", message)
        else:
            messagebox.showerror("Ошибка", "Контроллер не вернул информацию.")
    except Exception as e:
        messagebox.showerror("Ошибка подключения", str(e))

# GUI
window = tk.Tk()
window.title("Управление контроллером")
window.geometry("300x200")
window.resizable(False, False)

info_button = tk.Button(window, text="Получить инфо", font=("Arial", 14), command=get_info)
info_button.pack(pady=10)

window.mainloop()