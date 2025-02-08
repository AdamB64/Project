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
