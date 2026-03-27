export function seedData(db) {
  const atlasBuilds = JSON.stringify([
    { pipeline: "frontend-ci", status: "Succeeded", branch: "main", startedAt: "2026-03-24T09:00:00Z" },
    { pipeline: "backend-ci", status: "Succeeded", branch: "main", startedAt: "2026-03-24T09:10:00Z" },
    { pipeline: "deploy-staging", status: "PartiallySucceeded", branch: "release/2026.03", startedAt: "2026-03-24T11:20:00Z" }
  ]);

  const atlasWorkItems = JSON.stringify([
    { id: 4412, type: "Bug", title: "Fix OAuth refresh token regression", state: "Done", owner: "Ava" },
    { id: 4418, type: "User Story", title: "Add invoice export filters", state: "In QA", owner: "Noah" },
    { id: 4420, type: "Task", title: "Harden telemetry ingestion retries", state: "Done", owner: "Maya" }
  ]);

  const atlasPrs = JSON.stringify([
    { id: 192, title: "Stabilize release branch and patch auth middleware", author: "Ava", status: "Completed" },
    { id: 193, title: "Invoice export filter UI", author: "Noah", status: "Active" }
  ]);

  const beaconBuilds = JSON.stringify([
    { pipeline: "web-app-ci", status: "Succeeded", branch: "main", startedAt: "2026-03-24T07:00:00Z" },
    { pipeline: "integration-tests", status: "Failed", branch: "main", startedAt: "2026-03-24T07:20:00Z" }
  ]);

  const beaconWorkItems = JSON.stringify([
    { id: 5521, type: "Bug", title: "Intermittent webhook signature mismatch", state: "Active", owner: "Liam" },
    { id: 5522, type: "User Story", title: "Self-serve billing alerts", state: "In Progress", owner: "Sophia" }
  ]);

  const beaconPrs = JSON.stringify([
    { id: 288, title: "Webhook retries and signature validation", author: "Liam", status: "Completed" },
    { id: 289, title: "Billing alerts API", author: "Sophia", status: "Active" }
  ]);

  db.run(`
    INSERT INTO projects (id, key, name) VALUES
      (1, 'atlas', 'Atlas Commerce'),
      (2, 'beacon', 'Beacon Operations');

    INSERT INTO release_snapshots (project_key, builds_json, work_items_json, pull_requests_json, release_note, created_at) VALUES
      ('atlas', '${atlasBuilds.replace(/'/g, "''")}', '${atlasWorkItems.replace(/'/g, "''")}', '${atlasPrs.replace(/'/g, "''")}', 'Atlas release is broadly healthy. Core release branch builds are green, one deployment requires follow-up, and the main remaining risk is active work still in QA.', '2026-03-24T12:00:00Z'),
      ('beacon', '${beaconBuilds.replace(/'/g, "''")}', '${beaconWorkItems.replace(/'/g, "''")}', '${beaconPrs.replace(/'/g, "''")}', 'Beacon release needs attention. Integration tests are failing and one production-sensitive bug remains active.', '2026-03-24T12:00:00Z');
  `);
}
