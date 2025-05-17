import { makeAutoObservable } from 'mobx';

/**
 * UIStore handles UI-specific state throughout the application
 * Such as modals, alerts, and other UI elements that don't directly correspond to domain data
 */
class UIStore {
  // Alert states
  alertOpen = false;
  alertMessage = '';
  alertType: 'success' | 'error' | 'info' | 'warning' = 'info';
  
  // Page transitions
  pageTransitionDuration = 200; // milliseconds
  
  // General loading states
  isSubmitting = false;
  
  constructor() {
    makeAutoObservable(this);
  }
  
  // Alert methods
  showAlert(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
    this.alertMessage = message;
    this.alertType = type;
    this.alertOpen = true;
  }
  
  hideAlert() {
    this.alertOpen = false;
  }
  
  // Loading state methods
  setSubmitting(value: boolean) {
    this.isSubmitting = value;
  }
  
  // Page transition methods
  setPageTransitionDuration(duration: number) {
    this.pageTransitionDuration = duration;
  }
}

export default new UIStore(); 