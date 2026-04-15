const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const STATE_DIR = path.join(ROOT, "state");

const FEATURES_FILE = path.join(STATE_DIR, "features.json");
const PIPELINE_FILE = path.join(STATE_DIR, "pipeline-status.json");
const TASKS_FILE = path.join(STATE_DIR, "tasks.json");
const DASHBOARD_FILE = path.join(STATE_DIR, "dashboard.md");

const TERMINAL_STATUSES = new Set(["done", "rejected"]);
const TERMINAL_VERDICTS = new Set(["approve", "reject"]);
const RETRY_VERDICTS = new Set(["approve-with-fixes"]);

const TASK_STATUSES = new Set(["created", "in_progress", "done", "blocked", "retry"]);

// Какие артефакты должны существовать перед переходом на конкретный шаг.
// dir — относительно agent-runtime/, stage — суффикс файла FEAT-XXX-vN-<stage>.md.
const ARTIFACT_REQUIREMENTS = {
  planner: [],
  "backend-implementer": [{ dir: "shared", stage: "plan" }],
  "frontend-implementer": [{ dir: "shared", stage: "plan" }],
  "operations-ux-reviewer": [{ dir: "outputs", stage: "frontend" }],
  reviewer: [{ dir: "shared", stage: "plan" }],
};

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Failed to read JSON: ${filePath}`);
    console.error(error);
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, "utf-8");
}

function slugify(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeVerdict(verdict) {
  return String(verdict).trim().toLowerCase().replace(/\s+/g, "-");
}

function getNextFeatureId(featuresData) {
  const features = Array.isArray(featuresData.features) ? featuresData.features : [];
  const maxNumber = features.reduce((max, feature) => {
    const match = /^FEAT-(\d+)$/.exec(feature.id);
    if (!match) return max;
    return Math.max(max, Number(match[1]));
  }, 0);

  return `FEAT-${String(maxNumber + 1).padStart(3, "0")}`;
}

function readPipelines() {
  const raw = readJson(PIPELINE_FILE, null);

  if (!raw) {
    return { active_feature: null, pipelines: {} };
  }

  if (raw.pipelines && typeof raw.pipelines === "object") {
    return {
      active_feature: raw.active_feature ?? null,
      pipelines: raw.pipelines,
    };
  }

  const migrated = { active_feature: null, pipelines: {} };
  if (raw.feature) {
    migrated.active_feature = raw.feature;
    migrated.pipelines[raw.feature] = {
      current_step: raw.current_step ?? null,
      status: raw.status ?? "idle",
      version: raw.version ?? 1,
      result: raw.result ?? "pending",
    };
  }
  return migrated;
}

function writePipelines(data) {
  writeJson(PIPELINE_FILE, data);
}

function readTasks() {
  return readJson(TASKS_FILE, { phases: [], dependency_graph: "" });
}

function writeTasks(data) {
  writeJson(TASKS_FILE, data);
}

function findTask(tasksData, taskId) {
  for (const phase of tasksData.phases) {
    const task = phase.tasks.find((t) => t.id === taskId);
    if (task) return { phase, task };
  }
  return null;
}

function setTaskStatus(tasksData, taskId, status) {
  const found = findTask(tasksData, taskId);
  if (!found) {
    console.error(`  ⚠ Task ${taskId} not found in tasks.json — binding skipped`);
    return false;
  }
  found.task.status = status;
  return true;
}

function parseTaskIds(raw) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function propagateTaskStatus(taskIds, status) {
  if (!taskIds || taskIds.length === 0) return;
  const tasksData = readTasks();
  let changed = false;
  for (const id of taskIds) {
    if (setTaskStatus(tasksData, id, status)) {
      console.log(`  task ${id} → ${status}`);
      changed = true;
    }
  }
  if (changed) writeTasks(tasksData);
}

function getOrCreatePipeline(pipelinesData, featureId) {
  if (!pipelinesData.pipelines[featureId]) {
    pipelinesData.pipelines[featureId] = {
      current_step: null,
      status: "idle",
      version: 1,
      result: "pending",
    };
  }
  return pipelinesData.pipelines[featureId];
}

function artifactPath(featureId, version, dir, stage) {
  return path.join(ROOT, dir, `${featureId}-v${version}-${stage}.md`);
}

function checkRequiredArtifacts(featureId, version, step) {
  const reqs = ARTIFACT_REQUIREMENTS[step];
  if (!reqs) return [];
  return reqs
    .filter((req) => !fs.existsSync(artifactPath(featureId, version, req.dir, req.stage)))
    .map((req) => `agent-runtime/${req.dir}/${featureId}-v${version}-${req.stage}.md`);
}

function formatTimestamp(date) {
  const pad = (n) => String(n).padStart(2, "0");
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  return `${hh}:${mm} ${d}.${m}.${y}`;
}

const STATUS_LABELS = {
  created: "создана",
  in_progress: "в работе",
  retry: "на доработке",
  done: "завершена",
  rejected: "отклонена",
  blocked: "заблокирована",
  idle: "простаивает",
  unknown: "неизвестно",
};

const STEP_LABELS = {
  planner: "планировщик",
  "backend-implementer": "backend-разработчик",
  "frontend-implementer": "frontend-разработчик",
  "operations-ux-reviewer": "UX-ревьюер",
  reviewer: "финальный ревьюер",
  completed: "завершено",
  unknown: "неизвестно",
  none: "—",
};

const VERDICT_LABELS = {
  approve: "одобрено",
  "approve-with-fixes": "одобрено с правками",
  reject: "отклонено",
  retry: "на доработке",
  pending: "ожидает",
};

const labelStatus = (s) => STATUS_LABELS[s] ?? s ?? "—";
const labelStep = (s) => STEP_LABELS[s] ?? s ?? "—";
const labelVerdict = (v) => VERDICT_LABELS[v] ?? v ?? "—";

function buildFeatureOverview(features, pipelinesData) {
  const rows = features.length
    ? features
        .map((feature) => {
          const pipeline = pipelinesData.pipelines[feature.id] ?? {};
          const verdict = feature.last_verdict ?? pipeline.result ?? "pending";
          const version = `v${feature.current_version || 1}`;
          const step = feature.current_step || "unknown";
          const status = feature.status || "unknown";
          const nextAction =
            status === "done"
              ? "—"
              : status === "rejected"
              ? "требуется доработка"
              : `продолжить: ${labelStep(step)}`;
          const taskIds = Array.isArray(feature.task_ids) && feature.task_ids.length
            ? feature.task_ids.join(", ")
            : "—";

          return `| ${feature.id} | ${feature.name} | ${labelStatus(status)} | ${labelStep(step)} | ${version} | ${labelVerdict(verdict)} | ${taskIds} | ${nextAction} |`;
        })
        .join("\n")
    : `| — | — | простаивает | — | — | — | — | создайте первую фичу |`;

  return `## Обзор фич

| Feature ID | Название | Статус | Текущий шаг | Версия | Вердикт | Task IDs | Следующее действие |
|------------|----------|--------|-------------|--------|---------|----------|--------------------|
${rows}`;
}

function buildPipelineOverview(pipelinesData) {
  const activeEntries = Object.entries(pipelinesData.pipelines).filter(
    ([, p]) => !TERMINAL_STATUSES.has(p.status)
  );
  const rows = activeEntries.length
    ? activeEntries
        .map(([id, p]) => {
          const marker = pipelinesData.active_feature === id ? "★" : " ";
          return `| ${marker} | ${id} | ${labelStep(p.current_step ?? "none")} | ${labelStatus(p.status ?? "idle")} | v${p.version ?? 1} | ${labelVerdict(p.result ?? "pending")} |`;
        })
        .join("\n")
    : `| — | — | — | простаивает | — | — |`;

  return `## Активные pipeline

★ — последняя активная фича (текущий фокус). Несколько pipeline могут идти параллельно.

| ★ | Feature ID | Текущий шаг | Статус | Версия | Результат |
|---|------------|-------------|--------|--------|-----------|
${rows}`;
}

function buildPhaseSection(tasksData) {
  if (!tasksData.phases || !tasksData.phases.length) return "";

  const sections = tasksData.phases.map((phase, idx) => {
    const rows = phase.tasks
      .map((t) => {
        const deps = t.depends_on && t.depends_on.length ? t.depends_on.join(", ") : "—";
        return `| ${t.id} | ${t.name} | ${t.role} | ${labelStatus(t.status)} | ${deps} | ${t.description} |`;
      })
      .join("\n");

    const phaseNumber = idx;
    const deliverable = phase.deliverable ? `\n\n**Deliverable:** ${phase.deliverable}` : "";

    return `### Phase ${phaseNumber} — ${phase.title}

| Task ID | Название | Исполнитель | Статус | Зависит от | Описание |
|---------|----------|-------------|--------|------------|----------|
${rows}${deliverable}`;
  });

  return `## Декомпозиция задач по фазам

${sections.join("\n\n---\n\n")}`;
}

function buildStatsSection(tasksData) {
  if (!tasksData.phases || !tasksData.phases.length) return "";

  const rows = tasksData.phases.map((phase, idx) => {
    const total = phase.tasks.length;
    const backend = phase.tasks.filter((t) => t.role === "backend-implementer").length;
    const frontend = phase.tasks.filter((t) => t.role === "frontend-implementer").length;
    const done = phase.tasks.filter((t) => t.status === "done").length;
    const inProgress = phase.tasks.filter((t) => t.status === "in_progress").length;

    let status;
    if (done === total) status = "done";
    else if (done > 0 || inProgress > 0) status = "in_progress";
    else status = "created";

    return `| Phase ${idx} | ${total} | ${backend} | ${frontend} | ${done}/${total} | ${labelStatus(status)} |`;
  });

  const totalTasks = tasksData.phases.reduce((sum, p) => sum + p.tasks.length, 0);
  const totalBackend = tasksData.phases.reduce(
    (sum, p) => sum + p.tasks.filter((t) => t.role === "backend-implementer").length,
    0
  );
  const totalFrontend = tasksData.phases.reduce(
    (sum, p) => sum + p.tasks.filter((t) => t.role === "frontend-implementer").length,
    0
  );
  const totalDone = tasksData.phases.reduce(
    (sum, p) => sum + p.tasks.filter((t) => t.status === "done").length,
    0
  );

  return `## Сводная статистика

| Фаза | Задач | Backend | Frontend | Выполнено | Статус |
|------|-------|---------|----------|-----------|--------|
${rows.join("\n")}
| **Итого** | **${totalTasks}** | **${totalBackend}** | **${totalFrontend}** | **${totalDone}/${totalTasks}** | — |`;
}

function buildDependencyGraph(tasksData) {
  if (!tasksData.dependency_graph) return "";
  return `## Граф зависимостей (фазы)

\`\`\`
${tasksData.dependency_graph}
\`\`\``;
}

function buildLegend() {
  return `## Статусы

- \`created\` — задача создана
- \`in_progress\` — в работе
- \`done\` — завершена
- \`blocked\` — заблокирована зависимостью
- \`retry\` — возвращена на доработку
- \`rejected\` — отклонена

---

## Шаги pipeline

- \`planner\` — планировщик
- \`backend-implementer\` — backend-разработчик
- \`frontend-implementer\` — frontend-разработчик
- \`operations-ux-reviewer\` — UX-ревьюер
- \`reviewer\` — финальный ревьюер
- \`completed\` — pipeline завершён`;
}

function buildDashboard(featuresData, pipelinesData, tasksData) {
  const now = formatTimestamp(new Date());
  const features = Array.isArray(featuresData.features) ? featuresData.features : [];

  const parts = [
    `# Дашборд агентного runtime\n\nОбновлено: ${now}`,
    buildPhaseSection(tasksData),
    buildStatsSection(tasksData),
    buildDependencyGraph(tasksData),
    buildFeatureOverview(features, pipelinesData),
    buildPipelineOverview(pipelinesData),
    buildLegend(),
  ].filter(Boolean);

  return parts.join("\n\n---\n\n") + "\n";
}

function updateDashboard() {
  const featuresData = readJson(FEATURES_FILE, { features: [] });
  const pipelinesData = readPipelines();
  const tasksData = readTasks();

  const dashboard = buildDashboard(featuresData, pipelinesData, tasksData);
  writeFile(DASHBOARD_FILE, dashboard);

  console.log("Dashboard updated:");
  console.log(DASHBOARD_FILE);
}

function isSlugInUseActive(featuresData, slug) {
  return featuresData.features.find(
    (f) => f.name === slug && !TERMINAL_STATUSES.has(f.status)
  );
}

function validateTaskBindings(tasksData, taskIds) {
  const invalid = [];
  for (const id of taskIds) {
    if (!findTask(tasksData, id)) invalid.push(id);
  }
  return invalid;
}

function createFeature(featureName, options) {
  if (!featureName || !featureName.trim()) {
    console.error('Feature name is required. Example: create-feature "orders map" [--tasks 0.2,0.3]');
    process.exit(1);
  }

  const featuresData = readJson(FEATURES_FILE, { features: [] });
  const pipelinesData = readPipelines();
  const tasksData = readTasks();

  const slug = slugify(featureName);
  const conflict = isSlugInUseActive(featuresData, slug);
  if (conflict) {
    console.error(
      `Active feature with name "${slug}" already exists (${conflict.id}, status=${conflict.status}). Complete or reject it first, or use a different name.`
    );
    process.exit(1);
  }

  const taskIds = options.tasks || [];
  const invalid = validateTaskBindings(tasksData, taskIds);
  if (invalid.length) {
    console.error(`Unknown task IDs: ${invalid.join(", ")}`);
    console.error("Check tasks.json for valid IDs.");
    process.exit(1);
  }

  const id = getNextFeatureId(featuresData);

  const newFeature = {
    id,
    name: slug,
    status: "created",
    current_version: 1,
    current_step: "planner",
    last_verdict: "pending",
    task_ids: taskIds,
    history: [{ version: 1, status: "created" }],
  };

  featuresData.features.push(newFeature);

  pipelinesData.active_feature = id;
  pipelinesData.pipelines[id] = {
    current_step: "planner",
    status: "in_progress",
    version: 1,
    result: "pending",
  };

  writeJson(FEATURES_FILE, featuresData);
  writePipelines(pipelinesData);

  if (taskIds.length) {
    propagateTaskStatus(taskIds, "in_progress");
  }

  updateDashboard();

  console.log(`Feature created: ${id} (${slug})`);
  if (taskIds.length) console.log(`  bound tasks: ${taskIds.join(", ")}`);
}

function bindTasks(featureId, rawIds) {
  if (!featureId || !rawIds) {
    console.error("Usage: bind-tasks FEAT-001 0.2,0.3");
    process.exit(1);
  }

  const featuresData = readJson(FEATURES_FILE, { features: [] });
  const tasksData = readTasks();

  const feature = featuresData.features.find((f) => f.id === featureId);
  if (!feature) {
    console.error(`Feature not found: ${featureId}`);
    process.exit(1);
  }

  const taskIds = parseTaskIds(rawIds);
  const invalid = validateTaskBindings(tasksData, taskIds);
  if (invalid.length) {
    console.error(`Unknown task IDs: ${invalid.join(", ")}`);
    process.exit(1);
  }

  feature.task_ids = taskIds;
  writeJson(FEATURES_FILE, featuresData);

  const propagatedStatus =
    feature.status === "done"
      ? "done"
      : feature.status === "rejected"
      ? "blocked"
      : "in_progress";
  propagateTaskStatus(taskIds, propagatedStatus);

  updateDashboard();
  console.log(`Tasks bound to ${featureId}: ${taskIds.join(", ")}`);
}

function setTaskStatusCommand(taskId, status) {
  if (!taskId || !status) {
    console.error("Usage: set-task-status 0.2 done");
    process.exit(1);
  }
  if (!TASK_STATUSES.has(status)) {
    console.error(`Unknown status "${status}". Allowed: ${[...TASK_STATUSES].join(", ")}`);
    process.exit(1);
  }

  const tasksData = readTasks();
  if (!setTaskStatus(tasksData, taskId, status)) {
    console.error(`Task ${taskId} not found`);
    process.exit(1);
  }
  writeTasks(tasksData);
  updateDashboard();
  console.log(`Task ${taskId} → ${status}`);
}

function setStep(featureId, step, options) {
  if (!featureId || !step) {
    console.error("Usage: set-step FEAT-001 backend-implementer [--force]");
    process.exit(1);
  }

  const featuresData = readJson(FEATURES_FILE, { features: [] });
  const pipelinesData = readPipelines();

  const feature = featuresData.features.find((f) => f.id === featureId);

  if (!feature) {
    console.error(`Feature not found: ${featureId}`);
    process.exit(1);
  }

  const version = feature.current_version || 1;
  const missing = checkRequiredArtifacts(featureId, version, step);
  if (missing.length && !options.force) {
    console.error(
      `Cannot set step "${step}" for ${featureId}: missing required input artifacts:`
    );
    missing.forEach((p) => console.error(`  - ${p}`));
    console.error("Use --force to bypass (not recommended).");
    process.exit(1);
  }

  feature.current_step = step;
  feature.status = "in_progress";

  const pipeline = getOrCreatePipeline(pipelinesData, featureId);
  pipeline.current_step = step;
  pipeline.status = "in_progress";
  pipeline.version = version;
  pipelinesData.active_feature = featureId;

  writeJson(FEATURES_FILE, featuresData);
  writePipelines(pipelinesData);

  if (Array.isArray(feature.task_ids) && feature.task_ids.length) {
    propagateTaskStatus(feature.task_ids, "in_progress");
  }

  updateDashboard();

  console.log(`Step updated: ${featureId} → ${step}`);
}

function retryFeature(featureId, step) {
  if (!featureId || !step) {
    console.error("Usage: retry FEAT-001 backend-implementer");
    process.exit(1);
  }

  const featuresData = readJson(FEATURES_FILE, { features: [] });
  const pipelinesData = readPipelines();

  const feature = featuresData.features.find((f) => f.id === featureId);

  if (!feature) {
    console.error(`Feature not found: ${featureId}`);
    process.exit(1);
  }

  feature.current_version += 1;
  feature.status = "retry";
  feature.current_step = step;
  feature.last_verdict = "retry";
  feature.history.push({
    version: feature.current_version,
    status: "retry",
  });

  const pipeline = getOrCreatePipeline(pipelinesData, featureId);
  pipeline.current_step = step;
  pipeline.status = "retry";
  pipeline.version = feature.current_version;
  pipeline.result = "retry";
  pipelinesData.active_feature = featureId;

  writeJson(FEATURES_FILE, featuresData);
  writePipelines(pipelinesData);

  if (Array.isArray(feature.task_ids) && feature.task_ids.length) {
    propagateTaskStatus(feature.task_ids, "retry");
  }

  updateDashboard();

  console.log(`Retry: ${featureId} → v${feature.current_version} → ${step}`);
}

function completeFeature(featureId, rawVerdict) {
  if (!featureId || !rawVerdict) {
    console.error("Usage: complete FEAT-001 approve | reject");
    process.exit(1);
  }

  const verdict = normalizeVerdict(rawVerdict);

  if (RETRY_VERDICTS.has(verdict)) {
    console.error(
      `Verdict "${rawVerdict}" requires retry, not complete. Use: retry ${featureId} <target-agent>`
    );
    process.exit(1);
  }

  if (!TERMINAL_VERDICTS.has(verdict)) {
    console.error(
      `Unknown verdict "${rawVerdict}". Allowed for complete: approve | reject. For "approve with fixes" use: retry ${featureId} <target-agent>`
    );
    process.exit(1);
  }

  const featuresData = readJson(FEATURES_FILE, { features: [] });
  const pipelinesData = readPipelines();

  const feature = featuresData.features.find((f) => f.id === featureId);

  if (!feature) {
    console.error(`Feature not found: ${featureId}`);
    process.exit(1);
  }

  feature.status = verdict === "approve" ? "done" : "rejected";
  feature.current_step = "completed";
  feature.last_verdict = verdict;
  feature.history.push({
    version: feature.current_version,
    status: feature.status,
  });

  const pipeline = getOrCreatePipeline(pipelinesData, featureId);
  pipeline.current_step = "completed";
  pipeline.status = feature.status;
  pipeline.result = verdict;
  pipelinesData.active_feature = featureId;

  writeJson(FEATURES_FILE, featuresData);
  writePipelines(pipelinesData);

  if (Array.isArray(feature.task_ids) && feature.task_ids.length) {
    const taskStatus = verdict === "approve" ? "done" : "blocked";
    propagateTaskStatus(feature.task_ids, taskStatus);
  }

  updateDashboard();

  console.log(`Feature completed: ${featureId} → ${verdict}`);
}

function watchFiles() {
  console.log("Watching for changes...");

  const filesToWatch = [FEATURES_FILE, PIPELINE_FILE, TASKS_FILE];

  filesToWatch.forEach((file) => {
    if (!fs.existsSync(file)) return;

    fs.watch(file, { persistent: true }, () => {
      console.log(`Change detected in: ${file}`);
      updateDashboard();
    });
  });
}

const args = process.argv.slice(2);
const command = args[0];
const flags = new Set(args.filter((a) => a.startsWith("--") && !a.includes("=")));
const flagValues = {};
args
  .filter((a) => a.startsWith("--") && a.includes("="))
  .forEach((a) => {
    const [key, ...rest] = a.slice(2).split("=");
    flagValues[key] = rest.join("=");
  });

// Поддержка формата --tasks 0.2,0.3 (без =)
const tasksFlagIdx = args.indexOf("--tasks");
if (tasksFlagIdx !== -1 && args[tasksFlagIdx + 1] && !args[tasksFlagIdx + 1].startsWith("--")) {
  flagValues.tasks = args[tasksFlagIdx + 1];
}

const positional = args.filter((a, i) => {
  if (a.startsWith("--")) return false;
  // Пропускаем значение после --tasks (если было передано через пробел)
  if (i > 0 && args[i - 1] === "--tasks") return false;
  return true;
});

if (command === "create-feature") {
  const featureName = positional.slice(1).join(" ");
  const tasks = parseTaskIds(flagValues.tasks);
  createFeature(featureName, { tasks });
} else if (command === "set-step") {
  setStep(positional[1], positional[2], { force: flags.has("--force") });
} else if (command === "retry") {
  retryFeature(positional[1], positional[2]);
} else if (command === "complete") {
  completeFeature(positional[1], positional.slice(2).join(" "));
} else if (command === "bind-tasks") {
  bindTasks(positional[1], positional[2]);
} else if (command === "set-task-status") {
  setTaskStatusCommand(positional[1], positional[2]);
} else if (flags.has("--watch")) {
  updateDashboard();
  watchFiles();
} else {
  updateDashboard();
}
