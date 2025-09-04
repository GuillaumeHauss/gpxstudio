function customAlert(message) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'custom-modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'custom-modal';

        modal.innerHTML = `
            <div class="custom-modal-header">Alert</div>
            <div class="custom-modal-body">${message}</div>
            <div class="custom-modal-footer">
                <button class="custom-modal-button primary">OK</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        modal.querySelector('.primary').addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve();
        });
    });
}

function customConfirm(message) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'custom-modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'custom-modal';

        modal.innerHTML = `
            <div class="custom-modal-header">Confirmation</div>
            <div class="custom-modal-body">${message}</div>
            <div class="custom-modal-footer">
                <button class="custom-modal-button secondary">Cancel</button>
                <button class="custom-modal-button primary">OK</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        modal.querySelector('.primary').addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(true);
        });

        modal.querySelector('.secondary').addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(false);
        });
    });
}

function customPrompt(message, defaultValue = '') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'custom-modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'custom-modal';

        modal.innerHTML = `
            <div class="custom-modal-header">Prompt</div>
            <div class="custom-modal-body">
                ${message}
                <input type="text" class="custom-modal-input" value="${defaultValue}">
            </div>
            <div class="custom-modal-footer">
                <button class="custom-modal-button secondary">Cancel</button>
                <button class="custom-modal-button primary">OK</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const input = modal.querySelector('.custom-modal-input');
        input.focus();

        modal.querySelector('.primary').addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(input.value);
        });

        modal.querySelector('.secondary').addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(null);
        });
    });
}
