const message = 'The AI provider is unavailable. No analysis was generated or saved. Check the provider configuration or connection, then try again.';

function unavailableReport() {
  return { status: 'unavailable', message, next_step: 'Retry after the provider is available.' };
}

async function sendIfUnavailable(res, error, options = {}) {
  if (error.code !== 'AI_PROVIDER_UNAVAILABLE') return false;
  const report = unavailableReport();
  if (options.db && options.table && options.id) {
    let selected;
    try { selected = await options.db.query(`SELECT * FROM ${options.table} WHERE id = $1`, [options.id]); }
    catch { return false; }
    if (!selected.rows.length) return false;
    return res.json({ unavailable: true, analysis: report, record: { ...selected.rows[0], ai_analysis: JSON.stringify(report) } });
  }
  return res.json({ unavailable: true, result: report });
}

module.exports = { sendIfUnavailable, unavailableReport };
