// Sidebar toggle for mobile + desktop

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const main = document.querySelector(".main-content");

    sidebar.classList.toggle("open");
    main.classList.toggle("shifted");
}

// Close sidebar when clicking outside (mobile-friendly)
document.addEventListener("click", function (event) {
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.querySelector(".toggle-btn");

    // If sidebar is open AND click is outside sidebar AND not on toggle button
    if (
        sidebar.classList.contains("open") &&
        !sidebar.contains(event.target) &&
        event.target !== toggleBtn
    ) {
        sidebar.classList.remove("open");
    }
});

