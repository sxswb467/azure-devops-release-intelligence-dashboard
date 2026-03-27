import { all, getOne, execute } from "./db.js";

async function callOpenAI(prompt, apiKey, model) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      input: prompt
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${text}`);
  }

  const json = await response.json();
  return json.output_text?.trim() || "No AI release note returned.";
}

function deriveRiskFlags(builds, workItems, pullRequests) {
  const flags = [];
  if (builds.some((item) => item.status === "Failed")) {
    flags.push("At least one pipeline is failing.");
  }
  if (builds.some((item) => item.status === "PartiallySucceeded")) {
    flags.push("A deployment reported partial success and needs review.");
  }
  if (workItems.some((item) => item.state !== "Done" && item.state !== "Closed")) {
    flags.push("There are unfinished work items in the current release scope.");
  }
  if (pullRequests.some((item) => item.status === "Active")) {
    flags.push("At least one pull request is still active.");
  }
  return flags;
}

function templateSummary(project, builds, workItems, pullRequests, flags) {
  const successfulBuilds = builds.filter((item) => item.status === "Succeeded").length;
  return [
    `${project.name} release snapshot: ${successfulBuilds}/${builds.length} tracked builds succeeded.`,
    `There are ${workItems.length} scoped work items and ${pullRequests.length} release-related pull requests.`,
    flags.length ? `Primary risks: ${flags.join(" ")}` : "No major release blockers detected.",
    "Recommended next step: review the highlighted pipeline and close any active work before promoting to production."
  ].join(" ");
}

export async function getProjects() {
  return all(`SELECT * FROM projects ORDER BY id`);
}

export async function getDashboard(projectKey, { openAiKey, openAiModel }) {
  const snapshot = getOne(
    `SELECT * FROM release_snapshots WHERE project_key = ? ORDER BY created_at DESC LIMIT 1`,
    [projectKey]
  );
  const project = getOne(`SELECT * FROM projects WHERE key = ?`, [projectKey]);

  if (!snapshot || !project) {
    throw new Error("Project snapshot not found.");
  }

  const builds = JSON.parse(snapshot.builds_json);
  const workItems = JSON.parse(snapshot.work_items_json);
  const pullRequests = JSON.parse(snapshot.pull_requests_json);
  const flags = deriveRiskFlags(builds, workItems, pullRequests);

  let summary = snapshot.release_note;
  if (openAiKey) {
    const prompt = `
You are a release intelligence assistant.
Summarize this Azure DevOps release snapshot for engineering leadership.

Project: ${project.name}

Builds:
${builds.map((b) => `${b.pipeline}: ${b.status} (${b.branch})`).join("\n")}

Work items:
${workItems.map((w) => `${w.type} ${w.id}: ${w.title} - ${w.state}`).join("\n")}

Pull requests:
${pullRequests.map((p) => `PR ${p.id}: ${p.title} - ${p.status}`).join("\n")}

Risk flags:
${flags.join("\n") || "None"}

Return a concise executive summary plus next steps.
    `.trim();

    summary = await callOpenAI(prompt, openAiKey, openAiModel);
  } else {
    summary = templateSummary(project, builds, workItems, pullRequests, flags);
  }

  return {
    project,
    builds,
    workItems,
    pullRequests,
    riskFlags: flags,
    releaseSummary: summary
  };
}

export async function refreshSnapshot(projectKey) {
  const snapshot = getOne(
    `SELECT * FROM release_snapshots WHERE project_key = ? ORDER BY created_at DESC LIMIT 1`,
    [projectKey]
  );
  if (!snapshot) throw new Error("Snapshot not found.");

  execute(
    `INSERT INTO release_snapshots (project_key, builds_json, work_items_json, pull_requests_json, release_note, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      projectKey,
      snapshot.builds_json,
      snapshot.work_items_json,
      snapshot.pull_requests_json,
      snapshot.release_note,
      new Date().toISOString()
    ]
  );

  return { ok: true };
}
