
document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById("sidebar");
    const sidebarOverlay = document.getElementById("sidebarOverlay");
    const mobileMenuButton = document.getElementById("mobileMenuButton");

    const uploadForm = document.getElementById("uploadForm");
    const fileInput = document.getElementById("fileInput");
    const dropzone = document.getElementById("dropzone");
    const fileName = document.getElementById("fileName");
    const selectedFile = document.getElementById("selectedFile");
    const clearFileButton = document.getElementById("clearFileButton");

    const datasetSearch = document.getElementById("datasetSearch");
    const filesList = document.getElementById("filesList");
    const datasetCount = document.getElementById("datasetCount");
    const sidebarDatasetCount = document.getElementById("sidebarDatasetCount");

    const userName = document.getElementById("userName");
    const welcomeName = document.getElementById("welcomeName");
    const userAvatar = document.getElementById("userAvatar");
    const topbarAvatar = document.getElementById("topbarAvatar");
    const logoutBtn = document.getElementById("logoutBtn");
    const breadcrumbCurrent = document.getElementById("breadcrumbCurrent");

    const navLinks = Array.from(
        document.querySelectorAll(".nav-link[data-section]")
    );

    const sectionLinks = Array.from(
        document.querySelectorAll("[data-section]")
    );

    let selectedFileObject = null;

    function readStoredUser() {
        try {
            const rawUser = localStorage.getItem("user");

            if (rawUser) {
                const parsed = JSON.parse(rawUser);

                if (parsed && typeof parsed === "object") {
                    return parsed;
                }
            }
        } catch (error) {
            console.warn("Could not read stored user information.", error);
        }

        return {
            name: localStorage.getItem("user_name") || "",
            email: localStorage.getItem("user_email") || ""
        };
    }

    function displayUser() {
        const user = readStoredUser();
        const name = user.name || user.full_name || "User";
        const firstName = name.trim().split(/\s+/)[0] || "there";
        const initial = firstName.charAt(0).toUpperCase() || "U";

        if (userName) {
            userName.textContent = name;
        }

        if (welcomeName) {
            welcomeName.textContent = firstName;
        }

        if (userAvatar) {
            userAvatar.textContent = initial;
        }

        if (topbarAvatar) {
            topbarAvatar.textContent = initial;
        }
    }

    function closeSidebar() {
        if (sidebar) {
            sidebar.classList.remove("open");
        }

        if (sidebarOverlay) {
            sidebarOverlay.classList.remove("visible");
        }

        if (mobileMenuButton) {
            mobileMenuButton.setAttribute("aria-expanded", "false");
            mobileMenuButton.setAttribute("aria-label", "Open navigation");
        }

        document.body.style.overflow = "";
    }

    function toggleSidebar() {
        if (!sidebar) {
            return;
        }

        const shouldOpen = !sidebar.classList.contains("open");

        sidebar.classList.toggle("open", shouldOpen);

        if (sidebarOverlay) {
            sidebarOverlay.classList.toggle("visible", shouldOpen);
        }

        if (mobileMenuButton) {
            mobileMenuButton.setAttribute(
                "aria-expanded",
                String(shouldOpen)
            );

            mobileMenuButton.setAttribute(
                "aria-label",
                shouldOpen ? "Close navigation" : "Open navigation"
            );
        }

        document.body.style.overflow = shouldOpen ? "hidden" : "";
    }

    function navigateToSection(sectionId) {
        const section = document.getElementById(sectionId);

        if (!section) {
            return;
        }

        section.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "auto"
                : "smooth",
            block: "start"
        });

        updateActiveNavigation(sectionId);
        closeSidebar();
    }

    function updateActiveNavigation(sectionId) {
        navLinks.forEach((link) => {
            const isActive = link.dataset.section === sectionId;

            link.classList.toggle("active", isActive);

            if (isActive) {
                link.setAttribute("aria-current", "location");
            } else {
                link.removeAttribute("aria-current");
            }
        });

        const activeLink = navLinks.find(
            (link) => link.dataset.section === sectionId
        );

        if (breadcrumbCurrent && activeLink) {
            const label = activeLink.querySelector("span:not(.nav-icon):not(.nav-count):not(.nav-new)");

            breadcrumbCurrent.textContent = label
                ? label.textContent.trim()
                : activeLink.textContent.trim();
        }
    }

    function setupNavigation() {
        sectionLinks.forEach((link) => {
            link.addEventListener("click", (event) => {
                const sectionId = link.dataset.section;

                if (!sectionId) {
                    return;
                }

                if (!document.getElementById(sectionId)) {
                    return;
                }

                event.preventDefault();

                if (window.location.hash !== `#${sectionId}`) {
                    history.replaceState(null, "", `#${sectionId}`);
                }

                navigateToSection(sectionId);
            });
        });

        if (mobileMenuButton) {
            mobileMenuButton.addEventListener("click", toggleSidebar);
        }

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener("click", closeSidebar);
        }

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closeSidebar();
            }
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth > 760) {
                closeSidebar();
            }
        });

        const initialSection = window.location.hash.slice(1);

        if (initialSection && document.getElementById(initialSection)) {
            updateActiveNavigation(initialSection);
        }
    }

    function formatBytes(bytes) {
        if (!Number.isFinite(bytes) || bytes < 0) {
            return "";
        }

        if (bytes < 1024) {
            return `${bytes} B`;
        }

        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }

        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    function showSelectedFile(file) {
        selectedFileObject = file || null;

        if (fileName) {
            fileName.textContent = file
                ? `${file.name} · ${formatBytes(file.size)}`
                : "No file selected";
        }

        if (selectedFile) {
            selectedFile.hidden = !file;
        }

        if (dropzone) {
            dropzone.classList.toggle("has-file", Boolean(file));
        }
    }

    function isSupportedFile(file) {
        if (!file) {
            return false;
        }

        return /\.(csv|xlsx|xls)$/i.test(file.name);
    }

    function setFile(file) {
        if (!file) {
            showSelectedFile(null);
            return;
        }

        if (!isSupportedFile(file)) {
            showUploadMessage(
                "Unsupported file type. Select a CSV or Excel file.",
                "error"
            );

            if (fileInput) {
                fileInput.value = "";
            }

            showSelectedFile(null);
            return;
        }

        if (fileInput) {
            try {
                const transfer = new DataTransfer();
                transfer.items.add(file);
                fileInput.files = transfer.files;
            } catch (error) {
                console.warn("Could not synchronize the selected file.", error);
            }
        }

        showSelectedFile(file);
        showUploadMessage("", "info");
    }

    function showUploadMessage(message, type = "info") {
        const messageElement = document.getElementById("uploadMessage");

        if (!messageElement) {
            return;
        }

        messageElement.textContent = message;
        messageElement.style.display = message ? "block" : "none";

        if (type === "success") {
            messageElement.style.color = "#75e6b0";
        } else if (type === "error") {
            messageElement.style.color = "#ff7f91";
        } else {
            messageElement.style.color = "#91a2b9";
        }
    }

    function setupFileSelection() {
        if (fileInput) {
            fileInput.addEventListener("change", () => {
                const file = fileInput.files && fileInput.files[0];

                if (file) {
                    setFile(file);
                } else {
                    showSelectedFile(null);
                }
            });
        }

        if (clearFileButton) {
            clearFileButton.addEventListener("click", () => {
                if (fileInput) {
                    fileInput.value = "";
                }

                showSelectedFile(null);
                showUploadMessage("", "info");
            });
        }

        if (dropzone) {
            ["dragenter", "dragover"].forEach((eventName) => {
                dropzone.addEventListener(eventName, (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    dropzone.classList.add("dragover");
                });
            });

            ["dragleave", "drop"].forEach((eventName) => {
                dropzone.addEventListener(eventName, (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    dropzone.classList.remove("dragover");
                });
            });

            dropzone.addEventListener("drop", (event) => {
                const file = event.dataTransfer &&
                    event.dataTransfer.files &&
                    event.dataTransfer.files[0];

                if (file) {
                    setFile(file);
                }
            });
        }

        // This listener only checks the file selection.
        // The existing dashboard.js handles the actual upload request.
        if (uploadForm) {
            uploadForm.addEventListener(
                "submit",
                (event) => {
                    const file = fileInput &&
                        fileInput.files &&
                        fileInput.files[0];

                    if (!file) {
                        event.preventDefault();
                        event.stopImmediatePropagation();

                        showUploadMessage(
                            "Please select a CSV or Excel file first.",
                            "error"
                        );

                        return;
                    }

                    if (!isSupportedFile(file)) {
                        event.preventDefault();
                        event.stopImmediatePropagation();

                        showUploadMessage(
                            "Please select a supported CSV or Excel file.",
                            "error"
                        );
                    }
                },
                true
            );
        }
    }

    function updateDatasetCounts() {
        if (!filesList) {
            return;
        }

        const rows = Array.from(
            filesList.querySelectorAll("tr")
        ).filter((row) => {
            return !row.classList.contains("empty-row") &&
                !row.querySelector(".empty-state");
        });

        const count = rows.length;
        const label = `${count} ${count === 1 ? "dataset" : "datasets"}`;

        if (datasetCount) {
            datasetCount.textContent = label;
        }

        if (sidebarDatasetCount) {
            sidebarDatasetCount.textContent = String(count);
        }

        const totalFiles = document.getElementById("totalFiles");

        if (totalFiles) {
            totalFiles.textContent = String(count);
        }
    }

    function setupDatasetSearch() {
        if (!datasetSearch || !filesList) {
            return;
        }

        datasetSearch.addEventListener("input", () => {
            const query = datasetSearch.value.trim().toLowerCase();

            const rows = Array.from(
                filesList.querySelectorAll("tr")
            ).filter((row) => {
                return !row.classList.contains("empty-row") &&
                    !row.querySelector(".empty-state");
            });

            let visibleRows = 0;

            rows.forEach((row) => {
                const matches = row.textContent.toLowerCase().includes(query);

                row.hidden = !matches;

                if (matches) {
                    visibleRows += 1;
                }
            });

            let noResults = filesList.querySelector(".search-empty-row");

            if (query && visibleRows === 0) {
                if (!noResults) {
                    noResults = document.createElement("tr");
                    noResults.className = "search-empty-row";

                    const cell = document.createElement("td");
                    cell.colSpan = 4;

                    const text = document.createElement("div");
                    text.className = "empty-state";

                    const heading = document.createElement("strong");
                    heading.textContent = "No matching datasets";

                    const paragraph = document.createElement("p");
                    paragraph.textContent = "Try another search term.";

                    text.append(heading, paragraph);
                    cell.appendChild(text);
                    noResults.appendChild(cell);
                    filesList.appendChild(noResults);
                }
            } else if (noResults) {
                noResults.remove();
            }
        });
    }

    function setupLogout() {
        if (!logoutBtn) {
            return;
        }

        logoutBtn.addEventListener("click", async () => {
            const confirmed = window.confirm("Are you sure you want to log out?");

            if (!confirmed) {
                return;
            }

            logoutBtn.disabled = true;

            try {
                // Call the endpoint only if your backend implements it.
                const response = await fetch("/api/auth/logout", {
                    method: "POST",
                    headers: {
                        "Accept": "application/json"
                    },
                    credentials: "same-origin"
                });

                // A missing logout route should not prevent local sign-out.
                if (!response.ok && response.status !== 404 && response.status !== 405) {
                    console.warn("Server logout endpoint returned:", response.status);
                }
            } catch (error) {
                console.warn("Could not contact the logout endpoint.", error);
            } finally {
                try {
                    localStorage.removeItem("user");
                    localStorage.removeItem("user_id");
                    localStorage.removeItem("user_name");
                    localStorage.removeItem("user_email");
                } catch (error) {
                    console.warn("Could not clear stored user details.", error);
                }

                window.location.href = "/index.html";
            }
        });
    }

    // Initial setup
    displayUser();
    setupNavigation();
    setupFileSelection();
    setupDatasetSearch();
    setupLogout();
    updateDatasetCounts();

    // Refresh counts if the existing upload script updates the dataset table.
    if (filesList && "MutationObserver" in window) {
        const observer = new MutationObserver(() => {
            updateDatasetCounts();

            if (datasetSearch && datasetSearch.value.trim()) {
                datasetSearch.dispatchEvent(new Event("input"));
            }
        });

        observer.observe(filesList, {
            childList: true,
            subtree: true
        });
    }
});
