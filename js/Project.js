document.addEventListener("DOMContentLoaded", function () {
    console.log("Project.js Loaded!");
    const openModalBtn = document.getElementById("addProject");
    const modalOverlay = document.getElementById("modalOverlay");
    const closeModalBtn = document.getElementById("closeModelBtn");
    const createProjectBtn = document.getElementById("createProjectBtn");
    const cover = document.getElementById("BCover");

    // Open Modal
    openModalBtn.addEventListener("click", function () {
        modalOverlay.classList.remove("hidden");
        cover.classList.add("cover");
    });

    // Close Modal
    closeModalBtn.addEventListener("click", function () {
        cover.classList.remove("cover");
        modalOverlay.classList.add("hidden");
    });

    // Handle "Create New Project"
    createProjectBtn.addEventListener("click", function () {
        alert("New Project Created!");
        cover.classList.remove("cover");
        modalOverlay.classList.add("hidden");
    });
});

function addMember() {
    var dropdown = document.getElementById("projectDropDown");
    var selectedValue = dropdown.value;
    var selectedText = dropdown.options[dropdown.selectedIndex].text;

    if (selectedValue) {

        var list = document.getElementById("memberList");

        // Check if the member is already in the list
        var existingItems = list.getElementsByTagName("li");
        for (var i = 0; i < existingItems.length; i++) {
            if (existingItems[i].getAttribute("data-value") === selectedValue) {
                alert("Member is already added!");
                return;
            }
        }

        // Create a new list item
        var listItem = document.createElement("li");
        listItem.setAttribute("data-value", selectedValue);
        listItem.textContent = selectedText;

        // Create a hidden input field to submit the value
        var hiddenInput = document.createElement("input");
        hiddenInput.type = "hidden";
        hiddenInput.name = "members[]"; // Allow multiple selections
        hiddenInput.value = selectedValue;
        listItem.appendChild(hiddenInput);

        // Add a remove button
        var removeButton = document.createElement("button");
        removeButton.textContent = "Remove";
        removeButton.onclick = function () {
            list.removeChild(listItem);
        };

        listItem.appendChild(removeButton);
        list.appendChild(listItem);
    } else {
        alert("Please select a member first!");
    }
}
