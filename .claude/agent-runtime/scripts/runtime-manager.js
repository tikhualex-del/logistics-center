const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const STATE_DIR = path.join(ROOT, "state");

const FEATURES_FILE = path.join(STATE_DIR, "features.json");
const PIPELINE_FILE = path.join(STATE_DIR, "pipeline-status.json");
const DASHBOARD_FILE = path.join(STATE_DIR, "dashboard.md");

const TERMINAL_STATUSES = new Set(["done", "rejected"]);
const TERMINAL_VERDICTS = new Set(["approve", "reject"]);
const RETRY_VERDICTS = new Set(["approve-with-fixes"]);

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

  // Уже новый формат
  if (raw.pipelines && typeof raw.pipelines === "object") {
    return {
      active_feature: raw.active_feature ?? null,
      pipelines: raw.pipelines,
    };
  }

  // Миграция со старой плоской схемы { feature, current_step, status, version, result }
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

function buildDashboard(featuresData, pipelinesData) {
  const now = formatTimestamp(new Date());
  const features = Array.isArray(featuresData.features) ? featuresData.features : [];

  const STATUS_LABELS = {
    created: "создана",
    in_progress: "в работе",
    retry: "на доработке",
    done: "завершена",
    rejected: "отклонена",
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

  const featureRows = features.length
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

          return `| ${feature.id} | ${feature.name} | ${labelStatus(status)} | ${labelStep(step)} | ${version} | ${labelVerdict(verdict)} | ${nextAction} |`;
        })
        .join("\n")
    : `| — | — | простаивает | — | — | — | создайте первую фичу |`;

  const activePipelineEntries = Object.entries(pipelinesData.pipelines).filter(
    ([, p]) => !TERMINAL_STATUSES.has(p.status)
  );

  const pipelineRows = activePipelineEntries.length
    ? activePipelineEntries
        .map(([id, p]) => {
          const marker = pipelinesData.active_feature === id ? "★" : " ";
          return `| ${marker} | ${id} | ${labelStep(p.current_step ?? "none")} | ${labelStatus(p.status ?? "idle")} | v${p.version ?? 1} | ${labelVerdict(p.result ?? "pending")} |`;
        })
        .join("\n")
    : `| — | — | — | простаивает | — | — |`;

  return `# Дашборд агентного runtime

Обновлено: ${now}

## Обзор фич

| Feature ID | Название | Статус | Текущий шаг | Версия | Вердикт | Следующее действие |
|------------|----------|--------|-------------|--------|---------|--------------------|
${featureRows}

---

## Активные pipeline

★ — последняя активная фича (текущий фокус). Несколько pipeline могут идти параллельно.

| ★ | Feature ID | Текущий шаг | Статус | Версия | Результат |
|---|------------|-------------|--------|--------|-----------|
${pipelineRows}

---

## Статусы

- \`created\` — фича создана
- \`in_progress\` — в работе
- \`retry\` — возвращена на доработку
- \`done\` — завершена
- \`rejected\` — отклонена

---

## Шаги pipeline

- \`planner\` — планировщик
- \`backend-implementer\` — backend-разработчик
- \`frontend-implementer\` — frontend-разработчик
- \`operations-ux-reviewer\` — UX-ревьюер
- \`reviewer\` — финальный ревьюер
- \`completed\` — pipeline завершён
`;
}

function updateDashboard() {
  const featuresData = readJson(FEATURES_FILE, { features: [] });
  const pipelinesData = readPipelines();

  const dashboard = buildDashboard(featuresData, pipelinesData);
  writeFile(DASHBOARD_FILE, dashboard);

  console.log("Dashboard updated:");
  console.log(DASHBOARD_FILE);
}

function isSlugInUseActive(featuresData, slug) {
  return featuresData.features.find(
    (f) => f.name === slug && !TERMINAL_STATUSES.has(f.status)
  );
}

function createFeature(featureName) {
  if (!featureName || !featureName.trim()) {
    console.error('Feature name is required. Example: create-feature "orders map"');
    process.exit(1);
  }

  const featuresData = readJson(FEATURES_FILE, { features: [] });
  const pipelinesData = readPipelines();

  const slug = slugify(featureName);
  const conflict = isSlugInUseActive(featuresData, slug);
  if (conflict) {
    console.error(
      `Active feature with name "${slug}" already exists (${conflict.id}, status=${conflict.status}). Complete or reject it first, or use a different name.`
    );
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
    history: [
      {
        version: 1,
        status: "created",
      },
    ],
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
  updateDashboard();

  console.log(`Feature created: ${id} (${slug})`);
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
  updateDashboard();

  console.log(`Feature completed: ${featureId} → ${verdict}`);
}

function watchFiles() {
  console.log("Watching for changes...");

  const filesToWatch = [FEATURES_FILE, PIPELINE_FILE];

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
const flags = new Set(args.filter((a) => a.startsWith("--")));
const positional = args.filter((a) => !a.startsWith("--"));

if (command === "create-feature") {
  const featureName = positional.slice(1).join(" ");
  createFeature(featureName);
} else if (command === "set-step") {
  setStep(positional[1], positional[2], { force: flags.has("--force") });
} else if (command === "retry") {
  retryFeature(positional[1], positional[2]);
} else if (command === "complete") {
  completeFeature(positional[1], positional.slice(2).join(" "));
} else if (flags.has("--watch")) {
  updateDashboard();
  watchFiles();
} else {
  updateDashboard();
}
