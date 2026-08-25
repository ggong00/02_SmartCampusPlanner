// ===== Smart Campus Planner - 5단계: 리스트 ↔ 달력 전환 & 기간 시각화 =====
// 1~4단계(할 일 등록, 완료 체크·삭제·완료율, 새로고침 저장, 시작일~마감일 지정)
// 기능은 모두 그대로 유지하면서, 목록 보기와 달력 보기를 전환하고
// 달력 위에 할 일의 기간을 막대(바) 형태로 보여주는 기능을 추가했습니다.

// localStorage에 데이터를 저장할 때 사용할 key 이름입니다.
const STORAGE_KEY = "smart-campus-planner-todos";

// 화면의 각 요소를 가져옵니다.
const todoForm = document.getElementById("todo-form");
const titleInput = document.getElementById("todo-title");
const categorySelect = document.getElementById("todo-category");
const prioritySelect = document.getElementById("todo-priority");
const startDateInput = document.getElementById("todo-start-date");
const deadlineInput = document.getElementById("todo-deadline");

const todoListEl = document.getElementById("todo-list");
const todoCountEl = document.getElementById("todo-count");
const emptyMessageEl = document.getElementById("empty-message");

const progressTextEl = document.getElementById("progress-text");
const progressBarFillEl = document.getElementById("progress-bar-fill");

// 보기 전환(목록/달력) 관련 요소
const viewToggleButtons = document.querySelectorAll(".view-toggle-btn");
const listViewEl = document.getElementById("list-view");
const calendarViewEl = document.getElementById("calendar-view");

// 달력 보기 관련 요소
const calendarPrevBtn = document.getElementById("calendar-prev-btn");
const calendarNextBtn = document.getElementById("calendar-next-btn");
const calendarMonthLabelEl = document.getElementById("calendar-month-label");
const calendarGridEl = document.getElementById("calendar-grid");
const calendarUndatedEl = document.getElementById("calendar-undated");
const calendarUndatedListEl = document.getElementById("calendar-undated-list");

// 현재 어떤 보기(목록/달력)가 활성화되어 있는지 기억하는 변수입니다.
let currentView = "list";

// 달력에 표시 중인 "년/월"을 기억하는 변수입니다. (오늘 날짜의 년/월로 시작합니다.)
let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth(); // 0(1월) ~ 11(12월)

// 등록된 할 일들을 메모리에 저장해두는 배열입니다.
// 페이지가 열릴 때 localStorage에 저장된 값이 있으면 그 값으로 초기화합니다.
let todos = loadTodos();

// localStorage에서 저장된 할 일 목록을 불러오는 함수입니다.
// 저장된 값이 없거나, 저장된 값이 손상되어 읽을 수 없는 경우에는 빈 배열을 반환합니다.
function loadTodos() {
  try {
    const savedJson = localStorage.getItem(STORAGE_KEY);
    if (!savedJson) {
      return [];
    }
    const parsed = JSON.parse(savedJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("저장된 할 일 목록을 불러오는 중 문제가 발생했습니다.", error);
    return [];
  }
}

// 현재 todos 배열을 localStorage에 저장하는 함수입니다.
// 할 일이 추가/완료체크/삭제되어 todos 배열이 바뀔 때마다 이 함수를 호출합니다.
function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (error) {
    console.error("할 일 목록을 저장하는 중 문제가 발생했습니다.", error);
  }
}

// 할 일 각각을 구분하기 위한 고유 id를 만들어주는 함수입니다.
function createId() {
  return `todo-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// 날짜(YYYY-MM-DD)를 보기 편한 "YYYY.MM.DD" 형식으로 바꿔주는 함수입니다.
function formatDate(dateString) {
  const [year, month, day] = dateString.split("-");
  return `${year}.${month}.${day}`;
}

// 할 일의 시작일/마감일 정보를 화면에 보여줄 문구로 만들어주는 함수입니다.
// - 시작일과 마감일이 모두 있으면: "YYYY.MM.DD ~ YYYY.MM.DD"
// - 마감일만 있으면(기존 방식): "YYYY.MM.DD 까지"
// - 아무 것도 없으면: "마감일 없음"
function formatPeriod(startDate, deadline) {
  if (startDate && deadline) {
    return `${formatDate(startDate)} ~ ${formatDate(deadline)}`;
  }
  if (deadline) {
    return `${formatDate(deadline)} 까지`;
  }
  if (startDate) {
    return `${formatDate(startDate)} 부터`;
  }
  return "마감일 없음";
}

// 사용자가 입력한 텍스트를 안전하게 화면에 표시하기 위해
// <, >, & 같은 특수문자를 이스케이프 처리하는 함수입니다.
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// 할 일 목록(todos 배열)을 실제 화면(HTML)에 그려주는 함수입니다.
function renderTodos() {
  // 목록을 비운 뒤 다시 그립니다.
  todoListEl.innerHTML = "";

  // 등록된 할 일이 하나도 없으면 안내 문구를 보여줍니다.
  if (todos.length === 0) {
    emptyMessageEl.classList.remove("hidden");
  } else {
    emptyMessageEl.classList.add("hidden");
  }

  todos.forEach((todo) => {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.completed ? " completed" : "");
    li.dataset.id = todo.id;

    li.innerHTML = `
      <label class="todo-checkbox-wrap">
        <input
          type="checkbox"
          class="todo-checkbox"
          data-id="${todo.id}"
          ${todo.completed ? "checked" : ""}
        />
      </label>
      <div class="todo-item-main">
        <span class="todo-title-text">${escapeHtml(todo.title)}</span>
        <div class="todo-tags">
          <span class="tag tag-category-${todo.category}">${todo.category}</span>
          <span class="tag tag-priority-${todo.priority}">중요도 ${todo.priority}</span>
          <span class="tag tag-deadline">${formatPeriod(todo.startDate, todo.deadline)}</span>
        </div>
      </div>
      <button type="button" class="btn-delete" data-id="${todo.id}" aria-label="삭제">
        삭제
      </button>
    `;

    todoListEl.appendChild(li);
  });

  // 목록 상단의 "n개" 표시를 갱신합니다.
  todoCountEl.textContent = `${todos.length}개`;

  // 완료율을 다시 계산해서 화면에 반영합니다.
  renderProgress();

  // 달력 보기도 최신 데이터 기준으로 함께 갱신해줍니다.
  // (지금 화면에 보이지 않더라도, 나중에 달력 보기로 전환했을 때 바로 최신 내용이 보이도록 합니다.)
  renderCalendar();
}

// ===== 여기부터는 5단계: 달력 보기 관련 기능입니다 =====

// 할 일 하나의 "실제 표시 기간"을 계산해주는 함수입니다.
// - 시작일과 마감일이 모두 있으면 그대로 사용
// - 마감일만 있으면 시작일=마감일(하루짜리)로 취급
// - 시작일만 있으면 마감일=시작일(하루짜리)로 취급
// - 둘 다 없으면 null을 반환합니다(달력에는 표시할 날짜가 없다는 뜻).
function getTodoDateRange(todo) {
  const start = todo.startDate || todo.deadline;
  const end = todo.deadline || todo.startDate;
  if (!start || !end) {
    return null;
  }
  return { start, end };
}

// Date 객체를 "YYYY-MM-DD" 형식의 문자열로 바꿔주는 함수입니다.
// (input[type="date"]의 값 형식과 동일하게 맞추기 위해 사용합니다.)
function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 달력 보기의 "년/월" 제목을 갱신하는 함수입니다.
function renderCalendarMonthLabel() {
  calendarMonthLabelEl.textContent = `${calendarYear}년 ${calendarMonth + 1}월`;
}

// 이번 달 달력을 그리는 함수입니다.
// 6주(42칸) 고정 격자로 그려서, 어떤 달이든 항상 일관된 모양으로 보이게 합니다.
function renderCalendar() {
  renderCalendarMonthLabel();
  calendarGridEl.innerHTML = "";

  const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1);
  const startWeekday = firstDayOfMonth.getDay(); // 0(일) ~ 6(토)

  // 달력의 첫 칸(이전 달의 날짜가 섞여 들어갈 수 있음)부터 시작합니다.
  const gridStartDate = new Date(calendarYear, calendarMonth, 1 - startWeekday);
  const todayKey = toDateKey(new Date());

  // 날짜가 있는(시작일 또는 마감일이 있는) 할 일만 미리 정리해둡니다.
  const datedTodos = todos
    .map((todo) => ({ todo, range: getTodoDateRange(todo) }))
    .filter((item) => item.range !== null);

  for (let i = 0; i < 42; i += 1) {
    const cellDate = new Date(gridStartDate);
    cellDate.setDate(gridStartDate.getDate() + i);
    renderCalendarCell(cellDate, todayKey, datedTodos);
  }

  renderCalendarUndated();
}

// 달력의 날짜 한 칸을 그려서 달력 그리드에 추가하는 함수입니다.
function renderCalendarCell(cellDate, todayKey, datedTodos) {
  const cellKey = toDateKey(cellDate);
  const isOutsideMonth = cellDate.getMonth() !== calendarMonth;
  const isToday = cellKey === todayKey;

  const cell = document.createElement("div");
  cell.className =
    "calendar-cell" +
    (isOutsideMonth ? " outside-month" : "") +
    (isToday ? " is-today" : "");

  const dateNumberEl = document.createElement("div");
  dateNumberEl.className = "calendar-date-number";
  dateNumberEl.textContent = String(cellDate.getDate());
  cell.appendChild(dateNumberEl);

  // 이 날짜 칸에 걸쳐 있는 할 일들을 찾습니다.
  const todosOnThisDate = datedTodos.filter(
    ({ range }) => range.start <= cellKey && cellKey <= range.end
  );

  // 한 칸에 너무 많은 막대가 쌓이지 않도록 최대 3개까지만 보여주고, 나머지는 "+n개"로 표시합니다.
  const MAX_BARS_PER_CELL = 3;
  todosOnThisDate.slice(0, MAX_BARS_PER_CELL).forEach(({ todo, range }) => {
    cell.appendChild(createCalendarBar(todo, range, cellKey));
  });

  if (todosOnThisDate.length > MAX_BARS_PER_CELL) {
    const moreEl = document.createElement("div");
    moreEl.className = "calendar-more";
    moreEl.textContent = `+${todosOnThisDate.length - MAX_BARS_PER_CELL}개`;
    cell.appendChild(moreEl);
  }

  calendarGridEl.appendChild(cell);
}

// 할 일 하나를 달력의 특정 날짜 칸 위에 표시할 "막대(bar)" 요소를 만들어주는 함수입니다.
// 기간의 시작/중간/끝 위치에 따라 모양(둥근 정도)과 표시 내용을 다르게 만듭니다.
function createCalendarBar(todo, range, cellKey) {
  const isSingleDay = range.start === range.end;
  const isRangeStart = cellKey === range.start;
  const isRangeEnd = cellKey === range.end;

  let positionClass = "bar-middle";
  if (isSingleDay || isRangeStart) {
    positionClass = "bar-start"; // 하루짜리 할 일도 시작 모양(양쪽 둥근 모양)으로 보여줍니다.
  } else if (isRangeEnd) {
    positionClass = "bar-end";
  }

  const bar = document.createElement("button");
  bar.type = "button";
  bar.className =
    `calendar-bar bar-category-${todo.category} ${positionClass}` +
    (todo.completed ? " completed" : "");
  bar.dataset.id = todo.id;
  bar.title = `${todo.title} (${todo.category} · 중요도 ${todo.priority})`;

  // 시작일 칸(또는 하루짜리)에만 할 일 제목 글자를 보여주어, 막대가 이어지는 느낌을 줍니다.
  bar.textContent = isRangeStart || isSingleDay ? todo.title : "";

  // 시작일 칸(또는 하루짜리)에만 삭제(×) 버튼을 함께 보여줍니다.
  if (isRangeStart || isSingleDay) {
    const deleteBtn = document.createElement("span");
    deleteBtn.className = "calendar-bar-delete";
    deleteBtn.textContent = "×";
    deleteBtn.dataset.id = todo.id;
    deleteBtn.setAttribute("role", "button");
    deleteBtn.setAttribute("aria-label", "삭제");
    bar.appendChild(deleteBtn);
  }

  return bar;
}

// 시작일과 마감일이 모두 없는 할 일들을 "날짜가 없는 할 일" 영역에 표시하는 함수입니다.
function renderCalendarUndated() {
  const undatedTodos = todos.filter((todo) => getTodoDateRange(todo) === null);

  calendarUndatedListEl.innerHTML = "";

  if (undatedTodos.length === 0) {
    calendarUndatedEl.classList.add("hidden");
    return;
  }

  calendarUndatedEl.classList.remove("hidden");

  undatedTodos.forEach((todo) => {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.completed ? " completed" : "");
    li.dataset.id = todo.id;

    li.innerHTML = `
      <label class="todo-checkbox-wrap">
        <input
          type="checkbox"
          class="todo-checkbox"
          data-id="${todo.id}"
          ${todo.completed ? "checked" : ""}
        />
      </label>
      <div class="todo-item-main">
        <span class="todo-title-text">${escapeHtml(todo.title)}</span>
        <div class="todo-tags">
          <span class="tag tag-category-${todo.category}">${todo.category}</span>
          <span class="tag tag-priority-${todo.priority}">중요도 ${todo.priority}</span>
        </div>
      </div>
      <button type="button" class="btn-delete" data-id="${todo.id}" aria-label="삭제">
        삭제
      </button>
    `;

    calendarUndatedListEl.appendChild(li);
  });
}

// 전체 완료율을 계산해서 텍스트와 진행 막대에 반영하는 함수입니다.
function renderProgress() {
  const total = todos.length;
  const completedCount = todos.filter((todo) => todo.completed).length;
  const percent = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  progressTextEl.textContent = `${completedCount} / ${total} 완료 (${percent}%)`;
  progressBarFillEl.style.width = `${percent}%`;
}

// 체크박스를 눌러 완료 상태를 토글하는 함수입니다.
function toggleTodoCompleted(id) {
  const todo = todos.find((item) => item.id === id);
  if (!todo) {
    return;
  }
  todo.completed = !todo.completed;
  saveTodos();
  renderTodos();
}

// 삭제 버튼을 눌러 해당 할 일을 목록에서 제거하는 함수입니다.
function deleteTodo(id) {
  todos = todos.filter((item) => item.id !== id);
  saveTodos();
  renderTodos();
}

// 목록 영역 전체에 클릭/변경 이벤트를 한 번만 걸어두고,
// 실제로 어떤 항목이 눌렸는지는 이벤트 대상(target)을 보고 판단합니다.
// (할 일이 새로 추가될 때마다 매번 이벤트를 다시 걸지 않아도 되도록 하기 위함입니다.)
todoListEl.addEventListener("change", (event) => {
  if (event.target.classList.contains("todo-checkbox")) {
    const id = event.target.dataset.id;
    toggleTodoCompleted(id);
  }
});

todoListEl.addEventListener("click", (event) => {
  if (event.target.classList.contains("btn-delete")) {
    const id = event.target.dataset.id;
    deleteTodo(id);
  }
});

// "추가" 버튼을 눌러 폼을 제출했을 때 실행되는 함수입니다.
function handleAddTodo(event) {
  // 폼의 기본 동작(페이지 새로고침)을 막습니다.
  event.preventDefault();

  const title = titleInput.value.trim();
  const startDate = startDateInput.value; // YYYY-MM-DD 문자열 (선택 사항, 비어있을 수 있음)
  const deadline = deadlineInput.value; // YYYY-MM-DD 문자열 (선택 안 하면 빈 문자열)

  // 제목이 비어있으면 등록하지 않고 안내만 합니다.
  if (title === "") {
    alert("할 일 제목을 입력해주세요.");
    titleInput.focus();
    return;
  }

  // 시작일과 마감일이 둘 다 입력되어 있는데, 시작일이 마감일보다 늦은 경우는
  // 잘못된 기간이므로 등록하지 않고 안내합니다.
  if (startDate && deadline && startDate > deadline) {
    alert("시작일은 마감일보다 늦을 수 없어요. 날짜를 다시 확인해주세요.");
    startDateInput.focus();
    return;
  }

  const newTodo = {
    id: createId(),
    title: title,
    category: categorySelect.value, // 학과 / 동아리 / 개인
    priority: prioritySelect.value, // 상 / 중 / 하
    startDate: startDate, // YYYY-MM-DD 형식 문자열 (선택 사항, 없으면 빈 문자열)
    deadline: deadline, // YYYY-MM-DD 형식 문자열 (선택 안 하면 빈 문자열)
    completed: false, // 완료 여부 (기본값: 미완료)
  };

  // 새 할 일을 목록 맨 뒤에 추가합니다.
  todos.push(newTodo);

  // 변경된 목록을 저장하고, 화면을 다시 그립니다.
  saveTodos();
  renderTodos();

  // 입력 폼을 초기화하고 다시 제목 입력창에 포커스를 줍니다.
  todoForm.reset();
  prioritySelect.value = "중"; // 중요도 기본값을 "중"으로 다시 맞춰줍니다.
  titleInput.focus();
}

// 폼 제출 이벤트를 연결합니다.
todoForm.addEventListener("submit", handleAddTodo);

// "목록 보기 / 달력 보기"를 전환하는 함수입니다.
function switchView(view) {
  currentView = view;

  viewToggleButtons.forEach((button) => {
    const isActive = button.dataset.view === view;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  if (view === "calendar") {
    listViewEl.classList.add("hidden");
    calendarViewEl.classList.remove("hidden");
    renderCalendar();
  } else {
    calendarViewEl.classList.add("hidden");
    listViewEl.classList.remove("hidden");
  }
}

// 보기 전환 버튼 클릭 이벤트를 연결합니다.
viewToggleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    switchView(button.dataset.view);
  });
});

// 달력의 이전 달/다음 달 이동 버튼 이벤트를 연결합니다.
calendarPrevBtn.addEventListener("click", () => {
  calendarMonth -= 1;
  if (calendarMonth < 0) {
    calendarMonth = 11;
    calendarYear -= 1;
  }
  renderCalendar();
});

calendarNextBtn.addEventListener("click", () => {
  calendarMonth += 1;
  if (calendarMonth > 11) {
    calendarMonth = 0;
    calendarYear += 1;
  }
  renderCalendar();
});

// 달력의 막대(할 일)를 클릭하면 완료 체크가 토글되도록 하고,
// 막대 위의 × 버튼을 클릭하면 삭제되도록 연결합니다.
calendarGridEl.addEventListener("click", (event) => {
  if (event.target.classList.contains("calendar-bar-delete")) {
    // ×(삭제) 버튼을 눌렀을 때는 완료 토글이 함께 일어나지 않도록 이벤트 전파를 막습니다.
    event.stopPropagation();
    deleteTodo(event.target.dataset.id);
    return;
  }

  const bar = event.target.closest(".calendar-bar");
  if (bar) {
    toggleTodoCompleted(bar.dataset.id);
  }
});

// "날짜가 없는 할 일" 목록에도 완료 체크/삭제 이벤트를 연결합니다.
calendarUndatedListEl.addEventListener("change", (event) => {
  if (event.target.classList.contains("todo-checkbox")) {
    toggleTodoCompleted(event.target.dataset.id);
  }
});

calendarUndatedListEl.addEventListener("click", (event) => {
  if (event.target.classList.contains("btn-delete")) {
    deleteTodo(event.target.dataset.id);
  }
});

// 페이지가 처음 열렸을 때 목록을 한 번 그려줍니다.
// (localStorage에 저장된 할 일이 있다면 여기서 함께 화면에 표시됩니다.)
renderTodos();
