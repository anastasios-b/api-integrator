// Modal state
let modalState = {
    isOpen: false
};

/**
 * Set the content of the modal body
 * @param {string|HTMLElement} content - The content to display in the modal
 */
function setModalContent(content) {
    const modalBody = document.getElementById('modal-body');
    if (!modalBody) return;
    
    if (typeof content === 'string') {
        modalBody.innerHTML = content;
    } else if (content instanceof HTMLElement) {
        modalBody.innerHTML = '';
        modalBody.appendChild(content);
    }
}

/**
 * Open the modal
 * @param {string|HTMLElement} content - Optional content to display in the modal
 */
function openModal(content) {
    const modal = document.getElementById('modal');
    if (!modal) return;
    
    if (content) {
        setModalContent(content);
    }
    
    modal.style.display = 'block';
    modalState.isOpen = true;
}

/**
 * Close the modal
 */
function closeModal() {
    const modal = document.getElementById('modal');
    if (!modal) return;
    
    modal.style.display = 'none';
    modalState.isOpen = false;
}

/**
 * Check if the modal is currently open
 * @returns {boolean} True if modal is open, false otherwise
 */
function isModalOpen() {
    return modalState.isOpen;
}

document.addEventListener('DOMContentLoaded', function() {
    
    // Set up modal close button functionality
    const modalCloseBtn = document.getElementById('modal-close');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeModal);
    }
    
    // Set up modal close when clicking outside the modal content
    const modal = document.getElementById('modal');
    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeModal();
            }
        });
    }
    
});