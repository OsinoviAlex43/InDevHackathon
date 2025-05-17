import { makeAutoObservable } from 'mobx';
import RoomStore from './RoomStore';
import UIStore from './UIStore';
import GuestStoreInstance from './GuestStore';

// Create a mock GuestStore with required dashboard properties
class GuestStore {
  guests: any[] = [];
  currentGuests: number = 12; // Mock data
  todayArrivals: number = 5;  // Mock data
  todayDepartures: number = 3; // Mock data
  upcomingGuests: number = 8; // Mock data
  
  constructor() {
    makeAutoObservable(this);
  }
}

// Store for application settings like theme, sidebar state, etc.
class SettingsStore {
  darkMode = localStorage.getItem('darkMode') === 'true' ? true : false;
  sidebarOpen = localStorage.getItem('sidebarOpen') === 'false' ? false : true;
  language = localStorage.getItem('language') || 'en';
  fontSize = parseInt(localStorage.getItem('fontSize') || '14');
  autoSave = localStorage.getItem('autoSave') === 'false' ? false : true;
  notificationsEnabled = localStorage.getItem('notificationsEnabled') === 'false' ? false : true;
  
  constructor() {
    makeAutoObservable(this);
    
    // Apply dark mode on initialization if enabled
    if (this.darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }
  
  toggleDarkMode = () => {
    this.darkMode = !this.darkMode;
    localStorage.setItem('darkMode', this.darkMode.toString());
    
    if (this.darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }
  
  toggleSidebar = () => {
    this.sidebarOpen = !this.sidebarOpen;
    localStorage.setItem('sidebarOpen', this.sidebarOpen.toString());
  }
  
  setLanguage = (lang: string) => {
    this.language = lang;
    localStorage.setItem('language', lang);
  }
  
  setFontSize = (size: number) => {
    this.fontSize = size;
    localStorage.setItem('fontSize', size.toString());
    document.documentElement.style.setProperty('--base-font-size', `${size}px`);
  }
  
  toggleAutoSave = () => {
    this.autoSave = !this.autoSave;
    localStorage.setItem('autoSave', this.autoSave.toString());
  }
  
  toggleNotifications = () => {
    this.notificationsEnabled = !this.notificationsEnabled;
    localStorage.setItem('notificationsEnabled', this.notificationsEnabled.toString());
  }
}

// Root store that combines all stores
class RootStore {
  roomStore = RoomStore;
  uiStore = UIStore;
  guestStore = GuestStoreInstance;
  settingsStore = new SettingsStore();
  
  constructor() {
    // Инициализируем соединение с API вместо использования моков
    this.initializeAPIData();
  }
  
  initializeAPIData() {
    // Инициализируем соединение с сервером и получаем реальные данные
    if (this.roomStore.initializeAPI) {
      this.roomStore.initializeAPI();
    }
    
    // Инициализируем соединение с сервером для гостей
    if ((this.guestStore as any).initializeAPI) {
      (this.guestStore as any).initializeAPI();
    }
  }
}

export default new RootStore(); 