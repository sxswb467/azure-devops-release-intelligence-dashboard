import { http, HttpResponse } from "msw";
import { mockDashboardDanger, mockHealth, mockProjects } from "./mockData.js";

const BASE = "http://localhost:4100/api";

export const handlers = [
  http.get(`${BASE}/projects`, () => HttpResponse.json(mockProjects)),

  http.get(`${BASE}/health`, () => HttpResponse.json(mockHealth)),

  http.get(`${BASE}/dashboard`, ({ request }) => {
    const project = new URL(request.url).searchParams.get("project");
    if (project === "unknown") {
      return HttpResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return HttpResponse.json(mockDashboardDanger);
  }),

  http.post(`${BASE}/refresh`, () => HttpResponse.json({ ok: true }))
];
