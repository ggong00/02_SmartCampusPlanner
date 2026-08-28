// ===== Smart Campus Planner =====

const STORAGE_KEY    = "smart-campus-planner-todos";
const DARK_KEY       = "smart-campus-planner-dark";
const CATEGORIES_KEY = "smart-campus-planner-categories";
const PRIORITIES_KEY = "smart-campus-planner-priorities";

// ===== 컬러 팔레트 =====
const CATEGORY_PALETTE = [
  { barColor: "#3b82f6", tagBg: "#dbeafe", tagColor: "#1d4ed8" },
  { barColor: "#f97316", tagBg: "#ffedd5", tagColor: "#c2410c" },
  { barColor: "#22c55e", tagBg: "#dcfce7", tagColor: "#15803d" },
  { barColor: "#a855f7", tagBg: "#f3e8ff", tagColor: "#7e22ce" },
  { barColor: "#ec4899", tagBg: "#fce7f3", tagColor: "#9d174d" },
  { barColor: "#14b8a6", tagBg: "#ccfbf1", tagColor: "#115e59" },
  { barColor: "#f59e0b", tagBg: "#fef3c7", tagColor: "#92400e" },
  { barColor: "#6366f1", tagBg: "#eef2ff", tagColor: "#4338ca" },
];

const PRIORITY_PALETTE = [
  { tagBg: "#fee2e2", tagColor: "#b91c1c" },
  { tagBg: "#fef9c3", tagColor: "#a16207" },
  { tagBg: "#f1f5f9", tagColor: "#475569" },
  { tagBg: "#f3e8ff", tagColor: "#7e22ce" },
  { tagBg: "#dcfce7", tagColor: "#15803d" },
  { tagBg: "#fce7f3", tagColor: "#9d174d" },
];

const DEFAULT_CATEGORIES = ["학과", "동아리", "개인"];
const DEFAULT_PRIORITIES  = ["상", "중", "하"];

// ===== 상태 =====
let todos          = loadTodos();
let categories     = loadList(CATEGORIES_KEY, DEFAULT_CATEGORIES);
let priorities     = loadList(PRIORITIES_KEY, DEFAULT_PRIORITIES);
let searchQuery    = "";
let filterCategory = "all";
let filterPriority = "all";
let filterStatus   = "all";
let sortBy         = "created";
let selectedTodoId = null;
let editingTodoId  = null;
let calendarYear   = new Date().getFullYear();
let calendarMonth  = new Date().getMonth();
let isDarkMode     = localStorage.getItem(DARK_KEY) === "true";
let filteredTodos  = [];

// ===== DOM =====
const appEl            = document.getElementById("app");
const searchInput      = document.getElementById("search-input");
const filterCategoryEl = document.getElementById("filter-category");
const filterPriorityEl = document.getElementById("filter-priority");
const filterStatusEl   = document.getElementById("filter-status");
const sortByEl         = document.getElementById("sort-by");
const darkModeBtn      = document.getElementById("dark-mode-btn");
const exportBtn        = document.getElementById("export-btn");
const importInput      = document.getElementById("import-input");
const settingsBtn      = document.getElementById("settings-btn");

const todoForm       = document.getElementById("todo-form");
const titleInput     = document.getElementById("todo-title");
const memoInput      = document.getElementById("todo-memo");
const categorySelect = document.getElementById("todo-category");
const prioritySelect = document.getElementById("todo-priority");
const startDateInput = document.getElementById("todo-start-date");
const deadlineInput  = document.getElementById("todo-deadline");
const toggleFormBtn  = document.getElementById("toggle-form-btn");
const cancelFormBtn  = document.getElementById("cancel-form-btn");

const todoListEl       = document.getElementById("todo-list");
const todoCountEl      = document.getElementById("todo-count");
const emptyMsgEl       = document.getElementById("empty-message");
const progressTextEl   = document.getElementById("progress-text");
const progressBarFillEl = document.getElementById("progress-bar-fill");
const categoryStatsEl  = document.getElementById("category-stats");

const calendarPrevBtn      = document.getElementById("calendar-prev-btn");
const calendarNextBtn      = document.getElementById("calendar-next-btn");
const calendarMonthLabelEl = document.getElementById("calendar-month-label");
const calendarGridEl       = document.getElementById("calendar-grid");

const mainLayoutEl  = document.getElementById("main-layout");
const mobileTabBtns = document.querySelectorAll(".mobile-tab-btn");

// 설정 모달
const settingsModal        = document.getElementById("settings-modal");
const closeSettingsBtn     = document.getElementById("close-settings-btn");
const settingsCategoryList = document.getElementById("settings-category-list");
const settingsPriorityList = document.getElementById("settings-priority-list");
const newCategoryInput     = document.getElementById("new-category-input");
const newPriorityInput     = document.getElementById("new-priority-input");
const addCategoryBtn       = document.getElementById("add-category-btn");
const addPriorityBtn       = document.getElementById("add-priority-btn");

// ===== 저장 / 불러오기 =====
function loadTodos() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function saveTodos() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(todos)); }
  catch (e) { console.error("저장 실패", e); }
}

function loadList(key, defaults) {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return [...defaults];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...defaults];
  } catch { return [...defaults]; }
}

function saveSettings() {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  localStorage.setItem(PRIORITIES_KEY, JSON.stringify(priorities));
}

// ===== 컬러 헬퍼 =====
function getCategoryStyle(name) {
  const idx = categories.indexOf(name);
  return CATEGORY_PALETTE[(idx < 0 ? 0 : idx) % CATEGORY_PALETTE.length];
}

function getPriorityStyle(name) {
  const idx = priorities.indexOf(name);
  return PRIORITY_PALETTE[(idx < 0 ? 0 : idx) % PRIORITY_PALETTE.length];
}

// ===== 드롭다운 동기화 =====
function updateSelectOptions() {
  // 추가 폼 — 카테고리
  const prevCat = categorySelect.value;
  categorySelect.innerHTML = categories
    .map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  categorySelect.value = categories.includes(prevCat) ? prevCat : categories[0];

  // 추가 폼 — 중요도
  const prevPri = prioritySelect.value;
  prioritySelect.innerHTML = priorities
    .map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("");
  if (priorities.includes(prevPri)) {
    prioritySelect.value = prevPri;
  } else {
    prioritySelect.value = priorities[Math.min(1, priorities.length - 1)] || priorities[0];
  }

  // 필터 — 카테고리
  const prevFCat = filterCategoryEl.value;
  filterCategoryEl.innerHTML =
    `<option value="all">전체 카테고리</option>` +
    categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  filterCategoryEl.value = categories.includes(prevFCat) ? prevFCat : "all";

  // 필터 — 중요도
  const prevFPri = filterPriorityEl.value;
  filterPriorityEl.innerHTML =
    `<option value="all">전체 중요도</option>` +
    priorities.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("");
  filterPriorityEl.value = priorities.includes(prevFPri) ? prevFPri : "all";
}

// ===== 유틸 =====
function createId() {
  return `todo-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function formatDate(str) {
  if (!str) return "";
  const [y, m, d] = str.split("-");
  return `${y}.${m}.${d}`;
}

function formatPeriod(start, end) {
  if (start && end) return `${formatDate(start)} ~ ${formatDate(end)}`;
  if (end)   return `${formatDate(end)} 까지`;
  if (start) return `${formatDate(start)} 부터`;
  return "";
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function getDday(deadline) {
  if (!deadline) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due   = new Date(deadline); due.setHours(0, 0, 0, 0);
  return Math.round((due - today) / 86400000);
}

function formatDday(days) {
  if (days === null) return "";
  if (days === 0) return "D-day";
  if (days > 0)  return `D-${days}`;
  return `D+${Math.abs(days)}`;
}

function getDdayClass(days) {
  if (days === null) return "";
  if (days < 0)  return "dday-past";
  if (days === 0) return "dday-today";
  if (days <= 3)  return "dday-soon";
  return "dday-normal";
}

// ===== 필터 & 정렬 =====
function applyFilters() {
  const q = searchQuery.trim().toLowerCase();
  filteredTodos = todos
    .filter(todo => {
      if (filterCategory !== "all" && todo.category !== filterCategory) return false;
      if (filterPriority !== "all" && todo.priority !== filterPriority) return false;
      if (filterStatus === "미완료" && todo.completed)  return false;
      if (filterStatus === "완료"   && !todo.completed) return false;
      if (q) {
        const inTitle = todo.title.toLowerCase().includes(q);
        const inMemo  = (todo.memo || "").toLowerCase().includes(q);
        if (!inTitle && !inMemo) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "deadline") {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.localeCompare(b.deadline);
      }
      if (sortBy === "priority") {
        const order = Object.fromEntries(priorities.map((p, i) => [p, i]));
        return (order[a.priority] ?? 99) - (order[b.priority] ?? 99);
      }
      return (a.createdAt || 0) - (b.createdAt || 0);
    });
}

// ===== 전체 렌더 =====
function renderAll() {
  applyFilters();
  renderList();
  renderCalendar();
  renderProgress();
  renderCategoryStats();
}

// ===== 완료율 =====
function renderProgress() {
  const total = todos.length;
  const done  = todos.filter(t => t.completed).length;
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100);
  progressTextEl.textContent  = `${done} / ${total} 완료 (${pct}%)`;
  progressBarFillEl.style.width = `${pct}%`;
}

// ===== 카테고리별 진행률 =====
function renderCategoryStats() {
  categoryStatsEl.innerHTML = categories.map(cat => {
    const catTodos = todos.filter(t => t.category === cat);
    if (catTodos.length === 0) return "";
    const done = catTodos.filter(t => t.completed).length;
    const pct  = Math.round((done / catTodos.length) * 100);
    const style = getCategoryStyle(cat);
    return `
      <div class="cat-stat">
        <div class="cat-stat-header">
          <span class="tag" style="background:${style.tagBg};color:${style.tagColor}">${escapeHtml(cat)}</span>
          <span class="cat-stat-count">${done} / ${catTodos.length}</span>
        </div>
        <div class="cat-stat-bar-track">
          <div class="cat-stat-bar-fill" style="width:${pct}%;background:${style.barColor}"></div>
        </div>
      </div>`;
  }).join("");
}

// ===== 목록 렌더 =====
function renderList() {
  todoListEl.innerHTML = "";
  if (filteredTodos.length === 0) {
    emptyMsgEl.classList.remove("hidden");
  } else {
    emptyMsgEl.classList.add("hidden");
  }
  filteredTodos.forEach(todo => {
    todoListEl.appendChild(
      editingTodoId === todo.id ? createEditItem(todo) : createTodoItem(todo)
    );
  });
  todoCountEl.textContent = `${filteredTodos.length}개`;
}

function createTodoItem(todo) {
  const li = document.createElement("li");
  const isSelected = todo.id === selectedTodoId;
  li.className = "todo-item"
    + (todo.completed ? " completed" : "")
    + (isSelected    ? " selected"   : "");
  li.dataset.id = todo.id;

  const ddays     = getDday(todo.deadline);
  const ddayText  = formatDday(ddays);
  const ddayClass = getDdayClass(ddays);
  const period    = formatPeriod(todo.startDate, todo.deadline);
  const catStyle  = getCategoryStyle(todo.category);
  const priStyle  = getPriorityStyle(todo.priority);

  li.innerHTML = `
    <label class="todo-checkbox-wrap">
      <input type="checkbox" class="todo-checkbox" data-id="${todo.id}" ${todo.completed ? "checked" : ""} />
    </label>
    <div class="todo-item-main">
      <div class="todo-title-row">
        <span class="todo-title-text">${escapeHtml(todo.title)}</span>
        ${ddayText ? `<span class="dday-badge ${ddayClass}">${ddayText}</span>` : ""}
      </div>
      ${todo.memo ? `<p class="todo-memo">${escapeHtml(todo.memo)}</p>` : ""}
      <div class="todo-tags">
        <span class="tag" style="background:${catStyle.tagBg};color:${catStyle.tagColor}">${escapeHtml(todo.category)}</span>
        <span class="tag" style="background:${priStyle.tagBg};color:${priStyle.tagColor}">중요도 ${escapeHtml(todo.priority)}</span>
        ${period ? `<span class="tag tag-deadline">${period}</span>` : ""}
      </div>
    </div>
    <div class="todo-item-actions">
      <button type="button" class="btn-edit" data-id="${todo.id}" aria-label="수정">✏️</button>
      <button type="button" class="btn-delete" data-id="${todo.id}" aria-label="삭제">삭제</button>
    </div>`;

  li.addEventListener("click", e => {
    if (e.target.closest(".btn-edit,.btn-delete,.todo-checkbox-wrap")) return;
    selectTodo(todo.id);
  });

  return li;
}

function createEditItem(todo) {
  const li = document.createElement("li");
  li.className = "todo-item editing";
  li.dataset.id = todo.id;

  const catOptions = categories.map(c =>
    `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  const priOptions = priorities.map(p =>
    `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("");

  li.innerHTML = `
    <div class="edit-form">
      <input type="text" class="edit-title" placeholder="할 일 제목" />
      <textarea class="edit-memo" rows="2" placeholder="메모 (선택)"></textarea>
      <div class="form-row-inline">
        <select class="edit-category">${catOptions}</select>
        <select class="edit-priority">${priOptions}</select>
      </div>
      <div class="form-row-inline">
        <div class="form-field">
          <label>시작일</label>
          <input type="date" class="edit-start-date" />
        </div>
        <div class="form-field">
          <label>마감일</label>
          <input type="date" class="edit-deadline" />
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn-save-edit btn-submit">저장</button>
        <button type="button" class="btn-cancel-edit btn-cancel">취소</button>
      </div>
    </div>`;

  li.querySelector(".edit-title").value      = todo.title;
  li.querySelector(".edit-memo").value       = todo.memo || "";
  li.querySelector(".edit-category").value   = todo.category;
  li.querySelector(".edit-priority").value   = todo.priority;
  li.querySelector(".edit-start-date").value = todo.startDate || "";
  li.querySelector(".edit-deadline").value   = todo.deadline  || "";

  li.querySelector(".btn-save-edit").addEventListener("click", () => saveEdit(li, todo.id));
  li.querySelector(".btn-cancel-edit").addEventListener("click", () => {
    editingTodoId = null;
    renderList();
  });

  return li;
}

function saveEdit(li, id) {
  const title     = li.querySelector(".edit-title").value.trim();
  const memo      = li.querySelector(".edit-memo").value.trim();
  const category  = li.querySelector(".edit-category").value;
  const priority  = li.querySelector(".edit-priority").value;
  const startDate = li.querySelector(".edit-start-date").value;
  const deadline  = li.querySelector(".edit-deadline").value;

  if (!title) { alert("할 일 제목을 입력해주세요."); return; }
  if (startDate && deadline && startDate > deadline) {
    alert("시작일은 마감일보다 늦을 수 없어요."); return;
  }

  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  Object.assign(todo, { title, memo, category, priority, startDate, deadline });
  editingTodoId = null;
  saveTodos();
  renderAll();
}

// ===== 항목 선택 =====
function selectTodo(id) {
  if (selectedTodoId === id) { selectedTodoId = null; renderAll(); return; }
  selectedTodoId = id;
  const todo = todos.find(t => t.id === id);
  const refDate = todo?.deadline || todo?.startDate;
  if (refDate) {
    const [y, m] = refDate.split("-").map(Number);
    calendarYear = y; calendarMonth = m - 1;
  }
  renderAll();
}

// ===== 달력 =====
function getTodoDateRange(todo) {
  const start = todo.startDate || todo.deadline;
  const end   = todo.deadline  || todo.startDate;
  if (!start || !end) return null;
  return { start, end };
}

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function renderCalendar() {
  calendarMonthLabelEl.textContent = `${calendarYear}년 ${calendarMonth + 1}월`;
  calendarGridEl.innerHTML = "";

  const firstDay     = new Date(calendarYear, calendarMonth, 1);
  const startWeekday = firstDay.getDay();
  const gridStart    = new Date(calendarYear, calendarMonth, 1 - startWeekday);
  const todayKey     = toDateKey(new Date());

  const filteredIds = new Set(filteredTodos.map(t => t.id));
  const datedTodos  = todos
    .filter(t => filteredIds.has(t.id))
    .map(t => ({ todo: t, range: getTodoDateRange(t) }))
    .filter(item => item.range !== null);

  for (let i = 0; i < 42; i++) {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + i);
    const cellKey   = toDateKey(cellDate);
    const isOutside = cellDate.getMonth() !== calendarMonth;
    const isToday   = cellKey === todayKey;

    const todosOnDate = datedTodos.filter(({ range }) =>
      range.start <= cellKey && cellKey <= range.end);
    const hasSelected = todosOnDate.some(({ todo }) => todo.id === selectedTodoId);

    const cell = document.createElement("div");
    cell.className = "calendar-cell"
      + (isOutside   ? " outside-month" : "")
      + (isToday     ? " is-today"      : "")
      + (hasSelected ? " has-selected"  : "");

    const dateNum = document.createElement("div");
    dateNum.className = "calendar-date-number";
    dateNum.textContent = cellDate.getDate();
    cell.appendChild(dateNum);

    const MAX = 3;
    todosOnDate.slice(0, MAX).forEach(({ todo, range }) =>
      cell.appendChild(createCalendarBar(todo, range, cellKey)));

    if (todosOnDate.length > MAX) {
      const more = document.createElement("div");
      more.className = "calendar-more";
      more.textContent = `+${todosOnDate.length - MAX}개`;
      cell.appendChild(more);
    }

    calendarGridEl.appendChild(cell);
  }
}

function createCalendarBar(todo, range, cellKey) {
  const isSingleDay = range.start === range.end;
  const isStart     = cellKey === range.start;
  const isEnd       = cellKey === range.end;
  const isSelected  = todo.id === selectedTodoId;

  let posClass = "bar-middle";
  if (isSingleDay)  posClass = "bar-single";
  else if (isStart) posClass = "bar-start";
  else if (isEnd)   posClass = "bar-end";

  const bar = document.createElement("button");
  bar.type = "button";
  bar.className = `calendar-bar ${posClass}`
    + (todo.completed ? " completed"    : "")
    + (isSelected     ? " bar-selected" : "");
  bar.style.backgroundColor = getCategoryStyle(todo.category).barColor;
  bar.dataset.id = todo.id;
  bar.title = `${todo.title} (${todo.category} · 중요도 ${todo.priority})`;
  bar.textContent = (isStart || isSingleDay) ? todo.title : "";

  if (isStart || isSingleDay) {
    const del = document.createElement("span");
    del.className = "calendar-bar-delete";
    del.textContent = "×";
    del.dataset.id = todo.id;
    del.setAttribute("role", "button");
    del.setAttribute("aria-label", "삭제");
    bar.appendChild(del);
  }

  return bar;
}

// ===== 할 일 조작 =====
function toggleComplete(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  todo.completed = !todo.completed;
  saveTodos(); renderAll();
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  if (selectedTodoId === id) selectedTodoId = null;
  if (editingTodoId  === id) editingTodoId  = null;
  saveTodos(); renderAll();
}

// ===== 추가 폼 =====
function handleAddTodo(e) {
  e.preventDefault();
  const title     = titleInput.value.trim();
  const memo      = memoInput.value.trim();
  const startDate = startDateInput.value;
  const deadline  = deadlineInput.value;

  if (!title) { alert("할 일 제목을 입력해주세요."); titleInput.focus(); return; }
  if (startDate && deadline && startDate > deadline) {
    alert("시작일은 마감일보다 늦을 수 없어요."); startDateInput.focus(); return;
  }

  todos.push({
    id: createId(), title, memo,
    category:  categorySelect.value,
    priority:  prioritySelect.value,
    startDate, deadline,
    completed: false,
    createdAt: Date.now(),
  });

  saveTodos();
  todoForm.reset();
  // 중요도 기본값 재설정 (중간 항목)
  prioritySelect.value = priorities[Math.min(1, priorities.length - 1)] || priorities[0];
  renderAll();
  titleInput.focus();
}

// ===== 다크 모드 =====
function applyDarkMode(dark) {
  appEl.classList.toggle("dark", dark);
  document.body.classList.toggle("dark", dark);
  darkModeBtn.textContent = dark ? "☀️" : "🌙";
  localStorage.setItem(DARK_KEY, dark);
}

// ===== 내보내기 / 가져오기 =====
function exportData() {
  const backup = { todos, categories, priorities };
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `smart-campus-planner-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result);

      // 새 포맷: { todos, categories, priorities }
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && Array.isArray(parsed.todos)) {
        const todoCount = parsed.todos.length;
        const hasSettings = Array.isArray(parsed.categories) && Array.isArray(parsed.priorities);
        const msg = hasSettings
          ? `할 일 ${todoCount}개 + 카테고리/중요도 설정을 가져옵니다.\n현재 데이터를 덮어쓸까요?`
          : `할 일 ${todoCount}개를 가져옵니다.\n현재 데이터를 덮어쓸까요?`;
        if (!confirm(msg)) return;
        todos = parsed.todos;
        if (hasSettings) {
          if (parsed.categories.length > 0) categories = parsed.categories;
          if (parsed.priorities.length > 0) priorities  = parsed.priorities;
          saveSettings();
          updateSelectOptions();
        }
        saveTodos(); renderAll();
      // 이전 포맷: 할 일 배열만
      } else if (Array.isArray(parsed)) {
        if (!confirm(`할 일 ${parsed.length}개를 가져옵니다.\n현재 데이터를 덮어쓸까요?`)) return;
        todos = parsed;
        saveTodos(); renderAll();
      } else {
        throw new Error();
      }
    } catch { alert("파일을 읽을 수 없어요. 올바른 JSON 파일인지 확인해주세요."); }
  };
  reader.readAsText(file);
  importInput.value = "";
}

// ===== 설정 모달 =====
function openSettings() {
  settingsModal.classList.remove("hidden");
  renderSettingsModal();
}

function closeSettings() {
  settingsModal.classList.add("hidden");
}

function renderSettingsModal() {
  renderChipList(settingsCategoryList, categories, CATEGORY_PALETTE, removeCategory);
  renderChipList(settingsPriorityList, priorities, PRIORITY_PALETTE, removePriority);
}

function renderChipList(container, items, palette, removeFn) {
  container.innerHTML = "";
  items.forEach((item, idx) => {
    const color = palette[idx % palette.length];
    const chip = document.createElement("span");
    chip.className = "settings-chip";
    chip.style.background = color.tagBg;
    chip.style.color = color.tagColor;

    const label = document.createTextNode(item + " ");
    const delBtn = document.createElement("button");
    delBtn.className = "chip-delete";
    delBtn.textContent = "×";
    delBtn.setAttribute("aria-label", "삭제");
    delBtn.addEventListener("click", () => removeFn(item));

    chip.appendChild(label);
    chip.appendChild(delBtn);
    container.appendChild(chip);
  });
}

function addCategory() {
  const name = newCategoryInput.value.trim();
  if (!name) return;
  if (categories.includes(name)) { alert("이미 있는 카테고리예요."); return; }
  categories.push(name);
  saveSettings(); updateSelectOptions(); renderSettingsModal(); renderAll();
  newCategoryInput.value = "";
}

function removeCategory(name) {
  if (categories.length <= 1) { alert("카테고리는 최소 1개가 필요해요."); return; }
  categories = categories.filter(c => c !== name);
  saveSettings(); updateSelectOptions(); renderSettingsModal(); renderAll();
}

function addPriority() {
  const name = newPriorityInput.value.trim();
  if (!name) return;
  if (priorities.includes(name)) { alert("이미 있는 중요도예요."); return; }
  priorities.push(name);
  saveSettings(); updateSelectOptions(); renderSettingsModal(); renderAll();
  newPriorityInput.value = "";
}

function removePriority(name) {
  if (priorities.length <= 1) { alert("중요도는 최소 1개가 필요해요."); return; }
  priorities = priorities.filter(p => p !== name);
  saveSettings(); updateSelectOptions(); renderSettingsModal(); renderAll();
}

// ===== 모바일 탭 전환 =====
mobileTabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    mobileTabBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    mainLayoutEl.dataset.tab = btn.dataset.tab;
    if (btn.dataset.tab === "calendar") renderCalendar();
  });
});

// ===== 이벤트 연결 =====
todoForm.addEventListener("submit", handleAddTodo);

toggleFormBtn.addEventListener("click", () => {
  const isHidden = todoForm.classList.toggle("hidden");
  toggleFormBtn.textContent = isHidden ? "+ 할 일 추가" : "− 닫기";
  if (!isHidden) titleInput.focus();
});

cancelFormBtn.addEventListener("click", () => {
  todoForm.classList.add("hidden");
  toggleFormBtn.textContent = "+ 할 일 추가";
  todoForm.reset();
  prioritySelect.value = priorities[Math.min(1, priorities.length - 1)] || priorities[0];
});

searchInput.addEventListener("input", e => { searchQuery = e.target.value; renderAll(); });
filterCategoryEl.addEventListener("change", e => { filterCategory = e.target.value; renderAll(); });
filterPriorityEl.addEventListener("change", e => { filterPriority = e.target.value; renderAll(); });
filterStatusEl.addEventListener("change",   e => { filterStatus   = e.target.value; renderAll(); });
sortByEl.addEventListener("change",         e => { sortBy         = e.target.value; renderAll(); });

darkModeBtn.addEventListener("click", () => { isDarkMode = !isDarkMode; applyDarkMode(isDarkMode); });
exportBtn.addEventListener("click", exportData);
importInput.addEventListener("change", e => importData(e.target.files[0]));

settingsBtn.addEventListener("click", openSettings);
closeSettingsBtn.addEventListener("click", closeSettings);
settingsModal.addEventListener("click", e => { if (e.target === settingsModal) closeSettings(); });

addCategoryBtn.addEventListener("click", addCategory);
addPriorityBtn.addEventListener("click", addPriority);
newCategoryInput.addEventListener("keydown", e => { if (e.key === "Enter") addCategory(); });
newPriorityInput.addEventListener("keydown", e => { if (e.key === "Enter") addPriority(); });

// 목록 이벤트 위임
todoListEl.addEventListener("change", e => {
  if (e.target.classList.contains("todo-checkbox")) toggleComplete(e.target.dataset.id);
});
todoListEl.addEventListener("click", e => {
  if (e.target.classList.contains("btn-delete")) { deleteTodo(e.target.dataset.id); return; }
  if (e.target.classList.contains("btn-edit"))   { editingTodoId = e.target.dataset.id; renderList(); }
});

// 달력 이벤트 위임
calendarGridEl.addEventListener("click", e => {
  if (e.target.classList.contains("calendar-bar-delete")) {
    e.stopPropagation(); deleteTodo(e.target.dataset.id); return;
  }
  const bar = e.target.closest(".calendar-bar");
  if (bar) {
    selectTodo(bar.dataset.id);
    requestAnimationFrame(() => {
      todoListEl.querySelector(`[data-id="${bar.dataset.id}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }
});

calendarPrevBtn.addEventListener("click", () => {
  calendarMonth--;
  if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
  renderCalendar();
});
calendarNextBtn.addEventListener("click", () => {
  calendarMonth++;
  if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
  renderCalendar();
});

// ===== 초기화 =====
applyDarkMode(isDarkMode);
updateSelectOptions();
renderAll();
