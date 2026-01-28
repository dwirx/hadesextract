/**
 * ============================================
 * Text Extractor Pro - Notification System
 * Toast notifications with queue management
 * ============================================
 */

import { CSS_CLASSES, Z_INDEX, UI, COLORS } from './constants.js';
import { createElement } from './dom-utils.js';

/**
 * Notification types
 */
export const NotificationType = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning'
};

/**
 * Notification manager class
 */
class NotificationManager {
  constructor() {
    this.queue = [];
    this.activeNotifications = new Set();
    this.maxActive = 3;
  }
  
  /**
   * Shows a notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type
   * @param {number} duration - Duration in ms (0 = permanent)
   * @returns {string} Notification ID
   */
  show(message, type = NotificationType.INFO, duration = UI.NOTIFICATION_DURATION) {
    const notification = {
      id: `notification-${Date.now()}-${Math.random()}`,
      message,
      type,
      duration,
      timestamp: Date.now()
    };
    
    if (this.activeNotifications.size >= this.maxActive) {
      this.queue.push(notification);
    } else {
      this.display(notification);
    }
    
    return notification.id;
  }
  
  /**
   * Displays a notification
   * @param {Object} notification - Notification object
   */
  display(notification) {
    this.activeNotifications.add(notification.id);
    
    const element = this.createNotificationElement(notification);
    document.body.appendChild(element);
    
    // Animate in
    requestAnimationFrame(() => {
      element.classList.add('show');
    });
    
    // Auto-dismiss if duration is set
    if (notification.duration > 0) {
      setTimeout(() => {
        this.dismiss(notification.id);
      }, notification.duration);
    }
  }
  
  /**
   * Creates notification DOM element
   * @param {Object} notification - Notification object
   * @returns {HTMLElement} Notification element
   */
  createNotificationElement(notification) {
    const colors = {
      [NotificationType.SUCCESS]: COLORS.SUCCESS,
      [NotificationType.ERROR]: COLORS.ERROR,
      [NotificationType.INFO]: COLORS.INFO,
      [NotificationType.WARNING]: COLORS.WARNING
    };
    
    const icons = {
      [NotificationType.SUCCESS]: '✓',
      [NotificationType.ERROR]: '✕',
      [NotificationType.INFO]: 'ℹ',
      [NotificationType.WARNING]: '⚠'
    };
    
    const color = colors[notification.type] || colors[NotificationType.INFO];
    const icon = icons[notification.type] || icons[NotificationType.INFO];
    
    const container = createElement('div', {
      id: notification.id,
      className: `${CSS_CLASSES.NOTIFICATION} notification-${notification.type}`,
      style: {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        background: color,
        color: 'white',
        padding: '16px 24px',
        borderRadius: '12px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
        zIndex: Z_INDEX.NOTIFICATION,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        maxWidth: '400px',
        opacity: '0',
        transform: 'translateX(100%)',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
      }
    });
    
    // Icon
    const iconEl = createElement('span', {
      style: {
        fontSize: '18px',
        flexShrink: '0'
      }
    }, icon);
    
    // Message
    const messageEl = createElement('span', {
      style: {
        flex: '1'
      }
    }, notification.message);
    
    // Close button
    const closeBtn = createElement('button', {
      className: 'notification-close',
      style: {
        background: 'transparent',
        border: 'none',
        color: 'white',
        fontSize: '18px',
        cursor: 'pointer',
        padding: '0',
        marginLeft: '8px',
        opacity: '0.7',
        transition: 'opacity 0.2s'
      },
      onClick: () => this.dismiss(notification.id)
    }, '×');
    
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.opacity = '1';
    });
    
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.opacity = '0.7';
    });
    
    container.appendChild(iconEl);
    container.appendChild(messageEl);
    container.appendChild(closeBtn);
    
    // Click to dismiss
    container.addEventListener('click', (e) => {
      if (e.target !== closeBtn) {
        this.dismiss(notification.id);
      }
    });
    
    return container;
  }
  
  /**
   * Dismisses a notification
   * @param {string} id - Notification ID
   */
  dismiss(id) {
    const element = document.getElementById(id);
    if (!element) return;
    
    // Animate out
    element.style.opacity = '0';
    element.style.transform = 'translateX(100%)';
    
    setTimeout(() => {
      element.remove();
      this.activeNotifications.delete(id);
      
      // Show next in queue
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        this.display(next);
      }
    }, 300);
  }
  
  /**
   * Dismisses all notifications
   */
  dismissAll() {
    this.activeNotifications.forEach(id => this.dismiss(id));
    this.queue = [];
  }
  
  /**
   * Shows success notification
   * @param {string} message - Message
   * @param {number} duration - Duration
   * @returns {string} Notification ID
   */
  success(message, duration) {
    return this.show(message, NotificationType.SUCCESS, duration);
  }
  
  /**
   * Shows error notification
   * @param {string} message - Message
   * @param {number} duration - Duration (0 = permanent)
   * @returns {string} Notification ID
   */
  error(message, duration = 0) {
    return this.show(message, NotificationType.ERROR, duration);
  }
  
  /**
   * Shows info notification
   * @param {string} message - Message
   * @param {number} duration - Duration
   * @returns {string} Notification ID
   */
  info(message, duration) {
    return this.show(message, NotificationType.INFO, duration);
  }
  
  /**
   * Shows warning notification
   * @param {string} message - Message
   * @param {number} duration - Duration
   * @returns {string} Notification ID
   */
  warning(message, duration) {
    return this.show(message, NotificationType.WARNING, duration);
  }
}

// Create singleton instance
const notificationManager = new NotificationManager();

// Add CSS for show animation
const style = document.createElement('style');
style.textContent = `
  .${CSS_CLASSES.NOTIFICATION}.show {
    opacity: 1 !important;
    transform: translateX(0) !important;
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

if (document.head) {
  document.head.appendChild(style);
} else {
  document.addEventListener('DOMContentLoaded', () => {
    document.head.appendChild(style);
  });
}

// Export singleton instance
export default notificationManager;

// Export convenience functions
export const showNotification = (message, type, duration) => 
  notificationManager.show(message, type, duration);

export const showSuccess = (message, duration) => 
  notificationManager.success(message, duration);

export const showError = (message, duration) => 
  notificationManager.error(message, duration);

export const showInfo = (message, duration) => 
  notificationManager.info(message, duration);

export const showWarning = (message, duration) => 
  notificationManager.warning(message, duration);

export const dismissNotification = (id) => 
  notificationManager.dismiss(id);

export const dismissAllNotifications = () => 
  notificationManager.dismissAll();

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.notificationManager = notificationManager;
  window.showNotification = showNotification;
  window.showSuccess = showSuccess;
  window.showError = showError;
  window.showInfo = showInfo;
  window.showWarning = showWarning;
}
