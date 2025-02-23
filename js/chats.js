document.addEventListener('DOMContentLoaded', function () {


    document.getElementById('make-button').addEventListener('click', function () {
        const name = document.getElementById('chatName').value;
        const hidden = document.getElementById('membersList').value;
        console.log(name + hidden);
        if (!name || !hidden) {
            alert('Please fill out all fields!');
            return;
        }
        const form = document.getElementById('form');
        form.submit();
        //window.location.reload();
    });

});

function makeGroup() {
    const cover = document.getElementById('cover');
    cover.style.display = 'flex';
}


function addMem() {
    const m = document.getElementById('members');
    const Hmem = m.value;  // Hidden member ID
    const mem = m.options[m.selectedIndex].text; // Display text

    if (!Hmem) {
        alert('Please select a member first!');
        return;
    }
    if (document.querySelector(`#mem-list li[data-id="${Hmem}"]`)) {
        alert('Member is already added!');
        return;
    }

    // Append the member ID to the hidden input (comma-separated)
    const hidden = document.getElementById('membersList');
    hidden.value += Hmem + ',';

    // Append a new list item that wraps the member text and its Remove button.
    // The member ID is passed as a string.
    const memList = document.getElementById('mem-list');
    memList.innerHTML += `<li data-id="${Hmem}">${mem} <button class="button" type="button" onclick="removeMem(this, '${Hmem}')">Remove</button></li>`;

    // Reset the select element.
    m.value = '';
}

function removeMem(buttonElem, h) {
    // Remove the hidden member ID from the hidden input.
    const hidden = document.getElementById('membersList');
    hidden.value = hidden.value.replace(h + ',', '');

    // Remove the entire list item containing the member and button.
    buttonElem.parentElement.remove();
}

function closeCover() {
    console.log('close');
    const cover = document.getElementById('cover');
    cover.style.display = 'none';
}