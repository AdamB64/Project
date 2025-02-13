document.addEventListener("DOMContentLoaded", function () {
    console.log("🚀 Project Data Loaded:", window.projectData);

    if (!window.projectData || !window.projectData.members) {
        console.error("❌ Error: Project data is missing!");
        return;
    }

    // Convert start and end dates
    const startDate = new Date(window.projectData.startDate);
    const endDate = new Date(window.projectData.endDate);

    // Ensure dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error("❌ Invalid dates: ", startDate, endDate);
        return;
    }

    // Define tasks (Project Timeline + Members)
    const tasks = [
        {
            id: "1",
            name: window.projectData.name,
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0],
            progress: 100
        }
    ];

    // Add members as individual tasks
    window.projectData.members.forEach((member, index) => {
        tasks.push({
            id: `${index + 2}`,
            name: `${member.firstName} ${member.lastName} - ${member.level}`,
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0],
            progress: 50
        });
    });

    console.log("📊 Tasks for Gantt:", tasks);

    // Ensure #gantt element exists
    const ganttElement = document.getElementById("gantt");
    if (!ganttElement) {
        console.error("❌ Error: #gantt element not found!");
        return;
    }

    // Initialize Gantt Chart
    try {
        new Gantt("#gantt", tasks, {
            view_mode: "Day",
            language: "en"
        });
    } catch (error) {
        console.error("❌ Gantt Chart Error:", error);
    }
});