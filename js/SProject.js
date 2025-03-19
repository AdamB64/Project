function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


document.addEventListener("DOMContentLoaded", function () {
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
  createProjectBtn.addEventListener("click", async function () {
    // Collect all required fields
    const projectName = document.getElementById("projectName").value.trim();
    const projectDescription = document.getElementById("projectDescription").value.trim();
    const projectStartDate = document.getElementById("projectStartDate").value.trim();
    const projectDeadline = document.getElementById("projectDeadline").value.trim();
    const projectDropDown = document.getElementById("projectDropDown");

    // Convert to Date objects
    const startDate = new Date(projectStartDate);
    const deadlineDate = new Date(projectDeadline);

    if (!projectName || !projectDescription || !projectStartDate || !projectDeadline || projectDropDown.selectedIndex === 0) {
      alert("Please fill in all fields and select a project member.");
      return;
    } else if (startDate > deadlineDate) {
    } else {
      cover.classList.remove("cover");
      modalOverlay.classList.add("hidden");
      await wait(3000);
      window.location.reload();
    }
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
    hiddenInput.name = "members"; // Allow multiple selections
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

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("projectForm").addEventListener("submit", function (event) {
    const projectStartDate = document.getElementById("projectStartDate").value.trim();
    const projectDeadline = document.getElementById("projectDeadline").value.trim();
    // Convert to Date objects
    const startDate = new Date(projectStartDate);
    const deadlineDate = new Date(projectDeadline);
    if (startDate > deadlineDate) {
      alert("The project start date must be before the project deadline.");
    } else {

      event.preventDefault();

      const formData = new FormData(this);

      // Debugging: Check form fields before adding custom data
      let project = {};
      let mem = [];
      for (let [key, value] of formData.entries()) {
        if (key === "members") {
          mem.push(value);
        } else {
          project[key] = value;
        }
      }
      project["members"] = mem;
      //console.log(project);

      jsonData = JSON.stringify(project);
      //console.log(jsonData);

      fetch("/addProject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: jsonData,
      })
        .then(response => {
          console.log(response);
          alert("Project created successfully!");
          window.location.reload();
        })
        .catch(error => {
          console.error("Error:", error);
          alert("Failed to create project.");
        });
    }
  });
});
