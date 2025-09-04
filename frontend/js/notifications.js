function showNotification(message, type = 'info') {
    const notificationArea = document.getElementById('notification-area');
    if (!notificationArea) {
        console.error('Notification area not found!');
        return;
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    notificationArea.appendChild(notification);

    // Trigger fade in animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Remove the notification after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        // Remove the element from the DOM after the fade out transition
        notification.addEventListener('transitionend', () => {
            notification.remove();
        });
    }, 5000);
}
