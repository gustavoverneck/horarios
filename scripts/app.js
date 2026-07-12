const STORAGE_KEY = 'planejador-horarios-escolares-v1';
const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
const SHIFT_SLOTS = {
  'Manhã': [
    { key: 'M1', label: '07:00 - 07:50' }, { key: 'M2', label: '07:50 - 08:40' },
    { key: 'M3', label: '08:40 - 09:30' }, { key: 'M4', label: '09:50 - 10:40' },
    { key: 'M5', label: '10:40 - 11:30' }, { key: 'M6', label: '11:30 - 12:20' },
    { key: 'M7', label: '12:20 - 13:10' }
  ],
  'Tarde': [
  { key: '1', label: '13:00 - 13:50' },
  { key: '2', label: '13:50 - 14:40' },
  { key: '3', label: '14:40 - 15:30' },
  { key: '4', label: '15:50 - 16:40' },
  { key: '5', label: '16:40 - 17:30' },
  { key: '6', label: '17:30 - 18:20' },
  { key: '7', label: '18:20 - 19:10' }
  ],
  'Noite': [
    { key: 'N1', label: '18:30 - 19:20' }, { key: 'N2', label: '19:20 - 20:10' },
    { key: 'N3', label: '20:20 - 21:10' }, { key: 'N4', label: '21:10 - 22:00' },
    { key: 'N5', label: '22:00 - 22:50' }
  ]
};
const PERIOD_SLOTS = Object.values(SHIFT_SLOTS).flat();
const PERIOD_KEYS = PERIOD_SLOTS.map((slot) => slot.key);
const SHIFTS = Object.keys(SHIFT_SLOTS);
const AVAIL_STATES = ['free', 'planning', 'forbidden'];
const AVAIL_LABELS = { free: 'Livre', planning: 'Planejamento', forbidden: 'Proibido' };
const DEFAULT_STATE = 'free';
const DEFAULT_SETTINGS = {
  preferDouble: true,
  avoidDouble: false,
  preferFreeDays: true,
  avoidGaps: true,
  allowPlanning: false,
  maxTeacherDaily: 5
};

const state = loadState();
let teacherAvailabilityDraft = createBlankAvailability();
let classAvailabilityDraft = createBlankAvailability();
let editingTeacherId = null;
let editingClassId = null;
let statusMessage = '';
let classPaintState = null;
let teacherPaintState = null;
const subjectTeacherSelection = new Set();
let activeSlot = null;

const els = {
  teacherName: document.getElementById('teacherName'),
  teacherColor: document.getElementById('teacherColor'),
  teacherSubjects: document.getElementById('teacherSubjects'),
  teacherShifts: document.getElementById('teacherShifts'),
  teacherAvailability: document.getElementById('teacherAvailability'),
  teacherSearch: document.getElementById('teacherSearch'),
  teachersList: document.getElementById('teachersList'),
  teachersCount: document.getElementById('teachersCount'),
  teachersVisibleCount: document.getElementById('teachersVisibleCount'),
  teachersPanel: document.getElementById('teachersPanel'),
  btnAddTeacher: document.getElementById('btnAddTeacher'),
  btnClearTeacherForm: document.getElementById('btnClearTeacherForm'),
  className: document.getElementById('className'),
  classShift: document.getElementById('classShift'),
  classGrade: document.getElementById('classGrade'),
  classNotes: document.getElementById('classNotes'),
  classAvailability: document.getElementById('classAvailability'),
  classSearch: document.getElementById('classSearch'),
  classesList: document.getElementById('classesList'),
  classesCount: document.getElementById('classesCount'),
  classesVisibleCount: document.getElementById('classesVisibleCount'),
  classesPanel: document.getElementById('classesPanel'),
  btnAddClass: document.getElementById('btnAddClass'),
  btnClearClassForm: document.getElementById('btnClearClassForm'),
  subjectClass: document.getElementById('subjectClass'),
  subjectName: document.getElementById('subjectName'),
  subjectWeekly: document.getElementById('subjectWeekly'),
  subjectClassLoad: document.getElementById('subjectClassLoad'),
  subjectTeachersPicker: document.getElementById('subjectTeachersPicker'),
  selectedTeachersCount: document.getElementById('selectedTeachersCount'),
  btnAddSubject: document.getElementById('btnAddSubject'),
  scheduleClass: document.getElementById('scheduleClass'),
  scheduleDay: document.getElementById('scheduleDay'),
  schedulePeriod: document.getElementById('schedulePeriod'),
  scheduleSubject: document.getElementById('scheduleSubject'),
  scheduleTeacher: document.getElementById('scheduleTeacher'),
  btnAddAllocation: document.getElementById('btnAddAllocation'),
  btnAutoAllocate: document.getElementById('btnAutoAllocate'),
  btnAnalyzeSchedule: document.getElementById('btnAnalyzeSchedule'),
  btnAutoSuggest: document.getElementById('btnAutoSuggest'),
  btnClearAllocations: document.getElementById('btnClearAllocations'),
  allocationWarning: document.getElementById('allocationWarning'),
  diagnosticPanel: document.getElementById('diagnosticPanel'),
  scheduleTable: document.getElementById('scheduleTable'),
  teachersExportTable: document.getElementById('teachersExportTable'),
  daysExportTable: document.getElementById('daysExportTable'),
  slotModal: document.getElementById('slotModal'),
  slotModalTitle: document.getElementById('slotModalTitle'),
  slotModalContext: document.getElementById('slotModalContext'),
  slotSubject: document.getElementById('slotSubject'),
  slotTeacher: document.getElementById('slotTeacher'),
  slotLocked: document.getElementById('slotLocked'),
  slotModalWarning: document.getElementById('slotModalWarning'),
  btnCloseSlotModal: document.getElementById('btnCloseSlotModal'),
  btnCancelSlot: document.getElementById('btnCancelSlot'),
  btnSaveSlot: document.getElementById('btnSaveSlot'),
  btnRemoveSlot: document.getElementById('btnRemoveSlot'),
  allocationsCount: document.getElementById('allocationsCount'),
  btnSaveAll: document.getElementById('btnSaveAll'),
  btnExportJson: document.getElementById('btnExportJson'),
  btnImportJson: document.getElementById('btnImportJson'),
  btnResetAll: document.getElementById('btnResetAll'),
  fileImport: document.getElementById('fileImport'),
  btnLoadExample: document.getElementById('btnLoadExample'),
  preferDouble: document.getElementById('preferDouble'),
  avoidDouble: document.getElementById('avoidDouble'),
  preferFreeDays: document.getElementById('preferFreeDays'),
  avoidGaps: document.getElementById('avoidGaps'),
  allowPlanning: document.getElementById('allowPlanning'),
  maxTeacherDaily: document.getElementById('maxTeacherDaily'),
  metricTeachers: document.getElementById('metricTeachers'),
  metricClasses: document.getElementById('metricClasses'),
  metricRequired: document.getElementById('metricRequired'),
  metricAllocated: document.getElementById('metricAllocated'),
  metricCoverage: document.getElementById('metricCoverage'),
  tabTeachersCount: document.getElementById('tabTeachersCount'),
  tabClassesCount: document.getElementById('tabClassesCount'),
  tabCoverage: document.getElementById('tabCoverage'),
  btnExportTeachersHtml: document.getElementById('btnExportTeachersHtml'),
  btnCopyTeachersHtml: document.getElementById('btnCopyTeachersHtml'),
  btnExportTeachersCsv: document.getElementById('btnExportTeachersCsv'),
  btnExportDaysHtml: document.getElementById('btnExportDaysHtml'),
  btnCopyDaysHtml: document.getElementById('btnCopyDaysHtml'),
  btnExportDaysCsv: document.getElementById('btnExportDaysCsv')
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { teachers: [], classes: [], allocations: [], settings: { ...DEFAULT_SETTINGS } };
    const parsed = JSON.parse(raw);
    return {
      teachers: Array.isArray(parsed.teachers) ? parsed.teachers : [],
      classes: Array.isArray(parsed.classes) ? parsed.classes : [],
      allocations: Array.isArray(parsed.allocations) ? parsed.allocations : [],
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) }
    };
  } catch (error) {
    return { teachers: [], classes: [], allocations: [], settings: { ...DEFAULT_SETTINGS } };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderAll();
}

function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

function getPeriodSlot(periodKey) {
  return PERIOD_SLOTS.find((slot) => slot.key === String(periodKey));
}

function getPeriodLabel(periodKey) {
  return getPeriodSlot(periodKey)?.label || String(periodKey);
}

function getShiftPeriodKeys(shift) {
  return (SHIFT_SLOTS[shift] || []).map((slot) => slot.key);
}

function getShiftForPeriod(periodKey) {
  return SHIFTS.find((shift) => SHIFT_SLOTS[shift].some((slot) => slot.key === String(periodKey))) || 'Tarde';
}

function getPeriodIndex(periodKey) {
  return getShiftPeriodKeys(getShiftForPeriod(periodKey)).indexOf(String(periodKey));
}

function getTeacherPeriodKeys(teacher) {
  return (teacher.shifts || ['Tarde']).flatMap(getShiftPeriodKeys);
}

function getSelectedTeacherShifts() {
  return [...els.teacherShifts.querySelectorAll('input:checked')].map((input) => input.value);
}

function createBlankAvailability(source = {}) {
  const availability = {};
  DAYS.forEach((day) => {
    availability[day] = {};
    PERIOD_KEYS.forEach((period) => {
      availability[day][period] = source?.[day]?.[period] || DEFAULT_STATE;
    });
  });
  return availability;
}

function normalizeTeacher(teacher) {
  return {
    id: teacher.id || uid('teacher'),
    name: teacher.name || '',
    color: teacher.color || '#0f766e',
    subjects: Array.isArray(teacher.subjects) ? unique(teacher.subjects.map(String).map((item) => item.trim()).filter(Boolean)) : [],
    shifts: Array.isArray(teacher.shifts) && teacher.shifts.length ? teacher.shifts.filter((shift) => SHIFTS.includes(shift)) : ['Tarde'],
    availability: createBlankAvailability(teacher.availability)
  };
}

function normalizeClass(room) {
  return {
    id: room.id || uid('class'),
    name: room.name || '',
    shift: room.shift || 'Manhã',
    grade: room.grade || '',
    notes: room.notes || '',
    availability: createBlankAvailability(room.availability),
    subjects: Array.isArray(room.subjects) ? room.subjects.map((subject) => ({
      id: subject.id || uid('subject'),
      name: subject.name || '',
      weekly: Number(subject.weekly || 0),
      teacherIds: Array.isArray(subject.teacherIds) ? subject.teacherIds : []
    })) : []
  };
}

function setMessage(target, text, visible = true) {
  target.textContent = text;
  target.classList.toggle('hidden', !visible);
}

function clearTeacherForm() {
  els.teacherName.value = '';
  els.teacherColor.value = '#0f766e';
  els.teacherSubjects.value = '';
  els.teacherShifts.querySelectorAll('input').forEach((input) => { input.checked = input.value === 'Tarde'; });
  editingTeacherId = null;
  teacherAvailabilityDraft = createBlankAvailability();
  renderTeacherAvailabilityEditor();
  updateTeacherFormButton();
}

function clearClassForm() {
  els.className.value = '';
  els.classShift.value = 'Manhã';
  els.classGrade.value = '';
  els.classNotes.value = '';
  editingClassId = null;
  classAvailabilityDraft = createBlankAvailability();
  renderClassAvailabilityEditor();
  updateClassFormButton();
}

function renderClassAvailabilityEditor() {
  els.classAvailability.innerHTML = '';
  const corner = document.createElement('div');
  corner.className = 'agenda-corner';
  corner.textContent = 'Horário';
  els.classAvailability.appendChild(corner);

  DAYS.forEach((day) => {
    const header = document.createElement('button');
    header.type = 'button';
    header.className = 'agenda-day';
    header.innerHTML = `${escapeHtml(day)}<small>Selecionar dia</small>`;
    header.addEventListener('click', () => {
      const visiblePeriods = getShiftPeriodKeys(els.classShift.value);
      const hasBlocked = visiblePeriods.some((period) => classAvailabilityDraft[day][period] === 'forbidden');
      visiblePeriods.forEach((period) => { classAvailabilityDraft[day][period] = hasBlocked ? 'free' : 'forbidden'; });
      renderClassAvailabilityEditor();
    });
    els.classAvailability.appendChild(header);
  });

  getShiftPeriodKeys(els.classShift.value).forEach((period) => {
    const [start, end] = getPeriodLabel(period).split(' - ');
    const time = document.createElement('div');
    time.className = 'agenda-time';
    time.innerHTML = `${escapeHtml(start)}<small>até ${escapeHtml(end)}</small>`;
    els.classAvailability.appendChild(time);
    DAYS.forEach((day) => {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'agenda-cell';
      const updateCell = (nextState) => {
        classAvailabilityDraft[day][period] = nextState;
        cell.dataset.state = nextState;
        cell.setAttribute('aria-label', `${day}, ${getPeriodLabel(period)}: ${nextState === 'free' ? 'disponível' : 'indisponível'}`);
        cell.setAttribute('aria-pressed', String(nextState === 'free'));
      };
      updateCell(classAvailabilityDraft[day][period] === 'forbidden' ? 'forbidden' : 'free');
      cell.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        classPaintState = cell.dataset.state === 'free' ? 'forbidden' : 'free';
        updateCell(classPaintState);
      });
      cell.addEventListener('pointerenter', () => {
        if (classPaintState) updateCell(classPaintState);
      });
      cell.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        updateCell(cell.dataset.state === 'free' ? 'forbidden' : 'free');
      });
      els.classAvailability.appendChild(cell);
    });
  });
}

function renderTeacherAvailabilityEditor() {
  els.teacherAvailability.innerHTML = '';
  const corner = document.createElement('div');
  corner.className = 'agenda-corner';
  corner.textContent = 'Horário';
  els.teacherAvailability.appendChild(corner);

  DAYS.forEach((day) => {
    const header = document.createElement('button');
    header.type = 'button';
    header.className = 'agenda-day';
    header.innerHTML = `${escapeHtml(day)}<small>Alterar dia</small>`;
    header.addEventListener('click', () => {
      const visiblePeriods = getSelectedTeacherShifts().flatMap(getShiftPeriodKeys);
      const states = visiblePeriods.map((period) => teacherAvailabilityDraft[day][period]);
      const next = states.every((value) => value === 'free')
        ? 'planning'
        : states.every((value) => value === 'planning') ? 'forbidden' : 'free';
      visiblePeriods.forEach((period) => { teacherAvailabilityDraft[day][period] = next; });
      renderTeacherAvailabilityEditor();
    });
    els.teacherAvailability.appendChild(header);
  });

  const visiblePeriods = getSelectedTeacherShifts().flatMap(getShiftPeriodKeys);
  if (!visiblePeriods.length) {
    const empty = document.createElement('div');
    empty.className = 'agenda-no-shift';
    empty.textContent = 'Selecione ao menos um turno para configurar a disponibilidade.';
    els.teacherAvailability.appendChild(empty);
    return;
  }
  visiblePeriods.forEach((period) => {
    const [start, end] = getPeriodLabel(period).split(' - ');
    const time = document.createElement('div');
    time.className = 'agenda-time';
    time.innerHTML = `${escapeHtml(start)}<small>${escapeHtml(getShiftForPeriod(period))} · até ${escapeHtml(end)}</small>`;
    els.teacherAvailability.appendChild(time);
    DAYS.forEach((day) => {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'agenda-cell';
      const updateCell = (nextState) => {
        teacherAvailabilityDraft[day][period] = nextState;
        cell.dataset.state = nextState;
        cell.setAttribute('aria-label', `${day}, ${getPeriodLabel(period)}: ${AVAIL_LABELS[nextState]}`);
      };
      updateCell(teacherAvailabilityDraft[day][period] || DEFAULT_STATE);
      const getNextState = () => AVAIL_STATES[(AVAIL_STATES.indexOf(cell.dataset.state) + 1) % AVAIL_STATES.length];
      cell.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        teacherPaintState = getNextState();
        updateCell(teacherPaintState);
      });
      cell.addEventListener('pointerenter', () => {
        if (teacherPaintState) updateCell(teacherPaintState);
      });
      cell.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        updateCell(getNextState());
      });
      els.teacherAvailability.appendChild(cell);
    });
  });
}

function renderReadonlyTeacherAgenda(container, availability) {
  container.innerHTML = '';
  const corner = document.createElement('div');
  corner.className = 'agenda-corner';
  corner.textContent = 'Horário';
  container.appendChild(corner);
  DAYS.forEach((day) => {
    const header = document.createElement('div');
    header.className = 'agenda-day readonly';
    header.textContent = day;
    container.appendChild(header);
  });
  const teacher = state.teachers.find((item) => item.availability === availability);
  getTeacherPeriodKeys(teacher || { shifts: ['Tarde'] }).forEach((period) => {
    const [start, end] = getPeriodLabel(period).split(' - ');
    const time = document.createElement('div');
    time.className = 'agenda-time';
    time.innerHTML = `${escapeHtml(start)}<small>${escapeHtml(getShiftForPeriod(period))} · até ${escapeHtml(end)}</small>`;
    container.appendChild(time);
    DAYS.forEach((day) => {
      const availabilityState = availability?.[day]?.[period] || DEFAULT_STATE;
      const cell = document.createElement('div');
      cell.className = 'agenda-cell readonly';
      cell.dataset.state = availabilityState;
      cell.title = `${day}, ${getPeriodLabel(period)}: ${AVAIL_LABELS[availabilityState]}`;
      container.appendChild(cell);
    });
  });
}

function renderTeacherCards() {
  const query = (els.teacherSearch.value || '').trim().toLowerCase();
  const filteredTeachers = state.teachers.filter((teacher) => matchesTeacherSearch(teacher, query));
  els.teachersVisibleCount.textContent = `${filteredTeachers.length} visíveis`;
  els.teachersList.innerHTML = '';
  els.teachersCount.textContent = `${state.teachers.length} professor${state.teachers.length === 1 ? '' : 'es'}`;
  if (!state.teachers.length) {
    els.teachersList.innerHTML = '<div class="notice">Nenhum professor cadastrado ainda.</div>';
    return;
  }
  if (!filteredTeachers.length) {
    els.teachersList.innerHTML = '<div class="notice">Nenhum professor encontrado para a busca.</div>';
    return;
  }
  filteredTeachers.forEach((teacher) => {
    const item = document.createElement('div');
    item.className = 'item';
    const teacherPeriods = getTeacherPeriodKeys(teacher);
    const freeCount = countAvailability(teacher.availability, 'free', teacherPeriods);
    const planningCount = countAvailability(teacher.availability, 'planning', teacherPeriods);
    const forbiddenCount = countAvailability(teacher.availability, 'forbidden', teacherPeriods);
    const teaching = teacher.subjects;
    item.innerHTML = `
      <div class="item-top">
        <div>
          <div class="item-title">${escapeHtml(teacher.name)}</div>
          <div class="item-subtitle">${escapeHtml(teacher.shifts.join(' · '))} • ${freeCount} livres, ${planningCount} planejamento, ${forbiddenCount} proibidos</div>
        </div>
        <div class="btn-row" style="margin-top:0;">
          <button class="ghost" data-action="edit">Editar</button>
          <button class="ghost" data-action="duplicate">Duplicar</button>
          <button class="danger" data-action="delete">Excluir</button>
        </div>
      </div>
      <div class="chips">
        <span class="chip" style="background:${teacher.color}18;color:${teacher.color};border-color:${teacher.color}33;">${escapeHtml(teacher.name)}</span>
        ${unique(teaching).map((item) => `<span class="chip green">${escapeHtml(item)}</span>`).join('') || '<span class="chip">Sem disciplinas definidas</span>'}
      </div>
      <div class="weekly-agenda-wrap compact-agenda-wrap">
        <div class="weekly-agenda compact-agenda availability"></div>
      </div>
    `;
    const availabilityWrap = item.querySelector('.availability');
    renderReadonlyTeacherAgenda(availabilityWrap, teacher.availability);
    item.querySelector('[data-action="delete"]').addEventListener('click', () => deleteTeacher(teacher.id));
    item.querySelector('[data-action="edit"]').addEventListener('click', () => editTeacher(teacher.id));
    item.querySelector('[data-action="duplicate"]').addEventListener('click', () => duplicateTeacher(teacher.id));
    els.teachersList.appendChild(item);
  });
}

function updateTeacherFormButton() {
  els.btnAddTeacher.textContent = editingTeacherId ? 'Salvar professor' : 'Adicionar professor';
}

function updateClassFormButton() {
  els.btnAddClass.textContent = editingClassId ? 'Salvar turma' : 'Adicionar turma';
}

function renderClassCards() {
  const query = (els.classSearch.value || '').trim().toLowerCase();
  const filteredClasses = state.classes.filter((room) => matchesClassSearch(room, query));
  els.classesVisibleCount.textContent = `${filteredClasses.length} visíveis`;
  els.classesList.innerHTML = '';
  els.classesCount.textContent = `${state.classes.length} turma${state.classes.length === 1 ? '' : 's'}`;
  if (!state.classes.length) {
    els.classesList.innerHTML = '<div class="notice">Nenhuma turma cadastrada ainda.</div>';
    return;
  }
  if (!filteredClasses.length) {
    els.classesList.innerHTML = '<div class="notice">Nenhuma turma encontrada para a busca.</div>';
    return;
  }
  filteredClasses.forEach((room) => {
    const item = document.createElement('div');
    item.className = 'item';
    const curriculumRows = room.subjects.length
      ? room.subjects.map((subject) => {
          const teachers = subject.teacherIds.map((id) => getTeacherById(id)).filter(Boolean);
          const teacherContent = teachers.length ? teachers.map((teacher) => `<span class="subject-teacher"><i style="--teacher-color:${escapeHtml(teacher.color)}"></i>${escapeHtml(teacher.name)}</span>`).join('') : '<span class="subject-unassigned">Professor não definido</span>';
          return `<div class="curriculum-row"><div class="subject-main"><strong>${escapeHtml(subject.name)}</strong><div class="subject-teachers">${teacherContent}</div></div><span class="weekly-load"><strong>${Number(subject.weekly || 0)}</strong> aulas/semana</span><button class="icon-button danger-soft" data-delete-subject="${escapeHtml(subject.id)}" title="Remover disciplina" aria-label="Remover ${escapeHtml(subject.name)}">×</button></div>`;
        }).join('')
      : '<div class="curriculum-empty">Nenhuma disciplina adicionada à grade.</div>';
    const availableSlots = countAvailability(room.availability, 'free', getShiftPeriodKeys(room.shift));
    const weeklyTotal = room.subjects.reduce((sum, subject) => sum + Number(subject.weekly || 0), 0);
    item.innerHTML = `
      <div class="item-top">
        <div>
          <div class="item-title">${escapeHtml(room.name)}</div>
          <div class="item-subtitle">${escapeHtml(room.shift)} ${room.grade ? '• ' + escapeHtml(room.grade) : ''} • ${availableSlots} horários disponíveis</div>
        </div>
        <div class="btn-row" style="margin-top:0;">
          <button class="ghost" data-action="edit">Editar</button>
          <button class="ghost" data-action="duplicate">Duplicar</button>
          <button class="danger" data-action="delete">Excluir</button>
        </div>
      </div>
      <div class="curriculum-summary">
        <div class="curriculum-heading"><div><strong>Grade curricular</strong><span>${room.subjects.length} componente${room.subjects.length === 1 ? '' : 's'}</span></div><div class="total-load"><strong>${weeklyTotal}</strong><span>aulas semanais</span></div></div>
        <div class="curriculum-list">${curriculumRows}</div>
      </div>
      ${room.notes ? `<div class="notice" style="margin-top:10px;">${escapeHtml(room.notes)}</div>` : ''}
    `;
    item.querySelector('[data-action="delete"]').addEventListener('click', () => deleteClass(room.id));
    item.querySelector('[data-action="edit"]').addEventListener('click', () => editClass(room.id));
    item.querySelector('[data-action="duplicate"]').addEventListener('click', () => duplicateClass(room.id));
    item.querySelectorAll('[data-delete-subject]').forEach((button) => button.addEventListener('click', () => deleteSubject(room.id, button.dataset.deleteSubject)));
    els.classesList.appendChild(item);
  });
}

function deleteSubject(classId, subjectId) {
  const room = getClassById(classId);
  const subject = room?.subjects.find((item) => item.id === subjectId);
  if (!room || !subject || !confirm(`Remover ${subject.name} da grade de ${room.name}?`)) return;
  room.subjects = room.subjects.filter((item) => item.id !== subjectId);
  state.allocations = state.allocations.filter((allocation) => !(allocation.classId === classId && allocation.subjectId === subjectId));
  saveState();
}

function renderDropdowns() {
  fillSelect(els.subjectClass, state.classes.map((room) => ({ value: room.id, label: room.name })));
  fillSelect(els.scheduleClass, state.classes.map((room) => ({ value: room.id, label: room.name })));
  fillSelect(els.scheduleDay, DAYS.map((day) => ({ value: day, label: day })));
  updateSchedulePeriodOptions();
  renderSubjectTeacherPicker();
  updateSubjectClassLoad();
  updateSubjectOptions();
  updateTeacherOptions();
}

function updateSchedulePeriodOptions() {
  const room = getClassById(els.scheduleClass.value) || state.classes[0];
  const slots = SHIFT_SLOTS[room?.shift] || SHIFT_SLOTS.Tarde;
  fillSelect(els.schedulePeriod, slots.map((slot) => ({ value: slot.key, label: slot.label })));
}

function fillSelect(select, items) {
  const current = select.value;
  select.innerHTML = '';
  items.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.value;
    option.textContent = item.label;
    select.appendChild(option);
  });
  if (items.some((item) => item.value === current)) select.value = current;
}

function renderSubjectTeacherPicker() {
  const validTeacherIds = new Set(state.teachers.map((teacher) => teacher.id));
  [...subjectTeacherSelection].forEach((id) => { if (!validTeacherIds.has(id)) subjectTeacherSelection.delete(id); });
  const subjectName = (els.subjectName.value || '').trim().toLocaleLowerCase('pt-BR');
  const teachers = state.teachers.slice().sort((a, b) => {
    const aMatch = a.subjects.some((name) => name.trim().toLocaleLowerCase('pt-BR') === subjectName);
    const bMatch = b.subjects.some((name) => name.trim().toLocaleLowerCase('pt-BR') === subjectName);
    return Number(bMatch) - Number(aMatch) || a.name.localeCompare(b.name);
  });
  els.subjectTeachersPicker.innerHTML = '';
  if (!teachers.length) {
    els.subjectTeachersPicker.innerHTML = '<div class="picker-empty">Cadastre professores antes de definir os responsáveis pela disciplina.</div>';
  } else teachers.forEach((teacher) => {
    const recommended = subjectName && teacher.subjects.some((name) => name.trim().toLocaleLowerCase('pt-BR') === subjectName);
    const label = document.createElement('label');
    label.className = `teacher-option${recommended ? ' recommended' : ''}`;
    label.innerHTML = `<input type="checkbox" value="${escapeHtml(teacher.id)}" ${subjectTeacherSelection.has(teacher.id) ? 'checked' : ''}><i style="--teacher-color:${escapeHtml(teacher.color)}"></i><span><strong>${escapeHtml(teacher.name)}</strong><small>${escapeHtml(teacher.subjects.join(' · ') || 'Sem disciplinas informadas')}</small></span>${recommended ? '<em>Recomendado</em>' : ''}`;
    label.querySelector('input').addEventListener('change', (event) => {
      if (event.target.checked) subjectTeacherSelection.add(teacher.id);
      else subjectTeacherSelection.delete(teacher.id);
      label.classList.toggle('selected', event.target.checked);
      updateSelectedTeachersCount();
    });
    label.classList.toggle('selected', subjectTeacherSelection.has(teacher.id));
    els.subjectTeachersPicker.appendChild(label);
  });
  updateSelectedTeachersCount();
}

function updateSelectedTeachersCount() {
  const count = subjectTeacherSelection.size;
  els.selectedTeachersCount.textContent = `${count} selecionado${count === 1 ? '' : 's'}`;
}

function updateSubjectClassLoad() {
  const room = getClassById(els.subjectClass.value);
  const total = room?.subjects.reduce((sum, subject) => sum + Number(subject.weekly || 0), 0) || 0;
  els.subjectClassLoad.innerHTML = `<strong>${total}</strong><span>aulas semanais</span>`;
}

function updateSubjectOptions() {
  const classId = els.scheduleClass.value || state.classes[0]?.id;
  const room = state.classes.find((item) => item.id === classId);
  const current = els.scheduleSubject.value;
  els.scheduleSubject.innerHTML = '';
  if (!room || !room.subjects.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Cadastre disciplinas para esta turma';
    els.scheduleSubject.appendChild(option);
    updateTeacherOptions();
    return;
  }
  room.subjects.forEach((subject) => {
    const option = document.createElement('option');
    option.value = subject.id;
    option.textContent = `${subject.name} (${subject.weekly} aulas)`;
    els.scheduleSubject.appendChild(option);
  });
  if (room.subjects.some((subject) => subject.id === current)) els.scheduleSubject.value = current;
  updateTeacherOptions();
}

function updateTeacherOptions() {
  const classId = els.scheduleClass.value || state.classes[0]?.id;
  const room = state.classes.find((item) => item.id === classId);
  const subject = room?.subjects.find((item) => item.id === els.scheduleSubject.value);
  const current = els.scheduleTeacher.value;
  els.scheduleTeacher.innerHTML = '';
  const candidates = subject
    ? getCandidateTeacherIds(subject).map((id) => getTeacherById(id)).filter(Boolean)
    : state.teachers;
  const shiftCandidates = candidates.filter((teacher) => !room || teacher.shifts.includes(room.shift));
  if (!shiftCandidates.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Nenhum professor designado para esta disciplina';
    els.scheduleTeacher.appendChild(option);
    return;
  }
  shiftCandidates.forEach((teacher) => {
    const option = document.createElement('option');
    option.value = teacher.id;
    option.textContent = teacher.name;
    els.scheduleTeacher.appendChild(option);
  });
  if (shiftCandidates.some((teacher) => teacher.id === current)) els.scheduleTeacher.value = current;
}

function renderScheduleTable() {
  els.allocationsCount.textContent = `${state.allocations.length} alocaç${state.allocations.length === 1 ? 'ão' : 'ões'}`;
  if (!state.classes.length) {
    els.scheduleTable.innerHTML = '<tr><td>Nenhuma turma cadastrada.</td></tr>';
    return;
  }
  const room = state.classes.find((item) => item.id === els.scheduleClass.value) || state.classes[0];
  const roomSlots = SHIFT_SLOTS[room.shift] || SHIFT_SLOTS.Tarde;
  const roomPeriodKeys = roomSlots.map((slot) => slot.key);
  const allocationsByKey = new Map(
    state.allocations
      .filter((allocation) => allocation.classId === room.id)
      .map((allocation) => [`${allocation.day}-${allocation.period}`, allocation])
  );
  const header = ['Dia', ...roomSlots.map((slot) => slot.label), 'Ações'];
  let html = '<thead><tr>' + header.map((value) => `<th>${escapeHtml(value)}</th>`).join('') + '</tr></thead><tbody>';
  DAYS.forEach((day) => {
    html += `<tr><th>${escapeHtml(day)}</th>`;
    roomPeriodKeys.forEach((period) => {
      const allocation = allocationsByKey.get(`${day}-${period}`);
      if (!allocation) {
        html += `<td class="calendar-table-cell empty" data-slot="true" data-day="${escapeHtml(day)}" data-period="${escapeHtml(period)}"><span>＋</span></td>`;
        return;
      }
      const teacher = getTeacherById(allocation.teacherId);
      const color = teacher?.color || '#6b7280';
      html += `<td class="calendar-table-cell occupied" data-slot="true" data-day="${escapeHtml(day)}" data-period="${escapeHtml(period)}"><div class="lesson-block ${allocation.locked ? 'fixed' : ''}" style="--lesson-color:${escapeHtml(color)}"><strong>${escapeHtml(allocation.subjectName)}</strong><span>${teacher ? escapeHtml(teacher.name) : 'Professor removido'}</span></div></td>`;
    });
    html += `<td><button class="ghost" data-clear="${day}">Limpar linha</button></td>`;
    html += '</tr>';
  });
  html += '</tbody>';
  els.scheduleTable.innerHTML = html;
  els.scheduleTable.querySelectorAll('[data-clear]').forEach((button) => {
    button.addEventListener('click', () => clearDayAllocations(room.id, button.dataset.clear));
  });
  els.scheduleTable.querySelectorAll('[data-slot]').forEach((cell) => {
    cell.addEventListener('click', () => openSlotModal(room.id, cell.dataset.day, cell.dataset.period));
  });
}

function renderTeachersExport() {
  const header = ['Professor', ...DAYS.map((day) => day)];
  let html = '<thead><tr>' + header.map((value) => `<th>${escapeHtml(value)}</th>`).join('') + '</tr></thead><tbody>';
  if (!state.teachers.length) {
    html += '<tr><td colspan="6">Sem professores cadastrados.</td></tr>';
  } else {
    state.teachers.forEach((teacher) => {
      html += `<tr><th>${escapeHtml(teacher.name)}</th>`;
      DAYS.forEach((day) => {
        const rows = state.allocations
          .filter((allocation) => allocation.teacherId === teacher.id && allocation.day === day)
          .sort(compareAllocations);
        const content = rows.length
          ? rows.map((allocation) => `<div class="export-lesson"><strong>${escapeHtml(getPeriodLabel(allocation.period))}</strong><span>${escapeHtml(allocation.className)} · ${escapeHtml(allocation.subjectName)}</span></div>`).join('')
          : '<span class="empty-mark">—</span>';
        html += `<td class="calendar-table-cell ${rows.length ? 'occupied' : 'empty'}">${content}</td>`;
      });
      html += '</tr>';
    });
  }
  html += '</tbody>';
  els.teachersExportTable.innerHTML = html;
}

function renderDaysExport() {
  const header = ['Dia', 'Professores', 'Turmas/disciplinas'];
  let html = '<thead><tr>' + header.map((value) => `<th>${escapeHtml(value)}</th>`).join('') + '</tr></thead><tbody>';
  DAYS.forEach((day) => {
    const allocations = state.allocations.filter((allocation) => allocation.day === day).sort(compareAllocations);
    const teachers = unique(allocations.map((allocation) => getTeacherById(allocation.teacherId)?.name).filter(Boolean));
    const classes = allocations.map((allocation) => `${escapeHtml(getPeriodLabel(allocation.period))} • ${escapeHtml(allocation.className)} • ${escapeHtml(allocation.subjectName)}`).join('<br>') || '—';
    html += `<tr><th>${escapeHtml(day)}</th><td class="calendar-table-cell ${teachers.length ? 'occupied' : 'empty'}">${teachers.map((teacher) => `<span class="tag green">${escapeHtml(teacher)}</span>`).join('') || '<span class="empty-mark">—</span>'}</td><td class="calendar-table-cell ${allocations.length ? 'occupied' : 'empty'}">${classes === '—' ? '<span class="empty-mark">—</span>' : classes}</td></tr>`;
  });
  html += '</tbody>';
  els.daysExportTable.innerHTML = html;
}

function renderAll() {
  renderDropdowns();
  renderTeacherCards();
  renderClassCards();
  renderScheduleTable();
  renderTeachersExport();
  renderDaysExport();
  renderDashboard();
  updateWarning(statusMessage);
}

function renderDashboard() {
  const required = buildSessionsForAutoAllocation().length;
  const allocated = state.allocations.length;
  els.metricTeachers.textContent = state.teachers.length;
  els.metricClasses.textContent = state.classes.length;
  els.metricRequired.textContent = required;
  els.metricAllocated.textContent = allocated;
  els.metricCoverage.textContent = required ? `${Math.round((allocated / required) * 100)}%` : '0%';
  els.tabTeachersCount.textContent = state.teachers.length;
  els.tabClassesCount.textContent = state.classes.length;
  els.tabCoverage.textContent = required ? `${Math.round((allocated / required) * 100)}%` : '0%';
}

function renderSettings() {
  Object.keys(DEFAULT_SETTINGS).forEach((key) => {
    if (!els[key]) return;
    if (els[key].type === 'checkbox') els[key].checked = Boolean(state.settings[key]);
    else els[key].value = String(state.settings[key]);
  });
}

function getTeacherById(id) {
  return state.teachers.find((teacher) => teacher.id === id);
}

function getClassById(id) {
  return state.classes.find((room) => room.id === id);
}

function matchesTeacherSearch(teacher, query) {
  if (!query) return true;
  const availabilityText = DAYS.flatMap((day) => PERIOD_KEYS.map((period) => `${day} ${getPeriodLabel(period)} ${teacher.availability?.[day]?.[period] || ''}`)).join(' ');
  return [teacher.name, teacher.color, teacher.subjects.join(' '), availabilityText]
    .join(' ')
    .toLowerCase()
    .includes(query);
}

function matchesClassSearch(room, query) {
  if (!query) return true;
  const subjectsText = room.subjects
    .map((subject) => {
      const teacherNames = subject.teacherIds.map((id) => getTeacherById(id)?.name).filter(Boolean).join(' ');
      return `${subject.name} ${subject.weekly} ${teacherNames}`;
    })
    .join(' ');
  return [room.name, room.shift, room.grade, room.notes, subjectsText]
    .join(' ')
    .toLowerCase()
    .includes(query);
}

function countAvailability(availability, stateName, periodKeys = PERIOD_KEYS) {
  let count = 0;
  DAYS.forEach((day) => {
    periodKeys.forEach((period) => {
      if (availability?.[day]?.[period] === stateName) count += 1;
    });
  });
  return count;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function unique(list) {
  return [...new Set(list)];
}

function compareAllocations(a, b) {
  const dayDiff = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
  if (dayDiff !== 0) return dayDiff;
  return PERIOD_KEYS.indexOf(String(a.period)) - PERIOD_KEYS.indexOf(String(b.period));
}

function deleteTeacher(id) {
  if (!confirm('Excluir este professor? As alocações vinculadas serão removidas.')) return;
  state.teachers = state.teachers.filter((teacher) => teacher.id !== id);
  state.allocations = state.allocations.filter((allocation) => allocation.teacherId !== id);
  state.classes = state.classes.map((room) => ({
    ...room,
    subjects: room.subjects.map((subject) => ({
      ...subject,
      teacherIds: subject.teacherIds.filter((teacherId) => teacherId !== id)
    }))
  }));
  saveState();
}

function duplicateTeacher(id) {
  const teacher = getTeacherById(id);
  if (!teacher) return;
  state.teachers.push(normalizeTeacher({
    ...teacher,
    id: uid('teacher'),
    name: `${teacher.name} (cópia)`
  }));
  saveState();
}

function editTeacher(id) {
  const teacher = getTeacherById(id);
  if (!teacher) return;
  editingTeacherId = id;
  els.teacherName.value = teacher.name;
  els.teacherColor.value = teacher.color;
  els.teacherSubjects.value = teacher.subjects.join(', ');
  els.teacherShifts.querySelectorAll('input').forEach((input) => { input.checked = teacher.shifts.includes(input.value); });
  teacherAvailabilityDraft = createBlankAvailability(teacher.availability);
  renderTeacherAvailabilityEditor();
  updateTeacherFormButton();
  els.teacherName.focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function editClass(id) {
  const room = getClassById(id);
  if (!room) return;
  editingClassId = id;
  els.className.value = room.name;
  els.classShift.value = room.shift;
  els.classGrade.value = room.grade;
  els.classNotes.value = room.notes;
  classAvailabilityDraft = createBlankAvailability(room.availability);
  renderClassAvailabilityEditor();
  updateClassFormButton();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteClass(id) {
  if (!confirm('Excluir esta turma? As disciplinas e alocações vinculadas serão removidas.')) return;
  state.classes = state.classes.filter((room) => room.id !== id);
  state.allocations = state.allocations.filter((allocation) => allocation.classId !== id);
  saveState();
}

function duplicateClass(id) {
  const room = getClassById(id);
  if (!room) return;
  state.classes.push(normalizeClass({
    ...room,
    id: uid('class'),
    name: `${room.name} (cópia)`
  }));
  saveState();
}

function addTeacher() {
  const name = els.teacherName.value.trim();
  if (!name) return alert('Informe o nome do professor.');
  const shifts = getSelectedTeacherShifts();
  if (!shifts.length) return alert('Selecione ao menos um turno de trabalho.');
  const payload = normalizeTeacher({
    id: editingTeacherId || uid('teacher'),
    name,
    color: els.teacherColor.value,
    subjects: els.teacherSubjects.value.split(',').map((item) => item.trim()).filter(Boolean),
    shifts,
    availability: teacherAvailabilityDraft
  });
  if (editingTeacherId) {
    state.teachers = state.teachers.map((teacher) => teacher.id === editingTeacherId ? payload : teacher);
    state.allocations = state.allocations.map((allocation) => allocation.teacherId === editingTeacherId
      ? { ...allocation, teacherName: name }
      : allocation);
  } else {
    state.teachers.push(payload);
  }
  clearTeacherForm();
  saveState();
}

function addClass() {
  const name = els.className.value.trim();
  if (!name) return alert('Informe o nome da turma.');
  const existing = editingClassId ? getClassById(editingClassId) : null;
  const payload = normalizeClass({
    id: editingClassId || uid('class'),
    name,
    shift: els.classShift.value,
    grade: els.classGrade.value.trim(),
    notes: els.classNotes.value.trim(),
    availability: classAvailabilityDraft,
    subjects: existing?.subjects || []
  });
  if (editingClassId) {
    state.classes = state.classes.map((room) => room.id === editingClassId ? payload : room);
    state.allocations = state.allocations.map((allocation) => allocation.classId === editingClassId ? { ...allocation, className: name } : allocation);
  } else state.classes.push(payload);
  clearClassForm();
  saveState();
}

function addSubject() {
  const room = getClassById(els.subjectClass.value);
  const name = els.subjectName.value.trim();
  const weekly = Number(els.subjectWeekly.value || 0);
  const teacherIds = [...subjectTeacherSelection];
  if (!room) return alert('Selecione uma turma.');
  if (!name) return alert('Informe a disciplina.');
  if (weekly < 0) return alert('Carga semanal inválida.');
  room.subjects.push({
    id: uid('subject'),
    name,
    weekly,
    teacherIds
  });
  els.subjectName.value = '';
  els.subjectWeekly.value = '1';
  subjectTeacherSelection.clear();
  renderSubjectTeacherPicker();
  saveState();
}

function addAllocation() {
  const classId = els.scheduleClass.value;
  const day = els.scheduleDay.value;
  const period = els.schedulePeriod.value;
  const subjectId = els.scheduleSubject.value;
  const teacherId = els.scheduleTeacher.value;
  const room = getClassById(classId);
  const subject = room?.subjects.find((item) => item.id === subjectId);
  const teacher = getTeacherById(teacherId);
  if (!room || !subject || !teacher) return alert('Preencha turma, disciplina e professor.');
  const subjectName = subject.name;
  const teacherAllowed = subject.teacherIds.includes(teacherId);
  if (!teacherAllowed) {
    return alert('Este professor não está habilitado para essa disciplina na turma.');
  }
  const teacherAvailability = teacher.availability?.[day]?.[period] || DEFAULT_STATE;
  if (!teacher.shifts.includes(room.shift)) {
    updateWarning(`${teacher.name} não trabalha no turno ${room.shift}.`);
    return;
  }
  if (room.availability?.[day]?.[period] === 'forbidden') {
    updateWarning(`A turma ${room.name} não está disponível em ${day} ${getPeriodLabel(period)}.`);
    return;
  }
  if (teacherAvailability === 'forbidden') {
    updateWarning(`O professor ${teacher.name} está marcado como proibido em ${day} ${getPeriodLabel(period)}.`);
    return;
  }
  if (state.allocations.some((allocation) => allocation.classId === classId && allocation.day === day && allocation.period === period)) {
    if (!confirm('Já existe uma aula nesse horário para essa turma. Substituir?')) return;
    state.allocations = state.allocations.filter((allocation) => !(allocation.classId === classId && allocation.day === day && allocation.period === period));
  }
  if (state.allocations.some((allocation) => allocation.teacherId === teacherId && allocation.day === day && allocation.period === period)) {
    if (!confirm('O professor já tem outra aula nesse horário. Continuar mesmo assim?')) return;
  }
  state.allocations.push({
    id: uid('allocation'),
    classId,
    className: room.name,
    day,
    period,
    subjectId,
    subjectName,
    teacherId,
    teacherName: teacher.name,
    locked: true
  });
  saveState();
}

function openSlotModal(classId, day, period) {
  const room = getClassById(classId);
  if (!room) return;
  const allocation = state.allocations.find((item) => item.classId === classId && item.day === day && item.period === period);
  activeSlot = { classId, day, period, allocationId: allocation?.id || null };
  els.slotModalTitle.textContent = allocation ? 'Editar aula da turma' : 'Adicionar aula à turma';
  els.slotModalContext.textContent = `${room.name} · ${day} · ${getPeriodLabel(period)} · ${room.shift}`;
  els.slotSubject.innerHTML = room.subjects.map((subject) => {
    const allocated = state.allocations.filter((item) => item.classId === classId && item.subjectId === subject.id && item.id !== allocation?.id).length;
    const remaining = Math.max(0, Number(subject.weekly || 0) - allocated);
    return `<option value="${escapeHtml(subject.id)}">${escapeHtml(subject.name)} · ${remaining} de ${subject.weekly} restantes</option>`;
  }).join('');
  if (allocation && room.subjects.some((subject) => subject.id === allocation.subjectId)) els.slotSubject.value = allocation.subjectId;
  els.slotLocked.checked = allocation?.locked !== false;
  els.btnRemoveSlot.classList.toggle('hidden', !allocation);
  setMessage(els.slotModalWarning, room.subjects.length ? '' : 'Cadastre uma disciplina para esta turma antes de definir uma aula.', !room.subjects.length);
  renderSlotTeacherOptions(allocation?.teacherId);
  els.slotModal.classList.remove('hidden');
  document.body.classList.add('modal-open');
}

function renderSlotTeacherOptions(preferredTeacherId = null) {
  if (!activeSlot) return;
  const room = getClassById(activeSlot.classId);
  const subject = room?.subjects.find((item) => item.id === els.slotSubject.value);
  els.slotTeacher.innerHTML = '';
  if (!subject) return;
  const candidates = getCandidateTeacherIds(subject).map(getTeacherById).filter(Boolean);
  candidates.forEach((teacher, index) => {
    const availability = teacher.availability?.[activeSlot.day]?.[activeSlot.period] || DEFAULT_STATE;
    const busy = state.allocations.find((item) => item.teacherId === teacher.id && item.day === activeSlot.day && item.period === activeSlot.period && item.id !== activeSlot.allocationId);
    const wrongShift = !teacher.shifts.includes(room.shift);
    const unavailable = availability === 'forbidden' || wrongShift || Boolean(busy);
    const reason = wrongShift ? `Não trabalha no turno ${room.shift}` : busy ? `Ocupado em ${busy.className}` : availability === 'forbidden' ? 'Indisponível' : availability === 'planning' ? 'Planejamento' : 'Disponível';
    const option = document.createElement('label');
    option.className = 'slot-teacher-option';
    option.innerHTML = `<input type="radio" name="slotTeacherChoice" value="${escapeHtml(teacher.id)}" ${unavailable ? 'disabled' : ''} ${!unavailable && (preferredTeacherId === teacher.id || (!preferredTeacherId && index === 0)) ? 'checked' : ''}><i style="--teacher-color:${escapeHtml(teacher.color)}"></i><span><strong>${escapeHtml(teacher.name)}</strong><small>${escapeHtml(teacher.subjects.join(' · '))}</small></span><em>${escapeHtml(reason)}</em>`;
    els.slotTeacher.appendChild(option);
  });
  if (!candidates.length) els.slotTeacher.innerHTML = '<div class="picker-empty">Nenhum professor foi designado para esta disciplina nesta turma. Edite a grade curricular da turma para adicionar responsáveis.</div>';
  if (!els.slotTeacher.querySelector('input:checked')) els.slotTeacher.querySelector('input:not(:disabled)')?.click();
}

function closeSlotModal() {
  activeSlot = null;
  els.slotModal.classList.add('hidden');
  document.body.classList.remove('modal-open');
}

function saveSlotAllocation() {
  if (!activeSlot) return;
  const room = getClassById(activeSlot.classId);
  const subject = room?.subjects.find((item) => item.id === els.slotSubject.value);
  const teacherId = els.slotTeacher.querySelector('input:checked')?.value;
  const teacher = getTeacherById(teacherId);
  if (!room || !subject || !teacher) {
    setMessage(els.slotModalWarning, 'Selecione uma disciplina e um professor disponível.', true);
    return;
  }
  state.allocations = state.allocations.filter((item) => item.id !== activeSlot.allocationId && !(item.classId === room.id && item.day === activeSlot.day && item.period === activeSlot.period));
  state.allocations.push({ id: activeSlot.allocationId || uid('allocation'), classId: room.id, className: room.name, day: activeSlot.day, period: activeSlot.period, subjectId: subject.id, subjectName: subject.name, teacherId: teacher.id, teacherName: teacher.name, locked: els.slotLocked.checked });
  closeSlotModal();
  statusMessage = 'Aula-base salva. A geração automática preservará os horários marcados como fixos.';
  saveState();
}

function removeSlotAllocation() {
  if (!activeSlot?.allocationId) return;
  state.allocations = state.allocations.filter((item) => item.id !== activeSlot.allocationId);
  closeSlotModal();
  saveState();
}

function canUseTeacherForSlot(teacher, day, period) {
  const availability = teacher.availability?.[day]?.[period] || DEFAULT_STATE;
  if (availability !== 'free') return false;
  return !state.allocations.some((allocation) => allocation.teacherId === teacher.id && allocation.day === day && allocation.period === period);
}

function canUseClassSlot(classId, day, period) {
  return !state.allocations.some((allocation) => allocation.classId === classId && allocation.day === day && allocation.period === period);
}

function buildSessionsForAutoAllocation() {
  const sessions = [];
  state.classes.forEach((room) => {
    room.subjects.forEach((subject) => {
      const weekly = Math.max(0, Number(subject.weekly || 0));
      for (let index = 0; index < weekly; index += 1) {
        sessions.push({
          instanceId: `${room.id}:${subject.id}:${index}`,
          classId: room.id,
          className: room.name,
          subjectId: subject.id,
          subjectName: subject.name,
          teacherIds: Array.isArray(subject.teacherIds) ? subject.teacherIds : []
        });
      }
    });
  });
  return sessions;
}

function getCandidateTeacherIds(subject) {
  return Array.isArray(subject.teacherIds) ? subject.teacherIds.filter((id) => Boolean(getTeacherById(id))) : [];
}

function scoreChoice(session, teacher, day, period, allocations) {
  const sameTeacherDay = allocations.filter((a) => a.teacherId === teacher.id && a.day === day);
  const sameSubjectDay = allocations.filter((a) => a.classId === session.classId && a.subjectId === session.subjectId && a.day === day);
  const teacherDays = new Set(allocations.filter((a) => a.teacherId === teacher.id).map((a) => a.day));
  const p = getPeriodIndex(period);
  let score = -(allocations.filter((a) => a.teacherId === teacher.id).length * 1.5);
  if (state.settings.preferFreeDays) score += sameTeacherDay.length ? 18 : -teacherDays.size * 2;
  if (state.settings.avoidGaps && sameTeacherDay.some((a) => getShiftForPeriod(a.period) === getShiftForPeriod(period) && Math.abs(getPeriodIndex(a.period) - p) === 1)) score += 14;
  if (state.settings.preferDouble && sameSubjectDay.some((a) => getShiftForPeriod(a.period) === getShiftForPeriod(period) && Math.abs(getPeriodIndex(a.period) - p) === 1)) score += 30;
  if (state.settings.avoidDouble && sameSubjectDay.length) score -= 28;
  if (sameTeacherDay.length >= Number(state.settings.maxTeacherDaily)) score -= 1000;
  if ((teacher.availability?.[day]?.[period] || DEFAULT_STATE) === 'planning') score -= 250;
  score += Math.random() * 0.5;
  return score;
}

function getFeasibleChoices(session, allocations, teacherSlots, classSlots) {
  const room = getClassById(session.classId);
  const choices = [];
  DAYS.forEach((day) => getShiftPeriodKeys(room?.shift || 'Tarde').forEach((period) => {
    if (classSlots.has(`${session.classId}-${day}-${period}`)) return;
    if (room?.availability?.[day]?.[period] === 'forbidden') return;
    getCandidateTeacherIds(session).forEach((teacherId) => {
      const teacher = getTeacherById(teacherId);
      if (!teacher || teacherSlots.has(`${teacherId}-${day}-${period}`)) return;
      if (!teacher.shifts.includes(room?.shift || 'Tarde')) return;
      const availability = teacher.availability?.[day]?.[period] || DEFAULT_STATE;
      if (availability !== 'free' && !(state.settings.allowPlanning && availability === 'planning')) return;
      const dailyLoad = allocations.filter((a) => a.teacherId === teacherId && a.day === day).length;
      if (dailyLoad >= Number(state.settings.maxTeacherDaily)) return;
      choices.push({ teacher, day, period, score: scoreChoice(session, teacher, day, period, allocations) });
    });
  }));
  return choices;
}

function solveWithAdaptiveMultiStart(sessions, attempts = 18, baseAllocations = []) {
  let best = { allocations: baseAllocations.slice(), score: -Infinity, missing: sessions };
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const allocations = baseAllocations.map((allocation) => ({ ...allocation }));
    const teacherSlots = new Set(baseAllocations.map((allocation) => `${allocation.teacherId}-${allocation.day}-${allocation.period}`));
    const classSlots = new Set(baseAllocations.map((allocation) => `${allocation.classId}-${allocation.day}-${allocation.period}`));
    const remaining = sessions.slice().sort((a, b) => getCandidateTeacherIds(a).length - getCandidateTeacherIds(b).length || Math.random() - .5);
    let totalScore = 0;
    while (remaining.length) {
      const sampleSize = Math.min(remaining.length, 12);
      let selectedIndex = 0;
      let selectedChoices = null;
      for (let index = 0; index < sampleSize; index += 1) {
        const choices = getFeasibleChoices(remaining[index], allocations, teacherSlots, classSlots);
        if (!selectedChoices || choices.length < selectedChoices.length || (choices.length === selectedChoices.length && Math.random() < .35)) {
          selectedIndex = index;
          selectedChoices = choices;
          if (!choices.length) break;
        }
      }
      const [session] = remaining.splice(selectedIndex, 1);
      if (!selectedChoices?.length) continue;
      selectedChoices.sort((a, b) => b.score - a.score);
      const candidateWindow = Math.min(selectedChoices.length, attempt < 6 ? 1 : 3);
      const choice = selectedChoices[Math.floor(Math.random() * candidateWindow)];
      totalScore += choice.score;
      allocations.push({ ...session, day: choice.day, period: choice.period, teacherId: choice.teacher.id, teacherName: choice.teacher.name });
      teacherSlots.add(`${choice.teacher.id}-${choice.day}-${choice.period}`);
      classSlots.add(`${session.classId}-${choice.day}-${choice.period}`);
    }
    const allocatedIds = new Set(allocations.map((a) => a.instanceId));
    const missing = sessions.filter((session) => !allocatedIds.has(session.instanceId));
    if (allocations.length > best.allocations.length || (allocations.length === best.allocations.length && totalScore > best.score)) {
      best = { allocations, score: totalScore, missing };
    }
    if (!missing.length && attempt >= 10) break;
  }
  return best;
}

function getSessionsNotCoveredBy(allocations) {
  const allocatedCounts = new Map();
  allocations.forEach((allocation) => {
    const key = `${allocation.classId}:${allocation.subjectId}`;
    allocatedCounts.set(key, (allocatedCounts.get(key) || 0) + 1);
  });
  const usedCounts = new Map();
  return buildSessionsForAutoAllocation().filter((session) => {
    const key = `${session.classId}:${session.subjectId}`;
    const used = usedCounts.get(key) || 0;
    usedCounts.set(key, used + 1);
    return used >= (allocatedCounts.get(key) || 0);
  });
}

function getMissingSessionsFromCurrentSchedule() {
  return getSessionsNotCoveredBy(state.allocations);
}

function buildScheduleDiagnostics(missingSessions = null) {
  if (missingSessions === null) missingSessions = getMissingSessionsFromCurrentSchedule();
  const items = [];
  state.classes.forEach((room) => {
    const demand = room.subjects.reduce((sum, subject) => sum + Number(subject.weekly || 0), 0);
    const roomPeriods = getShiftPeriodKeys(room.shift);
    const capacity = DAYS.reduce((sum, day) => sum + roomPeriods.filter((period) => room.availability?.[day]?.[period] !== 'forbidden').length, 0);
    if (demand > capacity) items.push({ type: 'error', title: `${room.name}: faltam ${demand - capacity} horários`, detail: `A turma exige ${demand} aulas, mas possui somente ${capacity} blocos disponíveis. Libere horários ou reduza a carga semanal.` });
  });
  state.classes.forEach((room) => room.subjects.forEach((subject) => {
    const candidates = getCandidateTeacherIds(subject).map(getTeacherById).filter(Boolean);
    if (!candidates.length) items.push({ type: 'error', title: `${room.name} · ${subject.name}: sem professor`, detail: 'Cadastre um professor que lecione a disciplina ou selecione professores possíveis na turma.' });
    const usable = candidates.filter((teacher) => teacher.shifts.includes(room.shift)).reduce((sum, teacher) => sum + DAYS.reduce((daySum, day) => daySum + getShiftPeriodKeys(room.shift).filter((period) => {
      const teacherState = teacher.availability?.[day]?.[period] || DEFAULT_STATE;
      return room.availability?.[day]?.[period] !== 'forbidden' && (teacherState === 'free' || (state.settings.allowPlanning && teacherState === 'planning'));
    }).length, 0), 0);
    if (candidates.length && usable < Number(subject.weekly || 0)) items.push({ type: 'error', title: `${room.name} · ${subject.name}: disponibilidade incompatível`, detail: `Há ${subject.weekly} aulas exigidas e apenas ${usable} combinações possíveis. Libere horários coincidentes entre turma e professor.` });
  }));
  state.teachers.forEach((teacher) => {
    const forcedDemand = buildSessionsForAutoAllocation().filter((session) => {
      const ids = getCandidateTeacherIds(session);
      return ids.length === 1 && ids[0] === teacher.id;
    }).length;
    const usableDays = DAYS.map((day) => getTeacherPeriodKeys(teacher).filter((period) => {
      const availability = teacher.availability?.[day]?.[period] || DEFAULT_STATE;
      return availability === 'free' || (state.settings.allowPlanning && availability === 'planning');
    }).length);
    const capacity = usableDays.reduce((sum, count) => sum + Math.min(count, Number(state.settings.maxTeacherDaily)), 0);
    if (forcedDemand > capacity) items.push({ type: 'error', title: `${teacher.name}: carga obrigatória acima da capacidade`, detail: `Há ${forcedDemand} aulas que dependem exclusivamente deste professor e capacidade para ${capacity}. Adicione outro professor habilitado ou libere horários.` });
  });
  const groupedMissing = new Map();
  missingSessions.forEach((session) => {
    const key = `${session.className} · ${session.subjectName}`;
    groupedMissing.set(key, (groupedMissing.get(key) || 0) + 1);
  });
  groupedMissing.forEach((count, label) => items.push({ type: 'warning', title: `${label}: ${count} aula${count === 1 ? '' : 's'} não alocada${count === 1 ? '' : 's'}`, detail: 'Tente liberar um horário da turma, ampliar a disponibilidade dos professores, adicionar outro professor habilitado ou aumentar o limite diário.' }));
  state.classes.forEach((room) => room.subjects.forEach((subject) => {
    const allocated = state.allocations.filter((allocation) => allocation.classId === room.id && allocation.subjectId === subject.id).length;
    if (allocated > Number(subject.weekly || 0)) items.push({ type: 'warning', title: `${room.name} · ${subject.name}: ${allocated - Number(subject.weekly || 0)} aula extra`, detail: 'Remova a alocação excedente para manter a carga semanal definida.' });
  }));
  const unavailableAllocations = state.allocations.filter((allocation) => {
    const room = getClassById(allocation.classId);
    const teacher = getTeacherById(allocation.teacherId);
    const teacherState = teacher?.availability?.[allocation.day]?.[allocation.period];
    return room?.availability?.[allocation.day]?.[allocation.period] === 'forbidden' || teacherState === 'forbidden' || !teacher?.shifts.includes(room?.shift);
  });
  if (unavailableAllocations.length) items.push({ type: 'error', title: `${unavailableAllocations.length} aula${unavailableAllocations.length === 1 ? '' : 's'} em horário indisponível`, detail: 'Mova essas aulas para uma interseção disponível entre a turma e o professor.' });
  const conflicts = state.allocations.filter((allocation, index, list) => list.some((other, otherIndex) => otherIndex < index && other.teacherId === allocation.teacherId && other.day === allocation.day && other.period === allocation.period));
  if (conflicts.length) items.push({ type: 'error', title: `${conflicts.length} conflito${conflicts.length === 1 ? '' : 's'} de professor`, detail: 'Há professor alocado simultaneamente em mais de uma turma. Remova ou substitua uma das aulas conflitantes.' });
  if (!items.length) items.push({ type: 'success', title: 'Nenhuma incompatibilidade estrutural encontrada', detail: 'As capacidades, professores e disponibilidades são compatíveis. Preferências continuam sendo otimizadas durante a geração.' });
  return items;
}

function renderScheduleDiagnostics(missingSessions = null) {
  const items = buildScheduleDiagnostics(missingSessions);
  const errors = items.filter((item) => item.type === 'error').length;
  const warnings = items.filter((item) => item.type === 'warning').length;
  els.diagnosticPanel.innerHTML = `<div class="diagnostic-header"><h3>Diagnóstico e sugestões</h3><span class="diagnostic-summary">${errors} erro${errors === 1 ? '' : 's'} · ${warnings} alerta${warnings === 1 ? '' : 's'}</span></div><div class="diagnostic-list">${items.map((item) => `<div class="diagnostic-item ${item.type}"><div class="diagnostic-icon">${item.type === 'success' ? '✓' : item.type === 'error' ? '!' : 'i'}</div><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.detail)}</span></div></div>`).join('')}</div>`;
  els.diagnosticPanel.classList.remove('hidden');
}

async function autoAllocateAll() {
  if (!state.classes.length || !state.teachers.length) {
    alert('Cadastre pelo menos uma turma e um professor antes de gerar a alocação automática.');
    return;
  }
  const fixedCount = state.allocations.filter((allocation) => allocation.locked).length;
  if (!confirm(`A geração preservará ${fixedCount} aula${fixedCount === 1 ? '' : 's'} fixa${fixedCount === 1 ? '' : 's'} e recalculará o restante. Continuar?`)) return;

  const allSessions = buildSessionsForAutoAllocation();
  const fixedAllocations = state.allocations.filter((allocation) => allocation.locked);
  const sessions = getSessionsNotCoveredBy(fixedAllocations);
  els.btnAutoAllocate.disabled = true;
  els.btnAutoAllocate.textContent = 'Otimizando…';
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const result = solveWithAdaptiveMultiStart(sessions, 18, fixedAllocations);
  state.allocations = result.allocations.map((allocation) => ({ ...allocation, id: allocation.id || uid('allocation'), locked: Boolean(allocation.locked) }));
  els.btnAutoAllocate.disabled = false;
  els.btnAutoAllocate.textContent = 'Alocação automática';
  saveState();

  const total = allSessions.length;
  const filled = result.allocations.length;
  const missing = Math.max(0, total - filled);
  statusMessage = missing > 0
    ? `Alocação automática concluída: ${filled}/${total} aulas preenchidas. ${missing} não puderam ser alocadas por falta de disponibilidade.`
    : `Alocação automática concluída: ${filled}/${total} aulas preenchidas.`;
  updateWarning(statusMessage);
  renderScheduleDiagnostics(result.missing);
}

function clearDayAllocations(classId, day) {
  state.allocations = state.allocations.filter((allocation) => !(allocation.classId === classId && allocation.day === day));
  saveState();
}

function updateWarning(text) {
  if (!text) {
    setMessage(els.allocationWarning, '', false);
    return;
  }
  setMessage(els.allocationWarning, text, true);
}

function loadExample() {
  if ((state.teachers.length || state.classes.length) && !confirm('Substituir os dados atuais por um exemplo completo?')) return;
  const teacherData = [
    { key: 'port1', name: 'Paula Nascimento', color: '#0f766e', subjects: ['Língua Portuguesa', 'Estudo Orientado'] },
    { key: 'port2', name: 'Ricardo Almeida', color: '#14b8a6', subjects: ['Língua Portuguesa', 'Projeto de Vida'] },
    { key: 'mat1', name: 'Marcelo Oliveira', color: '#2563eb', subjects: ['Matemática', 'Estudo Orientado'] },
    { key: 'mat2', name: 'Juliana Costa', color: '#60a5fa', subjects: ['Matemática', 'Eletivas / Itinerários'] },
    { key: 'bio', name: 'Beatriz Ferreira', color: '#16a34a', subjects: ['Biologia', 'Projeto de Vida'] },
    { key: 'fis', name: 'Fábio Mendes', color: '#7c3aed', subjects: ['Física', 'Eletivas / Itinerários'] },
    { key: 'qui', name: 'Camila Rodrigues', color: '#c026d3', subjects: ['Química', 'Estudo Orientado'] },
    { key: 'hist', name: 'Helena Barbosa', color: '#b45309', subjects: ['História', 'Filosofia', 'Projeto de Vida'] },
    { key: 'geo', name: 'Gustavo Santos', color: '#ea580c', subjects: ['Geografia', 'Sociologia', 'Eletivas / Itinerários'] },
    { key: 'hum', name: 'Renata Lima', color: '#e11d48', subjects: ['História', 'Geografia', 'Estudo Orientado'] },
    { key: 'ling', name: 'Alice Martins', color: '#0891b2', subjects: ['Língua Inglesa', 'Arte', 'Projeto de Vida'] },
    { key: 'edfis', name: 'Diego Souza', color: '#65a30d', subjects: ['Educação Física', 'Arte', 'Eletivas / Itinerários'] }
  ];
  const teacherIds = {};
  state.teachers = teacherData.map((data, index) => {
    const availability = createBlankAvailability();
    const planningDay = DAYS[index % DAYS.length];
    const secondPlanningDay = DAYS[(index + 2) % DAYS.length];
    availability[planningDay][String((index % 3) + 1)] = 'planning';
    availability[secondPlanningDay][String(6 + (index % 2))] = 'planning';
    availability[DAYS[(index + 1) % DAYS.length]][String((index % 5) + 1)] = 'forbidden';
    availability[DAYS[(index + 3) % DAYS.length]][String(7 - (index % 4))] = 'forbidden';
    const teacher = normalizeTeacher({ id: uid('teacher'), ...data, availability });
    teacherIds[data.key] = teacher.id;
    return teacher;
  });

  const candidates = {
    'Língua Portuguesa': ['port1', 'port2'],
    'Língua Inglesa': ['ling'],
    'Arte': ['ling', 'edfis'],
    'Educação Física': ['edfis'],
    'Matemática': ['mat1', 'mat2'],
    'Biologia': ['bio'],
    'Física': ['fis'],
    'Química': ['qui'],
    'História': ['hist', 'hum'],
    'Geografia': ['geo', 'hum'],
    'Filosofia': ['hist'],
    'Sociologia': ['geo'],
    'Projeto de Vida': ['port2', 'bio', 'hist', 'ling'],
    'Estudo Orientado': ['port1', 'mat1', 'qui', 'hum'],
    'Eletivas / Itinerários': ['mat2', 'fis', 'geo', 'edfis']
  };
  const curriculum = [
    ['Língua Portuguesa', 4], ['Língua Inglesa', 2], ['Arte', 1], ['Educação Física', 2],
    ['Matemática', 4], ['Biologia', 2], ['Física', 2], ['Química', 2],
    ['História', 2], ['Geografia', 2], ['Filosofia', 1], ['Sociologia', 1],
    ['Projeto de Vida', 2], ['Estudo Orientado', 2], ['Eletivas / Itinerários', 6]
  ];
  const classNames = ['1ª Série A', '1ª Série B', '2ª Série A', '2ª Série B', '3ª Série A', '3ª Série B'];
  state.classes = classNames.map((name) => normalizeClass({
    id: uid('class'),
    name,
    shift: 'Tarde',
    grade: 'Ensino Médio Integral',
    notes: 'Cenário de teste com matriz curricular de 35 aulas semanais.',
    availability: createBlankAvailability(),
    subjects: curriculum.map(([subjectName, weekly]) => ({
      id: uid('subject'),
      name: subjectName,
      weekly,
      teacherIds: candidates[subjectName].map((key) => teacherIds[key])
    }))
  }));
  state.allocations = [];
  statusMessage = 'Cenário carregado: 6 turmas, 12 professores e 210 aulas semanais para geração.';
  saveState();
}

function suggestTeacher() {
  const classId = els.scheduleClass.value;
  const day = els.scheduleDay.value;
  const period = els.schedulePeriod.value;
  const room = getClassById(classId);
  const subject = room?.subjects.find((item) => item.id === els.scheduleSubject.value);
  if (!room || !subject) return alert('Selecione uma turma e disciplina.');
  if (room.availability?.[day]?.[period] === 'forbidden') {
    updateWarning('A turma está indisponível nesse horário. Escolha outro período.');
    return;
  }
  const allowedTeachers = getCandidateTeacherIds(subject)
    .map((id) => getTeacherById(id))
    .filter(Boolean);
  const availableTeachers = allowedTeachers.filter((teacher) => {
    const availability = teacher.availability?.[day]?.[period] || DEFAULT_STATE;
    const busy = state.allocations.some((allocation) => allocation.teacherId === teacher.id && allocation.day === day && allocation.period === period);
    return availability === 'free' && !busy;
  });
  if (!availableTeachers.length) {
    updateWarning('Nenhum professor designado para esta disciplina está livre nesse horário.');
    return;
  }
  els.scheduleTeacher.value = availableTeachers[0].id;
  updateWarning(`Sugestão: ${availableTeachers[0].name}`);
}

function clearAllocations() {
  if (!confirm('Limpar todas as alocações?')) return;
  state.allocations = [];
  statusMessage = 'Todas as alocações foram removidas.';
  saveState();
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `planejador-horarios-${Date.now()}.json`);
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || '{}'));
      state.teachers = Array.isArray(parsed.teachers) ? parsed.teachers.map(normalizeTeacher) : [];
      state.classes = Array.isArray(parsed.classes) ? parsed.classes.map(normalizeClass) : [];
      state.allocations = Array.isArray(parsed.allocations) ? parsed.allocations : [];
      state.settings = { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) };
      renderSettings();
      statusMessage = 'Backup importado com sucesso.';
      saveState();
    } catch (error) {
      alert('Arquivo JSON inválido.');
    }
  };
  reader.readAsText(file);
}

function renderPrintableHtml(title, tableHtml) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
    h1 { margin: 0 0 12px; }
    table { border-collapse: separate; border-spacing: 0; width: 100%; margin-bottom: 22px; border: 1px solid #d9e0dc; border-radius: 14px; overflow: hidden; }
    th, td { border: 0; border-right: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 10px; vertical-align: middle; text-align: left; }
    tr:last-child > * { border-bottom: 0; } tr > *:last-child { border-right: 0; }
    th { background: #f8faf9; color: #374151; font-size: 12px; }
    .calendar-table-cell.empty { background: #f7f8f8; color: #9ca3af; text-align: center; }
    .calendar-table-cell.occupied { background: #f4fbf8; }
    .export-lesson { margin-bottom: 6px; padding: 7px 9px; border-left: 3px solid #0f766e; border-radius: 7px; background: #e9f7f3; }
    .export-lesson strong, .export-lesson span { display: block; } .export-lesson strong { color: #0f766e; font-size: 11px; }
    .export-lesson span { color: #374151; font-size: 12px; }
    .tag { display: inline-block; padding: 3px 8px; margin: 0 6px 6px 0; border-radius: 999px; background: #e2e8f0; }
    .page-break { page-break-after: always; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${tableHtml}
</body>
</html>`;
}

function downloadBlob(blob, filename) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function exportTeachersHtml() {
  const html = renderPrintableHtml('Horários por Professor', document.getElementById('teachersExportTable').outerHTML);
  downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), 'horarios-por-professor.html');
}

function exportDaysHtml() {
  const html = renderPrintableHtml('Horários por Dia', document.getElementById('daysExportTable').outerHTML);
  downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), 'horarios-por-dia.html');
}

async function copyTeachersHtml() {
  const html = renderPrintableHtml('Horários por Professor', document.getElementById('teachersExportTable').outerHTML);
  await navigator.clipboard.writeText(html);
  alert('HTML dos horários por professor copiado.');
}

async function copyDaysHtml() {
  const html = renderPrintableHtml('Horários por Dia', document.getElementById('daysExportTable').outerHTML);
  await navigator.clipboard.writeText(html);
  alert('HTML dos horários por dia copiado.');
}

function exportTeachersCsv() {
  const rows = [['Professor', 'Dia', 'Período', 'Turma', 'Disciplina']];
  state.allocations
    .slice()
    .sort(compareAllocations)
    .forEach((allocation) => {
      rows.push([
        allocation.teacherName || getTeacherById(allocation.teacherId)?.name || '',
        allocation.day,
        getPeriodLabel(allocation.period),
        allocation.className,
        allocation.subjectName
      ]);
    });
  downloadBlob(new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' }), 'horarios-por-professor.csv');
}

function exportDaysCsv() {
  const rows = [['Dia', 'Professores', 'Detalhes']];
  DAYS.forEach((day) => {
    const allocations = state.allocations.filter((allocation) => allocation.day === day).sort(compareAllocations);
    const teachers = unique(allocations.map((allocation) => allocation.teacherName || getTeacherById(allocation.teacherId)?.name || ''));
    const details = allocations.map((allocation) => `${getPeriodLabel(allocation.period)} | ${allocation.className} | ${allocation.subjectName} | ${allocation.teacherName || ''}`).join(' ; ');
    rows.push([day, teachers.join(' / '), details]);
  });
  downloadBlob(new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' }), 'horarios-por-dia.csv');
}

function toCsv(rows) {
  return rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(';')).join('\n');
}

function autoSaveNotice() {
  const message = document.createElement('div');
  message.className = 'notice';
  message.textContent = 'Dados salvos no navegador. Use Exportar JSON para backup.';
  document.querySelector('.hero').appendChild(message);
  setTimeout(() => message.remove(), 2600);
}

function bindEvents() {
  document.addEventListener('pointerup', () => { classPaintState = null; teacherPaintState = null; });
  document.addEventListener('pointercancel', () => { classPaintState = null; teacherPaintState = null; });
  document.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('[data-tab]').forEach((item) => item.classList.toggle('active', item === button));
    document.querySelectorAll('[data-panel]').forEach((panel) => panel.classList.toggle('hidden', panel.dataset.panel !== button.dataset.tab));
    window.scrollTo({ top: document.querySelector('.tabs').offsetTop - 8, behavior: 'smooth' });
  }));
  els.btnLoadExample.addEventListener('click', loadExample);
  Object.keys(DEFAULT_SETTINGS).forEach((key) => {
    els[key].addEventListener('change', () => {
      if (key === 'preferDouble' && els.preferDouble.checked) els.avoidDouble.checked = false;
      if (key === 'avoidDouble' && els.avoidDouble.checked) els.preferDouble.checked = false;
      state.settings.preferDouble = els.preferDouble.checked;
      state.settings.avoidDouble = els.avoidDouble.checked;
      state.settings[key] = els[key].type === 'checkbox' ? els[key].checked : Number(els[key].value);
      saveState();
    });
  });
  els.btnAddTeacher.addEventListener('click', addTeacher);
  els.btnClearTeacherForm.addEventListener('click', clearTeacherForm);
  els.teacherShifts.addEventListener('change', renderTeacherAvailabilityEditor);
  els.teacherSearch.addEventListener('input', renderAll);
  els.btnAddClass.addEventListener('click', addClass);
  els.btnClearClassForm.addEventListener('click', clearClassForm);
  els.classShift.addEventListener('change', renderClassAvailabilityEditor);
  els.classSearch.addEventListener('input', renderAll);
  els.btnAddSubject.addEventListener('click', addSubject);
  els.subjectName.addEventListener('input', renderSubjectTeacherPicker);
  els.subjectClass.addEventListener('change', updateSubjectClassLoad);
  els.btnAddAllocation.addEventListener('click', addAllocation);
  els.slotSubject.addEventListener('change', () => renderSlotTeacherOptions());
  els.btnCloseSlotModal.addEventListener('click', closeSlotModal);
  els.btnCancelSlot.addEventListener('click', closeSlotModal);
  els.btnSaveSlot.addEventListener('click', saveSlotAllocation);
  els.btnRemoveSlot.addEventListener('click', removeSlotAllocation);
  els.slotModal.addEventListener('click', (event) => { if (event.target === els.slotModal) closeSlotModal(); });
  els.btnAutoAllocate.addEventListener('click', autoAllocateAll);
  els.btnAnalyzeSchedule.addEventListener('click', () => renderScheduleDiagnostics());
  els.btnAutoSuggest.addEventListener('click', suggestTeacher);
  els.btnClearAllocations.addEventListener('click', clearAllocations);
  els.btnSaveAll.addEventListener('click', () => {
    saveState();
    autoSaveNotice();
  });
  els.btnExportJson.addEventListener('click', exportJson);
  els.btnImportJson.addEventListener('click', () => els.fileImport.click());
  els.fileImport.addEventListener('change', () => {
    const file = els.fileImport.files?.[0];
    if (file) importJson(file);
    els.fileImport.value = '';
  });
  els.btnResetAll.addEventListener('click', () => {
    if (!confirm('Apagar todos os dados salvos?')) return;
    state.teachers = [];
    state.classes = [];
    state.allocations = [];
    state.settings = { ...DEFAULT_SETTINGS };
    statusMessage = '';
    editingTeacherId = null;
    clearTeacherForm();
    clearClassForm();
    renderSettings();
    saveState();
  });
  els.scheduleClass.addEventListener('change', () => {
    updateSchedulePeriodOptions();
    updateSubjectOptions();
    renderScheduleTable();
  });
  els.scheduleSubject.addEventListener('change', updateTeacherOptions);
  els.btnExportTeachersHtml.addEventListener('click', exportTeachersHtml);
  els.btnCopyTeachersHtml.addEventListener('click', copyTeachersHtml);
  els.btnExportTeachersCsv.addEventListener('click', exportTeachersCsv);
  els.btnExportDaysHtml.addEventListener('click', exportDaysHtml);
  els.btnCopyDaysHtml.addEventListener('click', copyDaysHtml);
  els.btnExportDaysCsv.addEventListener('click', exportDaysCsv);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !els.slotModal.classList.contains('hidden')) closeSlotModal();
    if (event.ctrlKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      saveState();
      autoSaveNotice();
    }
  });
}

function initialize() {
  state.settings = { ...DEFAULT_SETTINGS, ...(state.settings || {}) };
  state.teachers = state.teachers.map(normalizeTeacher);
  state.classes = state.classes.map(normalizeClass);
  state.teachers.forEach((teacher) => {
    if (teacher.subjects.length) return;
    teacher.subjects = unique(state.classes.flatMap((room) => room.subjects
      .filter((subject) => subject.teacherIds.includes(teacher.id))
      .map((subject) => subject.name)));
  });
  state.allocations = state.allocations.map((allocation) => ({
    id: allocation.id || uid('allocation'),
    classId: allocation.classId,
    className: allocation.className || getClassById(allocation.classId)?.name || '',
    day: allocation.day,
    period: String(allocation.period),
    subjectId: allocation.subjectId,
    subjectName: allocation.subjectName || '',
    teacherId: allocation.teacherId,
    teacherName: allocation.teacherName || getTeacherById(allocation.teacherId)?.name || '',
    locked: Boolean(allocation.locked)
  }));
  teacherAvailabilityDraft = createBlankAvailability();
  classAvailabilityDraft = createBlankAvailability();
  renderSettings();
  renderTeacherAvailabilityEditor();
  renderClassAvailabilityEditor();
  updateTeacherFormButton();
  updateClassFormButton();
  els.teachersPanel.open = true;
  els.classesPanel.open = true;
  bindEvents();
  renderAll();
  if (!state.classes.length) clearClassForm();
  if (!state.teachers.length) clearTeacherForm();
}

initialize();
