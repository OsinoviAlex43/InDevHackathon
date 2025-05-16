# This is a sample Python script.

# Press Shift+F10 to execute it or replace it with your code.
# Press Double Shift to search everywhere for classes, files, tool windows, actions, and settings.


def print_hi(name):
    # Use a breakpoint in the code line below to debug your script.
    print(f'Hi, {name}')  # Press Ctrl+F8 to toggle the breakpoint.


# Press the green button in the gutter to run the script.
if __name__ == '__main__':
    import socket
    import controller_pb2
    import tkinter as tk
    from tkinter import messagebox

    # Настройки подключения
    IP = "192.168.1.100"
    PORT = 7000


    def send_command(state_enum):
        # Создаем сообщение
        msg = controller_pb2.ClientMessage()
        msg.set_state.state = state_enum
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

            if response.HasField("status") and response.status == controller_pb2.Ok:
                messagebox.showinfo("Успех", "Операция выполнена успешно!")
            else:
                messagebox.showerror("Ошибка", "Контроллер вернул ошибку.")
        except Exception as e:
            messagebox.showerror("Ошибка подключения", str(e))


    # --- GUI ---
    window = tk.Tk()
    window.title("Управление дверью")
    window.geometry("300x150")
    window.resizable(False, False)

    open_button = tk.Button(window, text="Открыть дверь", font=("Arial", 14),
                            command=lambda: send_command(controller_pb2.LightOn))
    open_button.pack(pady=10)

    close_button = tk.Button(window, text="Закрыть дверь", font=("Arial", 14),
                             command=lambda: send_command(controller_pb2.LightOff))
    close_button.pack(pady=10)

    window.mainloop()
