# Metrics route checker after extraction

Symptom: static verification reports missing files at D:/ for /?view=1&tab=overview and meeting-task-manager.

Evidence: the relocated guide has same-origin site navigation; verify_metrics_map_static.py resolves each non-external link against the filesystem. The guide's 18 pages, 40 terms, assets and anchors pass.

Root cause: a filesystem-only assumption in the original checker treats a site-root navigation route as an asset path. Extraction replaces the old authoring-dist link with the approved root route.

Escaped detection: earlier source layout used a relative dist/index.html path and the site packager rewrote it later.

Prevention: recognize only the two approved root navigation routes in the structural checker; retain filesystem validation for asset references. Verify these routes over HTTP after building the complete site. No browser behavior change is needed.
