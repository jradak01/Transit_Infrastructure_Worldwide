function createDynamicModal(modalText, targetDivId) {
    // Find the target div
    const targetDiv = document.getElementById(targetDivId);

    if (!targetDiv) {
        console.error(`Div with id ${targetDivId} not found.`);
        return;
    }

    // Ensure the target div is positioned relatively
    targetDiv.style.position = 'relative';

    // Create the button
    const button = document.createElement('button');
    button.className = 'btn-info';
    button.style.position = 'absolute';
    button.style.top = '3px';
    button.style.right = '3px';
    button.innerText = '?';
    button.addEventListener('click', function () {
        modal.style.display = 'block';
    });

    // Create the modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'none';

    // Create modal content container
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    // Create close button
    const closeButton = document.createElement('span');
    closeButton.className = 'close';
    closeButton.innerHTML = '&times;';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '0px';
    closeButton.style.right = '10px';
    closeButton.addEventListener('click', function () {
        modal.style.display = 'none';
    });

    // Create text element with formatted content
    const text = document.createElement('div');
    text.className = 'modal-text';
    text.innerHTML = modalText
        .replace(/\n/g, "<br>") // Replace newline characters with <br> tags
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Wrap **text** in <strong> tags for bold formatting

    // Append elements
    modalContent.appendChild(closeButton);
    modalContent.appendChild(text);
    modal.appendChild(modalContent);
    targetDiv.appendChild(button);
    targetDiv.appendChild(modal);

    // Close modal when clicking outside of it
    window.addEventListener('click', function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });
}
