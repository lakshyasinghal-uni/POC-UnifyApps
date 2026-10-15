def p = { String k -> binding.hasVariable(k) ? binding.getVariable(k) : null }
def slurp = { s -> if (s == null || s == '') { return null }; if (s instanceof Map || s instanceof List) { return s }; try { return new groovy.json.JsonSlurper().parseText(s.toString()) } catch (e) { return null } }
def rows = { r -> if (r instanceof Map) { r = r.objects }; def out = []; if (r) { r.each { x -> def m = [:]; if (x.properties instanceof Map) { m.putAll(x.properties) }; m.id = x.id; out << m } }; return out }
def num = { v -> if (v == null) { return null }; try { return Double.parseDouble(v.toString()) } catch (e) { return null } }
def r1 = { double d -> Math.round(d * 10.0d) / 10.0d }
def PERCENT = ['satisfaction','health_score','completion','resolution','digital_adoption','risk_score','accessibility'] as Set
def SIGNED = ['sentiment'] as Set
def clampM = { String k, double v -> PERCENT.contains(k) ? Math.max(0.0d, Math.min(100.0d, v)) : (SIGNED.contains(k) ? Math.max(-100.0d, Math.min(100.0d, v)) : v) }
def band = { double h -> h >= 80 ? 'LOW' : (h >= 70 ? 'MEDIUM' : 'HIGH') }
def mk = { String id, Map f -> [id: id, updateFields: f.collect { k, v -> [fieldName: k, actionType: 'SET', setValue: v] }] }
def scn = rows(p('scenario'))
if (!scn) { return [error: 'scenario not found', scenario: '', name: '', reset: false, entityUpdates: [], regionUpdates: [], scenarioUpdates: [], changed: 0] }
def s = scn[0]
def payload = slurp(s.payload_json) ?: [:]
def isReset = (payload.reset == true)
def apply = { List current, List deltas ->
  def updates = []
  if (isReset) {
    current.each { r -> def base = slurp(r.baseline_json); if (base instanceof Map && base) { updates << mk(r.id.toString(), base) } }
    return updates
  }
  def byId = [:]
  current.each { r -> byId[r.id.toString()] = r }
  (deltas ?: []).each { d ->
    def r = byId[d.code?.toString()]
    if (r != null) {
      def f = [:]
      d.each { k, v ->
        if (k != 'code') {
          if (v instanceof Number) { def cur = num(r[k]) ?: 0.0d; f[k] = r1(clampM(k.toString(), cur + (v as double))) } else { f[k] = v }
        }
      }
      if (f.containsKey('health_score')) { f['risk_band'] = band(f['health_score'] as double) }
      if (f) { updates << mk(r.id.toString(), f) }
    }
  }
  return updates
}
def eu = apply(rows(p('entities')), payload.entity as List)
def ru = apply(rows(p('regions')), payload.region as List)
def now = new java.sql.Timestamp(System.currentTimeMillis()).toString()
def su = rows(p('allScenarios')).collect { x -> def on = (!isReset && x.id == s.id); mk(x.id.toString(), [is_active: on, applied_at: (on ? now : '')]) }
return [scenario: s.id, name: s.name_en, reset: isReset, entityUpdates: eu, regionUpdates: ru, scenarioUpdates: su, changed: eu.size() + ru.size()]