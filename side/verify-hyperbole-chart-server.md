verify-hyperbole-chart-server ⟜ confirm startChartServerHyperbole serves lineExample correctly

**input** ⟜ implementation to verify

**output** ⟜ [✓/✗] + test results

**instruction**
browser inspection + manual refresh testing:
1. visit localhost:9160, expect HTML structure: doctype, title "prettychart", meta refresh 2s
2. inspect SVG: expect lineExample (blue line, sin(x), x/y axes, grid lines visible)
3. manual refresh: chart persists (confirms state in server)
4. test meta-refresh: wait 2s, verify browser automatically reloads
success: valid HTML rendered, lineExample displays correctly, meta-refresh works.
