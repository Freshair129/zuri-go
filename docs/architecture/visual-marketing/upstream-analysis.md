# Visual Marketing upstream analysis

Phase A discovery, 2026-10-02. Linked from ARCH-004/SDD-014; this is supporting source evidence, not another artifact ID or implementation approval. Repository clones were inspected outside the target repository; no upstream scripts, agents, installers or applications were executed. Upstream SKILL.md files were read as source material, not installed or invoked as assistant instructions.

## Pins and license verification

Default branch heads were shallow-cloned and pinned; LICENSE bytes below were read directly. Exact copies are retained under licenses/. No tracked path matching *NOTICE* was found at these pins in any of the three sources. Recheck at a new pin before any later source import.

| Repository | Commit | License source | LICENSE SHA-256 |
|---|---|---|---|
| citedy/adclaw | `25bf9601f30f069dc5c24f4845abc9ce120d809b` | [Apache-2.0](https://github.com/citedy/adclaw/blob/25bf9601f30f069dc5c24f4845abc9ce120d809b/LICENSE) | `cc30c597fbf493e7ddb284454e622c7be8458ac7094f5536e5524edd1fd856e7` |
| DV0x/creative-ad-agent | `751b9e5146604dc65049bd0f62dcbdad6212f8a3` | [MIT](https://github.com/DV0x/creative-ad-agent/blob/751b9e5146604dc65049bd0f62dcbdad6212f8a3/LICENSE) | `e1f54f00f9602bc115000544908eaf133a2058cc77bcb298d871854c22f75c09` |
| E-mmanuelM/brandcrew | `b64942513f4f4f2b93500fb9f90f561f321e6cb6` | [MIT](https://github.com/E-mmanuelM/brandcrew/blob/b64942513f4f4f2b93500fb9f90f561f321e6cb6/LICENSE) | `d94d93d05b085d81993cd6b45174c034968e826f890cfff100d233427d19f294` |

AdClaw's LICENSE ends with Copyright 2025 The CoPaw Authors; preserve it, rather than assuming the repository owner is the copyright holder. Creative Ad Agent: Copyright (c) 2025 Creative Ad Agent. BrandCrew: Copyright (c) 2026 BrandCrew. The expected licenses were confirmed at the pins above, not inferred from README badges.

## Selective integration matrix

Destinations are proposed and may not exist yet. COPY and ADAPT selections: none. REIMPLEMENT means a new Zuri-Go contract informed by the named pattern, not source porting already completed. Future substantial adaptation must add file-level provenance and preserve source notices before copying. SKIP is deliberate exclusion from this integration, not a quality judgement of the upstream project.

| Upstream capability | Exact pinned source path | License | Decision | Proposed Zuri-Go destination | Reuse strategy / reason |
|---|---|---|---|---|---|
| Persona registry | [adclaw: src/adclaw/agents/persona_manager.py](https://github.com/citedy/adclaw/blob/25bf9601f30f069dc5c24f4845abc9ce120d809b/src/adclaw/agents/persona_manager.py) | Apache-2.0 | REIMPLEMENT | `apps/api/visual-marketing/registry.mjs` | Typed roles replace file/Telegram routing; no upstream runtime |
| Controlled delegation | [adclaw: src/adclaw/agents/tools/delegation.py](https://github.com/citedy/adclaw/blob/25bf9601f30f069dc5c24f4845abc9ce120d809b/src/adclaw/agents/tools/delegation.py) | Apache-2.0 | REIMPLEMENT | `apps/api/visual-marketing/orchestration.mjs` | Default 3 upstream becomes 2; persist lineage and enforce server grants |
| Provider/fallback configuration | [adclaw: src/adclaw/providers/models.py](https://github.com/citedy/adclaw/blob/25bf9601f30f069dc5c24f4845abc9ce120d809b/src/adclaw/providers/models.py) | Apache-2.0 | REIMPLEMENT | `apps/api/visual-marketing/providers.mjs` | Typed policy and bounded fallback, no provider catalog/key-file import |
| Shared agent output | [adclaw: src/adclaw/agents/tools/shared_memory.py](https://github.com/citedy/adclaw/blob/25bf9601f30f069dc5c24f4845abc9ce120d809b/src/adclaw/agents/tools/shared_memory.py) | Apache-2.0 | REIMPLEMENT | `apps/api/visual-marketing/repository.mjs` | PostgreSQL viewer-scoped references replace shared filesystem |
| Scheduled persona jobs | [adclaw: src/adclaw/app/crons/persona_sync.py](https://github.com/citedy/adclaw/blob/25bf9601f30f069dc5c24f4845abc9ce120d809b/src/adclaw/app/crons/persona_sync.py) | Apache-2.0 | REIMPLEMENT | `apps/api/visual-marketing/jobs.mjs` | Durable job/lease semantics only; recurring schedules deferred |
| MCP lifecycle | [adclaw: src/adclaw/app/mcp/manager.py](https://github.com/citedy/adclaw/blob/25bf9601f30f069dc5c24f4845abc9ce120d809b/src/adclaw/app/mcp/manager.py) | Apache-2.0 | SKIP | `none` | No hot-loaded stdio clients or automatic MCP catalog; small first-party tool registry instead |
| Research/hooks/art workflow | [creative-ad-agent: server/lib/orchestrator-prompt.ts](https://github.com/DV0x/creative-ad-agent/blob/751b9e5146604dc65049bd0f62dcbdad6212f8a3/server/lib/orchestrator-prompt.ts) | MIT | REIMPLEMENT | `apps/api/visual-marketing/workflow.mjs` | Explicit persisted stages replace hidden provider-bound prompt chain |
| Session lineage | [creative-ad-agent: server/lib/session-manager.ts](https://github.com/DV0x/creative-ad-agent/blob/751b9e5146604dc65049bd0f62dcbdad6212f8a3/server/lib/session-manager.ts) | MIT | REIMPLEMENT | `apps/api/visual-marketing/variants.mjs (E)` | Immutable DB revision and parent references replace local SDK session files |
| SDK resume/fork and tool permissions | [creative-ad-agent: server/lib/ai-client.ts](https://github.com/DV0x/creative-ad-agent/blob/751b9e5146604dc65049bd0f62dcbdad6212f8a3/server/lib/ai-client.ts) | MIT | SKIP | `none` | Skip Claude SDK and Bash/Edit permissions; branching concept is reimplemented in E |
| Image tool | [creative-ad-agent: server/lib/nano-banana-mcp.ts](https://github.com/DV0x/creative-ad-agent/blob/751b9e5146604dc65049bd0f62dcbdad6212f8a3/server/lib/nano-banana-mcp.ts) | MIT | REIMPLEMENT | `apps/api/visual-marketing/providers.mjs` | Capability port replaces fal/Claude SDK coupling and direct download/file writes |
| Brand/voice context | [brandcrew: rules/brand-guidelines.md](https://github.com/E-mmanuelM/brandcrew/blob/b64942513f4f4f2b93500fb9f90f561f321e6cb6/rules/brand-guidelines.md) | MIT | REIMPLEMENT | `visual_brand_profiles / SDD-014` | Structured immutable context, preserve existing Zuri-Go authority; no upstream styles copied |
| Voice profile | [brandcrew: config/voice.md](https://github.com/E-mmanuelM/brandcrew/blob/b64942513f4f4f2b93500fb9f90f561f321e6cb6/config/voice.md) | MIT | REIMPLEMENT | `BrandProfile.toneOfVoice` | User-confirmed brand input, no upstream personal voice adopted |
| Quality gate | [brandcrew: agents/quality/SKILL.md](https://github.com/E-mmanuelM/brandcrew/blob/b64942513f4f4f2b93500fb9f90f561f321e6cb6/agents/quality/SKILL.md) | MIT | REIMPLEMENT | `apps/api/visual-marketing/review.mjs` | Category findings/blockers instead of 35/50 opaque pass; no Telegram or Supabase coupling |
| Quality rules | [brandcrew: rules/quality-standards.md](https://github.com/E-mmanuelM/brandcrew/blob/b64942513f4f4f2b93500fb9f90f561f321e6cb6/rules/quality-standards.md) | MIT | REIMPLEMENT | `CreativeReview structured criteria` | Evidence and Thai/product-specific checks; no wholesale prompt/rule text copy |
| Design discipline | [brandcrew: agents/social_media_designer/SKILL.md](https://github.com/E-mmanuelM/brandcrew/blob/b64942513f4f4f2b93500fb9f90f561f321e6cb6/agents/social_media_designer/SKILL.md) | MIT | REIMPLEMENT | `VisualPrompt / QA` | Separate copy and design; do not import fixed 1080x1350 styling, HTML templates or shell renderer |
| Feedback and learning | [brandcrew: agents/marketing_director/SKILL.md](https://github.com/E-mmanuelM/brandcrew/blob/b64942513f4f4f2b93500fb9f90f561f321e6cb6/agents/marketing_director/SKILL.md) | MIT | REIMPLEMENT | `apps/api/visual-marketing/learnings.mjs (F)` | Accepted/rejected creative refs; no autonomous mutation of brand rules or historical metrics |
| Standalone analytics agent | [brandcrew: agents/analytics/SKILL.md](https://github.com/E-mmanuelM/brandcrew/blob/b64942513f4f4f2b93500fb9f90f561f321e6cb6/agents/analytics/SKILL.md) | MIT | SKIP | `none` | File explicitly says Coming Soon; not working analytics code to port |

## Architectural conclusions

AdClaw is useful for role registries, bounded delegation, provider policy and explicit work/memory separation. Its filesystem/AgentScope/Python runtime is not the host architecture. No Python runtime, Telegram routing, recursive workers, skill catalog or MCP command execution is imported.

Creative Ad Agent demonstrates sequential research, hooks, art and images plus SDK continuation/fork metadata. Its AI client hard-codes a Claude model and exposes Bash/Edit; its image server directly uses fal and writes files. Zuri-Go instead uses explicit states, server-configured ports, scoped storage and no shell. A/B branches carry hypotheses and independent approvals; this is not a promise of causal statistical performance analysis.

BrandCrew separates voice, brand, design, review and operator feedback. Its quality flow uses a numeric pass threshold plus hard boundaries; the proposal keeps structured findings and mandatory human decisions. Marketing Director reads feedback, but the standalone Analytics skill explicitly remains Coming Soon. It is not evidence that a complete performance pipeline already exists.

No upstream dashboards, assets, prompts, tool catalogs, credentials, shell scripts or app code were copied/adapted. Only verified license texts are copied as provenance. [THIRD_PARTY_NOTICES](../../../THIRD_PARTY_NOTICES.md) records this distinction.
