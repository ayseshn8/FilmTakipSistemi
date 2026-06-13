// Global state variables
let tasks = [];
let members = [];
let movies = [];
let movieStats = [];
let budgetSummary = { plannedBudget: 0, spentBudget: 0, remainingBudget: 0 };
let currentGanttMode = 'task'; // 'task' or 'member'

const API_BASE = '/api';

// Initialize the Application
document.addEventListener("DOMContentLoaded", () => {
    initTime();
    initRouting();
    initFormsAndModals();
    initMovieFilters();
    refreshAllData();
});

// Update the clock in the top header
function initTime() {
    const timeSpan = document.getElementById("current-time");
    const updateTime = () => {
        const now = new Date();
        timeSpan.textContent = now.toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };
    updateTime();
    setInterval(updateTime, 60000);
}

// Client-side Routing and Tab Swapping
function initRouting() {
    const navItems = document.querySelectorAll(".nav-item");
    const sections = document.querySelectorAll(".content-section");
    const pageTitle = document.getElementById("page-title");
    const pageDesc = document.getElementById("page-desc");

    const routeInfo = {
        "dashboard": { title: "Kontrol Paneli", desc: "Projenizin genel ilerleme durumu ve finansal sağlığı." },
        "movies": { title: "Film Takip Sistemi", desc: "Film kütüphanenizi inceleyin, puanlayın ve yeni filmler kaydedin." },
        "gantt": { title: "Gantt Şemaları", desc: "Takvimsel süreçler, görev sıralamaları ve bağımlılıklar." },
        "budget": { title: "Bütçe & Finans", desc: "Gelir, gider ve proje bütçe hedeflerinin takibi." },
        "tasks": { title: "Görevler & Ekip", desc: "Tüm proje görevleri ve çalışma ekibi yönetimi." },
        "reports": { title: "Örnek Rapor Çıktıları", desc: "Proje raporlarını inceleyin ve yazıcı dostu çıktı alın." },
        "project-info": { title: "Proje Yönetim Teorisi", desc: "Metodolojiler, Kritik Yol ve Bolluk Süresi tanımları." }
    };

    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const targetId = item.getAttribute("href").substring(1);
            
            // Toggle active sidebar links
            navItems.forEach(nav => nav.classList.remove("active"));
            item.classList.add("active");

            // Toggle active sections
            sections.forEach(sec => sec.classList.remove("active"));
            const activeSection = document.getElementById(`sec-${targetId}`);
            if (activeSection) activeSection.classList.add("active");

            // Update page titles
            if (routeInfo[targetId]) {
                pageTitle.textContent = routeInfo[targetId].title;
                pageDesc.textContent = routeInfo[targetId].desc;
            }

            // Custom adjustments on tab switch
            if (targetId === 'gantt') {
                renderGanttChart();
            } else if (targetId === 'movies') {
                renderMovies(movies);
            }
        });
    });

    // Gantt sub-tabs routing
    document.getElementById("tab-gantt-task").addEventListener("click", () => {
        document.getElementById("tab-gantt-task").classList.add("active");
        document.getElementById("tab-gantt-member").classList.remove("active");
        currentGanttMode = 'task';
        document.getElementById("gantt-title").textContent = "Göreve Göre Proje Zaman Çizelgesi";
        renderGanttChart();
    });

    document.getElementById("tab-gantt-member").addEventListener("click", () => {
        document.getElementById("tab-gantt-member").classList.add("active");
        document.getElementById("tab-gantt-task").classList.remove("active");
        currentGanttMode = 'member';
        document.getElementById("gantt-title").textContent = "Ekip Üyelerine Göre İş Dağılım Şeması";
        renderGanttChart();
    });
}

// Initial Data Fetching from API
async function refreshAllData() {
    try {
        // Fetch tasks
        const resTasks = await fetch(`${API_BASE}/ProjectTasks`);
        tasks = await resTasks.json();

        // Fetch team members
        const resMembers = await fetch(`${API_BASE}/TeamMembers`);
        members = await resMembers.json();

        // Fetch movies
        const resMovies = await fetch(`${API_BASE}/Movies`);
        movies = await resMovies.json();

        // Fetch movie ratings stats
        try {
            const resStats = await fetch(`${API_BASE}/Movies/stats`);
            movieStats = await resStats.json();
        } catch(e) {
            console.error("Film istatistikleri alinamadi", e);
        }

        // Fetch budget summary
        const resBudget = await fetch(`${API_BASE}/Budgets/summary`);
        budgetSummary = await resBudget.json();

        // Populate dashboard components
        updateDashboardMetrics();
        populateKanbanBoard();
        populateTablesAndDropdowns();
        renderGanttChart();
        renderMovies(movies);
        populateReport();

    } catch (err) {
        console.error("Veri yuklenirken hata olustu:", err);
    }
}

// Populate Dashboard Cards and Circular Progress Bar
async function updateDashboardMetrics() {
    // Project Completion Average Progress
    let avgProgress = 0;
    if (tasks.length > 0) {
        const sum = tasks.reduce((acc, t) => acc + t.progress, 0);
        avgProgress = Math.round(sum / tasks.length * 10) / 10;
    }

    // Circular progress stroke calculation
    const circle = document.getElementById("dash-circle-progress");
    const radius = 40;
    const circumference = 2 * Math.PI * radius; // ~251.2
    
    // Set circle progress UI
    if (circle) {
        circle.style.strokeDasharray = circumference;
        const offset = circumference - (avgProgress / 100) * circumference;
        circle.style.strokeDashoffset = offset;
    }

    document.getElementById("dash-text-progress").textContent = `${avgProgress}%`;
    document.getElementById("dash-completed-percent").textContent = `${avgProgress}%`;
    document.getElementById("dash-remaining-percent").textContent = `${Math.round((100 - avgProgress) * 10) / 10}%`;

    // Budgets
    const planned = budgetSummary.plannedBudget || 0;
    const spentFromApi = budgetSummary.spentBudget || 0;
    // Calculate total costs of tasks as expenses
    const tasksCost = tasks.reduce((sum, t) => sum + (t.cost || 0), 0);
    const totalSpent = spentFromApi + tasksCost;
    const netBudget = planned - totalSpent;

    document.getElementById("dash-planned-budget").textContent = formatCurrency(planned);
    document.getElementById("dash-spent-budget").textContent = formatCurrency(totalSpent);
    document.getElementById("dash-net-budget").textContent = formatCurrency(netBudget);
    
    // Set KPI colors
    const netKpi = document.getElementById("dash-net-budget");
    if (netBudget < 0) {
        netKpi.className = "amount text-danger";
    } else if (netBudget < planned * 0.1) {
        netKpi.className = "amount text-warning";
    } else {
        netKpi.className = "amount text-success";
    }

    // Mini Budget progress bar
    const barWidth = planned > 0 ? Math.min((totalSpent / planned) * 100, 100) : 0;
    const budgetBar = document.getElementById("dash-budget-bar");
    budgetBar.style.width = `${barWidth}%`;
    if (barWidth >= 90) {
        budgetBar.style.background = "var(--color-danger)";
    } else if (barWidth >= 75) {
        budgetBar.style.background = "var(--color-warning)";
    } else {
        budgetBar.style.background = "linear-gradient(90deg, var(--color-primary), var(--color-secondary))";
    }

    // Populate Budget Screen KPIs
    document.getElementById("budget-planned-kpi").textContent = formatCurrency(planned);
    document.getElementById("budget-spent-kpi").textContent = formatCurrency(totalSpent);
    document.getElementById("budget-net-kpi").textContent = formatCurrency(netBudget);
    
    // Also update form placeholder
    document.getElementById("input-planned-budget").value = planned;
    document.getElementById("input-spent-budget").value = spentFromApi;

    // Fetch Critical Tasks and slack information
    try {
        const resCrit = await fetch(`${API_BASE}/ProjectTasks/critical`);
        const criticalTasks = await resCrit.json();
        
        document.getElementById("dash-critical-count").textContent = criticalTasks.length;
        document.getElementById("rep-critical-count").textContent = criticalTasks.length;

        const listDiv = document.getElementById("dash-critical-list");
        listDiv.innerHTML = "";
        
        if (criticalTasks.length === 0) {
            listDiv.innerHTML = `<p class="text-success text-center" style="font-size: 11px; font-weight:600;"><i class="fa-solid fa-check-double"></i> Kritik görev bulunmuyor.</p>`;
        } else {
            criticalTasks.forEach(c => {
                const item = document.createElement("div");
                item.className = "critical-mini-item";
                item.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${c.title} (${Math.round((new Date(c.endDate) - new Date(c.startDate)) / (1000 * 60 * 60 * 24))} gün)`;
                listDiv.appendChild(item);
            });
        }
    } catch (err) {
        console.error("Kritik görev bilgileri alınamadı", err);
    }
}

// Kanban View Rendering
function populateKanbanBoard() {
    const colTodo = document.getElementById("cards-todo");
    const colInprogress = document.getElementById("cards-inprogress");
    const colDone = document.getElementById("cards-done");

    colTodo.innerHTML = "";
    colInprogress.innerHTML = "";
    colDone.innerHTML = "";

    let counts = { "To Do": 0, "In Progress": 0, "Done": 0 };
    document.getElementById("dash-total-tasks").textContent = `${tasks.length} Görev`;

    tasks.forEach(task => {
        const card = document.createElement("div");
        card.className = "kanban-card";

        // Add visual indicator for critical path items
        const isCritical = checkIsTaskCritical(task.id);
        const borderStyle = isCritical ? 'border-left: 3px solid var(--color-danger);' : '';

        card.style = borderStyle;

        card.innerHTML = `
            <h5>${task.title}</h5>
            <div class="kanban-progress-bar">
                <div class="kanban-progress-fill" style="width: ${task.progress}%"></div>
            </div>
            <div class="kanban-meta">
                <span class="kanban-assignee">
                    <i class="fa-solid fa-user-circle"></i> ${task.assignedMemberName || "Atanmamış"}
                </span>
                <span class="kanban-cost">${formatCurrency(task.cost)}</span>
            </div>
        `;

        if (task.status === "To Do") {
            colTodo.appendChild(card);
            counts["To Do"]++;
        } else if (task.status === "In Progress" || task.status === "Devam Ediyor") {
            colInprogress.appendChild(card);
            counts["In Progress"]++;
        } else {
            colDone.appendChild(card);
            counts["Done"]++;
        }
    });

    document.getElementById("count-todo").textContent = counts["To Do"];
    document.getElementById("count-inprogress").textContent = counts["In Progress"];
    document.getElementById("count-done").textContent = counts["Done"];
}

// Populate tables, selects dropdowns, and configurations
async function populateTablesAndDropdowns() {
    // 1. Task Management Table
    const tbodyTasks = document.getElementById("tasks-table-body");
    tbodyTasks.innerHTML = "";

    // Fetch Slack days to display on table
    let slackData = [];
    try {
        const resSlack = await fetch(`${API_BASE}/ProjectTasks/slack`);
        slackData = await resSlack.json();
    } catch(e) {
        console.error(e);
    }

    tasks.forEach(task => {
        const tr = document.createElement("tr");
        const sInfo = slackData.find(s => s.id === task.id) || { slackDays: 0, isCritical: false };
        
        let statusBadge = `<span class="badge" style="background: rgba(107,114,128,0.1); color: var(--text-secondary);">To Do</span>`;
        if (task.status === "In Progress") {
            statusBadge = `<span class="badge" style="background: rgba(99,102,241,0.1); color: var(--color-primary);">In Progress</span>`;
        } else if (task.status === "Done") {
            statusBadge = `<span class="badge" style="background: rgba(16,185,129,0.1); color: var(--color-success);">Done</span>`;
        }

        let slackBadge = sInfo.isCritical 
            ? `<span class="text-danger" style="font-weight:700;"><i class="fa-solid fa-circle-exclamation"></i> 0 Gün</span>`
            : `<span class="text-success">${sInfo.slackDays} Gün</span>`;

        tr.innerHTML = `
            <td style="font-weight:700;">${task.title}</td>
            <td>
                <span style="font-size:11px; color: var(--text-secondary);"><i class="fa-regular fa-calendar"></i> ${task.startDate}</span><br/>
                <span style="font-size:11px; color: var(--text-secondary);"><i class="fa-solid fa-flag-checkered"></i> ${task.endDate}</span>
            </td>
            <td>${statusBadge}</td>
            <td>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-size:11px; font-weight:700;">%${task.progress}</span>
                    <div style="flex-grow:1; background: rgba(255,255,255,0.05); height: 6px; border-radius:3px; overflow:hidden; width: 60px;">
                        <div style="background: var(--color-primary); height:100%; width:${task.progress}%;"></div>
                    </div>
                </div>
            </td>
            <td>
                <div style="font-weight:600;">${task.assignedMemberName}</div>
                <div style="font-size:10px; color: var(--text-muted);">${task.assignedMemberRole}</div>
            </td>
            <td>${slackBadge}</td>
            <td style="font-weight:700; color: var(--color-success);">${formatCurrency(task.cost)}</td>
            <td>
                <button class="action-btn edit" onclick="openEditTaskModal(${task.id})"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="action-btn delete" onclick="deleteTask(${task.id})"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbodyTasks.appendChild(tr);
    });

    // 2. Team Management Table
    const tbodyMembers = document.getElementById("members-table-body");
    tbodyMembers.innerHTML = "";
    members.forEach(member => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="font-weight:700; font-size:14px;"><i class="fa-solid fa-circle-user" style="color:var(--color-primary); margin-right:8px;"></i>${member.name}</td>
            <td><span class="badge">${member.role}</span></td>
            <td>
                <button class="action-btn delete" onclick="deleteMember(${member.id})"><i class="fa-solid fa-user-minus"></i></button>
            </td>
        `;
        tbodyMembers.appendChild(tr);
    });

    // 3. Budget Expenses Table
    const tbodyCosts = document.getElementById("budget-costs-table");
    tbodyCosts.innerHTML = "";
    tasks.forEach(task => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="font-weight:700;">${task.title}</td>
            <td>${task.assignedMemberName}</td>
            <td>%${task.progress}</td>
            <td style="font-weight:700; color:var(--color-danger);">${formatCurrency(task.cost)}</td>
        `;
        tbodyCosts.appendChild(tr);
    });

    // Populate dropdowns in Modal Form
    const selectAssignee = document.getElementById("task-assignee");
    selectAssignee.innerHTML = `<option value="">Atanmamış</option>`;
    members.forEach(m => {
        selectAssignee.innerHTML += `<option value="${m.id}">${m.name} (${m.role})</option>`;
    });

    const selectPredecessor = document.getElementById("task-predecessor");
    selectPredecessor.innerHTML = `<option value="">Yok (Bağımsız)</option>`;
    tasks.forEach(t => {
        selectPredecessor.innerHTML += `<option value="${t.id}">${t.title}</option>`;
    });
}

// Render Movies Grid in Film Takip Sistemi Section
function renderMovies(moviesList) {
    const grid = document.getElementById("movies-grid");
    if (!grid) return;

    grid.innerHTML = "";

    if (moviesList.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-muted); font-weight:600;"><i class="fa-solid fa-clapperboard" style="font-size:32px; margin-bottom:12px; display:block;"></i>Gösterilecek film bulunamadı.</div>`;
        return;
    }

    moviesList.forEach(movie => {
        const card = document.createElement("div");
        card.className = "movie-card glass";

        // Find average rating
        const stat = movieStats.find(s => s.id === movie.id);
        const avgRating = stat ? stat.averageRating : 0;
        const ratingDisplay = avgRating > 0 ? `⭐ ${avgRating.toFixed(1)}` : "⭐ Yeni";

        card.innerHTML = `
            <div class="movie-card-img-wrapper">
                <img class="movie-card-img" src="${movie.imageUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500'}" alt="${movie.title}" onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500'">
                <span class="movie-card-badge">${movie.genre}</span>
                <span class="movie-card-rating">${ratingDisplay}</span>
            </div>
            <div class="movie-card-body">
                <h3 class="movie-card-title">${movie.title}</h3>
                <div class="movie-card-meta">
                    <i class="fa-regular fa-calendar-days"></i> Yayın Yılı: ${movie.releaseYear}
                </div>
                <p class="movie-card-desc">${movie.description}</p>
                <div class="movie-card-actions">
                    <button class="action-btn edit" onclick="openEditMovieModal(${movie.id})"><i class="fa-solid fa-edit"></i> Düzenle</button>
                    <button class="action-btn delete" onclick="deleteMovie(${movie.id})"><i class="fa-solid fa-trash"></i> Sil</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Setup Search and Filters for Movies
function initMovieFilters() {
    const searchInput = document.getElementById("movie-search");
    const genreFilter = document.getElementById("movie-genre-filter");

    const filterHandler = () => {
        const query = searchInput.value.toLowerCase();
        const genre = genreFilter.value;

        const filtered = movies.filter(m => {
            const matchesQuery = m.title.toLowerCase().includes(query) || m.genre.toLowerCase().includes(query) || m.description.toLowerCase().includes(query);
            const matchesGenre = !genre || m.genre.toLowerCase().includes(genre.toLowerCase());
            return matchesQuery && matchesGenre;
        });

        renderMovies(filtered);
    };

    if (searchInput) searchInput.addEventListener("input", filterHandler);
    if (genreFilter) genreFilter.addEventListener("change", filterHandler);
}

// Dynamic Gantt Chart Rendering Engine
function renderGanttChart() {
    const monthHeader = document.getElementById("gantt-timeline-months");
    const rowsContainer = document.getElementById("gantt-rows");
    
    if (!monthHeader || !rowsContainer) return;

    monthHeader.innerHTML = "";
    rowsContainer.innerHTML = "";

    if (tasks.length === 0) {
        rowsContainer.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-muted); font-weight:600;"><i class="fa-solid fa-folder-open" style="font-size:32px; margin-bottom:12px; display:block;"></i>Gösterilecek görev bulunamadı. Lütfen yeni görev ekleyin.</div>`;
        return;
    }

    // Find Project Start and End Dates
    const startDates = tasks.map(t => new Date(t.startDate));
    const endDates = tasks.map(t => new Date(t.endDate));
    
    let projStart = new Date(Math.min(...startDates));
    let projEnd = new Date(Math.max(...endDates));

    // Pad dates slightly for visual margin
    projStart.setDate(projStart.getDate() - 2);
    projEnd.setDate(projEnd.getDate() + 5);

    // Calculate total days in project duration
    const totalDays = Math.ceil((projEnd - projStart) / (1000 * 60 * 60 * 24));
    
    // 1. Draw Gantt Header (Timeline calendar columns)
    monthHeader.innerHTML = `<div class="label-col">GANTT ŞEMASI</div>`;
    const timelineDays = document.createElement("div");
    timelineDays.className = "gantt-timeline-days";
    timelineDays.style.width = `${totalDays * 45}px`; // 45px per day

    for (let i = 0; i < totalDays; i++) {
        const current = new Date(projStart);
        current.setDate(projStart.getDate() + i);

        const tick = document.createElement("div");
        tick.className = "gantt-day-tick";
        tick.style.width = "45px";
        tick.innerHTML = `
            <span>${current.toLocaleDateString("tr-TR", { weekday: "short" })}</span>
            <strong>${current.getDate()}</strong>
        `;

        // Highlight weekends
        if (current.getDay() === 0 || current.getDay() === 6) {
            tick.style.background = "rgba(255, 255, 255, 0.02)";
        }
        timelineDays.appendChild(tick);
    }
    monthHeader.appendChild(timelineDays);

    // 2. Draw Rows based on selected View Mode ('task' or 'member')
    if (currentGanttMode === 'task') {
        tasks.forEach(task => {
            const tStart = new Date(task.startDate);
            const tEnd = new Date(task.endDate);

            const dayOffset = Math.max(0, Math.floor((tStart - projStart) / (1000 * 60 * 60 * 24)));
            const durationDays = Math.max(1, Math.ceil((tEnd - tStart) / (1000 * 60 * 60 * 24)));

            const row = document.createElement("div");
            row.className = "gantt-row";

            const titleCol = document.createElement("div");
            titleCol.className = "gantt-row-title-col";
            titleCol.innerHTML = `
                <span class="gantt-row-title">${task.title}</span>
                <span class="gantt-row-subtitle">${task.assignedMemberName || "Sorumlu Yok"}</span>
            `;
            row.appendChild(titleCol);

            const barCol = document.createElement("div");
            barCol.className = "gantt-row-bar-col";
            barCol.style.width = `${totalDays * 45}px`;

            const barWrapper = document.createElement("div");
            barWrapper.className = "gantt-bar-wrapper";

            const bar = document.createElement("div");
            const isCritical = checkIsTaskCritical(task.id);
            bar.className = `gantt-bar ${isCritical ? 'critical' : ''}`;
            
            // Positioning coordinates
            const leftOffsetPx = dayOffset * 45;
            const widthPx = durationDays * 45;

            bar.style.left = `${leftOffsetPx}px`;
            bar.style.width = `${widthPx}px`;

            // Progress inner fill
            const progressFill = document.createElement("div");
            progressFill.className = "gantt-bar-inner-progress";
            progressFill.style.width = `${task.progress}%`;
            bar.appendChild(progressFill);

            // Progress text inside bar
            const barText = document.createElement("span");
            barText.className = "gantt-bar-text";
            barText.textContent = `%${task.progress}`;
            bar.appendChild(barText);

            barWrapper.appendChild(bar);
            barCol.appendChild(barWrapper);
            row.appendChild(barCol);

            rowsContainer.appendChild(row);
        });
    } else {
        // Gantt Mode by Team Member
        members.forEach(member => {
            const memberTasks = tasks.filter(t => t.assignedMemberId === member.id);
            
            const row = document.createElement("div");
            row.className = "gantt-row";
            row.style.height = `${Math.max(52, memberTasks.length * 36)}px`; // dynamic height for multiple tasks per person

            const titleCol = document.createElement("div");
            titleCol.className = "gantt-row-title-col";
            titleCol.innerHTML = `
                <span class="gantt-row-title">${member.name}</span>
                <span class="gantt-row-subtitle">${member.role}</span>
            `;
            row.appendChild(titleCol);

            const barCol = document.createElement("div");
            barCol.className = "gantt-row-bar-col";
            barCol.style.width = `${totalDays * 45}px`;

            memberTasks.forEach((task, idx) => {
                const tStart = new Date(task.startDate);
                const tEnd = new Date(task.endDate);

                const dayOffset = Math.max(0, Math.floor((tStart - projStart) / (1000 * 60 * 60 * 24)));
                const durationDays = Math.max(1, Math.ceil((tEnd - tStart) / (1000 * 60 * 60 * 24)));

                const bar = document.createElement("div");
                const isCritical = checkIsTaskCritical(task.id);
                bar.className = `gantt-bar ${isCritical ? 'critical' : ''}`;
                
                const leftOffsetPx = dayOffset * 45;
                const widthPx = durationDays * 45;

                bar.style.left = `${leftOffsetPx}px`;
                bar.style.width = `${widthPx}px`;
                bar.style.top = `${idx * 32 + 6}px`; // stack overlapping bars vertically
                bar.style.height = "26px";
                bar.title = `${task.title} (%${task.progress})`;

                const progressFill = document.createElement("div");
                progressFill.className = "gantt-bar-inner-progress";
                progressFill.style.width = `${task.progress}%`;
                bar.appendChild(progressFill);

                const barText = document.createElement("span");
                barText.className = "gantt-bar-text";
                barText.textContent = `${task.title.substring(0, 15)}... (%${task.progress})`;
                bar.appendChild(barText);

                barCol.appendChild(bar);
            });

            if (memberTasks.length === 0) {
                barCol.innerHTML = `<span style="font-size:11px; color: var(--text-muted); font-style:italic; padding-left:10px;">Atanmış görev bulunmuyor.</span>`;
            }

            row.appendChild(barCol);
            rowsContainer.appendChild(row);
        });
    }
}

// Utility to check if a task is marked critical
function checkIsTaskCritical(taskId) {
    if (tasks.length === 0) return false;
    // We compute critical path tasks locally as well for styling
    const projectEnd = new Date(Math.max(...tasks.map(t => new Date(t.endDate))));
    const task = tasks.find(t => t.id === taskId);
    if (!task) return false;

    const successors = tasks.filter(s => s.predecessorId === task.id);
    let lateFinish;
    if (successors.length === 0) {
        lateFinish = projectEnd;
    } else {
        const startTimes = successors.map(s => new Date(s.startDate));
        lateFinish = new Date(Math.min(...startTimes));
    }

    const slackDays = (lateFinish - new Date(task.endDate)) / (1000 * 60 * 60 * 24);
    return slackDays <= 0.5;
}

// Populate the printable reports page
function populateReport() {
    document.getElementById("report-generation-date").textContent = `Tarih: ${new Date().toLocaleDateString("tr-TR")}`;
    
    // Overall completion percentage
    let avgProgress = 0;
    if (tasks.length > 0) {
        const sum = tasks.reduce((acc, t) => acc + t.progress, 0);
        avgProgress = Math.round(sum / tasks.length * 10) / 10;
    }
    document.getElementById("rep-completion-rate").textContent = `${avgProgress}%`;
    document.getElementById("rep-total-tasks").textContent = tasks.length;

    // Financial reporting
    const planned = budgetSummary.plannedBudget || 0;
    const spentFromApi = budgetSummary.spentBudget || 0;
    const tasksCost = tasks.reduce((sum, t) => sum + (t.cost || 0), 0);
    const totalSpent = spentFromApi + tasksCost;
    const netBudget = planned - totalSpent;

    document.getElementById("rep-planned-budget").textContent = formatCurrency(planned);
    document.getElementById("rep-spent-budget").textContent = formatCurrency(totalSpent);
    document.getElementById("rep-net-budget").textContent = formatCurrency(netBudget);

    // Dynamic Report Tables
    const repTasksBody = document.getElementById("report-tasks-tbody");
    if (repTasksBody) {
        repTasksBody.innerHTML = "";
        tasks.forEach(t => {
            repTasksBody.innerHTML += `
                <tr>
                    <td><strong>${t.title}</strong></td>
                    <td>${t.startDate} / ${t.endDate}</td>
                    <td>${t.assignedMemberName}</td>
                    <td>${t.status}</td>
                    <td>%${t.progress}</td>
                    <td><strong>${formatCurrency(t.cost)}</strong></td>
                </tr>
            `;
        });
    }

    const repMembersBody = document.getElementById("report-members-tbody");
    if (repMembersBody) {
        repMembersBody.innerHTML = "";
        members.forEach(m => {
            const mTasks = tasks.filter(t => t.assignedMemberId === m.id);
            const totalCost = mTasks.reduce((sum, t) => sum + (t.cost || 0), 0);

            repMembersBody.innerHTML += `
                <tr>
                    <td><strong>${m.name}</strong></td>
                    <td>${m.role}</td>
                    <td>${mTasks.length} Görev</td>
                    <td><strong>${formatCurrency(totalCost)}</strong></td>
                </tr>
            `;
        });
    }
}

// Setup Form actions, CRUD triggers and Modal overlays
function initFormsAndModals() {
    // Modal Overlays
    const taskModal = document.getElementById("modal-task");
    const memberModal = document.getElementById("modal-member");
    const movieModal = document.getElementById("modal-movie");

    // Modal Trigger Buttons
    document.getElementById("btn-add-task-modal").addEventListener("click", () => {
        openAddTaskModal();
    });

    document.getElementById("btn-add-member-modal").addEventListener("click", () => {
        document.getElementById("form-member").reset();
        memberModal.classList.add("active");
    });

    const addMovieBtn = document.getElementById("btn-add-movie-modal");
    if (addMovieBtn) {
        addMovieBtn.addEventListener("click", () => {
            openAddMovieModal();
        });
    }

    // Close buttons for Modals
    document.getElementById("btn-close-task-modal").addEventListener("click", () => {
        taskModal.classList.remove("active");
    });
    document.getElementById("btn-cancel-task").addEventListener("click", () => {
        taskModal.classList.remove("active");
    });

    document.getElementById("btn-close-member-modal").addEventListener("click", () => {
        memberModal.classList.remove("active");
    });
    document.getElementById("btn-cancel-member").addEventListener("click", () => {
        memberModal.classList.remove("active");
    });

    const closeMovieBtn = document.getElementById("btn-close-movie-modal");
    if (closeMovieBtn) {
        closeMovieBtn.addEventListener("click", () => {
            movieModal.classList.remove("active");
        });
    }
    const cancelMovieBtn = document.getElementById("btn-cancel-movie");
    if (cancelMovieBtn) {
        cancelMovieBtn.addEventListener("click", () => {
            movieModal.classList.remove("active");
        });
    }

    // Close on overlay click
    window.addEventListener("click", (e) => {
        if (e.target === taskModal) taskModal.classList.remove("active");
        if (e.target === memberModal) memberModal.classList.remove("active");
        if (e.target === movieModal) movieModal.classList.remove("active");
    });

    // 1. Task Form Submit (POST/PUT)
    document.getElementById("form-task").addEventListener("submit", async (e) => {
        e.preventDefault();

        const taskId = document.getElementById("task-id").value;
        const taskData = {
            title: document.getElementById("task-title").value,
            startDate: new Date(document.getElementById("task-start").value).toISOString(),
            endDate: new Date(document.getElementById("task-end").value).toISOString(),
            status: document.getElementById("task-status").value,
            progress: parseInt(document.getElementById("task-progress").value),
            cost: parseFloat(document.getElementById("task-cost").value) || 0
        };

        const assigneeVal = document.getElementById("task-assignee").value;
        if (assigneeVal) taskData.assignedMemberId = parseInt(assigneeVal);

        const predVal = document.getElementById("task-predecessor").value;
        if (predVal) taskData.predecessorId = parseInt(predVal);

        try {
            if (taskId) {
                // Edit / PUT
                taskData.id = parseInt(taskId);
                const res = await fetch(`${API_BASE}/ProjectTasks/${taskId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(taskData)
                });
                if (!res.ok) throw new Error("Görev güncellenemedi");
            } else {
                // Add / POST
                const res = await fetch(`${API_BASE}/ProjectTasks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(taskData)
                });
                if (!res.ok) throw new Error("Görev oluşturulamadı");
            }

            taskModal.classList.remove("active");
            refreshAllData();
        } catch(err) {
            alert("Hata: " + err.message);
        }
    });

    // 2. Member Form Submit (POST)
    document.getElementById("form-member").addEventListener("submit", async (e) => {
        e.preventDefault();

        const memberData = {
            name: document.getElementById("member-name").value,
            role: document.getElementById("member-role").value
        };

        try {
            const res = await fetch(`${API_BASE}/TeamMembers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(memberData)
            });
            if (!res.ok) throw new Error("Ekip üyesi eklenemedi");

            memberModal.classList.remove("active");
            refreshAllData();
        } catch(err) {
            alert("Hata: " + err.message);
        }
    });

    // 3. Budget Update Form Submit (PUT)
    document.getElementById("form-update-budget").addEventListener("submit", async (e) => {
        e.preventDefault();

        const plannedBudget = parseFloat(document.getElementById("input-planned-budget").value) || 0;
        const spentBudget = parseFloat(document.getElementById("input-spent-budget").value) || 0;

        const budgetData = {
            id: 1, // Seed records always have ID = 1
            plannedBudget: plannedBudget,
            spentBudget: spentBudget
        };

        try {
            // Update the budget with PUT
            const res = await fetch(`${API_BASE}/Budgets/1`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(budgetData)
            });
            if (!res.ok) throw new Error("Bütçe güncellenemedi");

            alert("Bütçe planlaması başarıyla güncellendi.");
            refreshAllData();
        } catch(err) {
            alert("Hata: " + err.message);
        }
    });

    // 4. Movie Form Submit (POST/PUT)
    const movieForm = document.getElementById("form-movie");
    if (movieForm) {
        movieForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const movieId = document.getElementById("movie-id").value;
            const movieData = {
                title: document.getElementById("movie-title").value,
                description: document.getElementById("movie-description").value,
                releaseYear: parseInt(document.getElementById("movie-year").value),
                genre: document.getElementById("movie-genre").value,
                imageUrl: document.getElementById("movie-image").value
            };

            try {
                if (movieId) {
                    // Update / PUT
                    movieData.id = parseInt(movieId);
                    const res = await fetch(`${API_BASE}/Movies/${movieId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(movieData)
                    });
                    if (!res.ok) throw new Error("Film güncellenemedi");
                } else {
                    // Create / POST
                    const res = await fetch(`${API_BASE}/Movies`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(movieData)
                    });
                    if (!res.ok) throw new Error("Film eklenemedi");
                }

                movieModal.classList.remove("active");
                refreshAllData();
            } catch(err) {
                alert("Hata: " + err.message);
            }
        });
    }
}

// Open Add Task Modal resetting all values
function openAddTaskModal() {
    document.getElementById("task-modal-title").textContent = "Yeni Görev Oluştur";
    document.getElementById("task-id").value = "";
    document.getElementById("form-task").reset();
    
    // Set default dates
    const today = new Date().toISOString().substring(0, 10);
    document.getElementById("task-start").value = today;
    document.getElementById("task-end").value = today;

    // Reset select fields
    document.getElementById("task-assignee").value = "";
    document.getElementById("task-predecessor").value = "";

    document.getElementById("modal-task").classList.add("active");
}

// Open Edit Task Modal loading values from tasks array
function openEditTaskModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    document.getElementById("task-modal-title").textContent = "Görevi Düzenle";
    document.getElementById("task-id").value = task.id;
    document.getElementById("task-title").value = task.title;
    
    // Formatting dates to yyyy-MM-dd
    document.getElementById("task-start").value = task.startDate;
    document.getElementById("task-end").value = task.endDate;

    document.getElementById("task-status").value = task.status;
    document.getElementById("task-progress").value = task.progress;
    document.getElementById("task-cost").value = task.cost;

    document.getElementById("task-assignee").value = task.assignedMemberId || "";
    document.getElementById("task-predecessor").value = task.predecessorId || "";

    document.getElementById("modal-task").classList.add("active");
}

// Open Add Movie Modal resetting values
function openAddMovieModal() {
    document.getElementById("movie-modal-title").textContent = "Yeni Film Ekle";
    document.getElementById("movie-id").value = "";
    document.getElementById("form-movie").reset();
    document.getElementById("modal-movie").classList.add("active");
}

// Open Edit Movie Modal loading values
function openEditMovieModal(id) {
    const movie = movies.find(m => m.id === id);
    if (!movie) return;

    document.getElementById("movie-modal-title").textContent = "Filmi Düzenle";
    document.getElementById("movie-id").value = movie.id;
    document.getElementById("movie-title").value = movie.title;
    document.getElementById("movie-description").value = movie.description;
    document.getElementById("movie-year").value = movie.releaseYear;
    document.getElementById("movie-genre").value = movie.genre;
    document.getElementById("movie-image").value = movie.imageUrl;

    document.getElementById("modal-movie").classList.add("active");
}

// Delete Movie trigger
async function deleteMovie(id) {
    if (!confirm("Bu filmi kütüphaneden silmek istediğinize emin misiniz?")) return;

    try {
        const res = await fetch(`${API_BASE}/Movies/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error("Film silinemedi");

        refreshAllData();
    } catch(err) {
        alert("Hata: " + err.message);
    }
}

// Delete Task trigger
async function deleteTask(id) {
    if (!confirm("Bu görevi silmek istediğinize emin misiniz? Bu göreve bağımlı diğer görevlerin bağımlılıkları sıfırlanacaktır.")) return;

    try {
        const res = await fetch(`${API_BASE}/ProjectTasks/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error("Görev silinemedi");

        refreshAllData();
    } catch(err) {
        alert("Hata: " + err.message);
    }
}

// Delete Member trigger
async function deleteMember(id) {
    if (!confirm("Bu ekip üyesini silmek istediğinize emin misiniz? Atanmış olduğu tüm görevler 'Atanmamış' olarak güncellenecektir.")) return;

    try {
        const res = await fetch(`${API_BASE}/TeamMembers/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error("Ekip üyesi silinemedi");

        refreshAllData();
    } catch(err) {
        alert("Hata: " + err.message);
    }
}

// Currency formatting helper
function formatCurrency(value) {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 2
    }).format(value);
}
