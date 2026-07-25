const scenario = process.argv[2] ?? 'baseline';
const supported = new Set(['baseline']);
if (!supported.has(scenario)) {
  console.error(`LOCAL_QA_SCENARIO_UNAVAILABLE: ${scenario}. Apenas baseline é suportado sem alterar schema ou fabricar estados.`);
  process.exit(2);
}
console.log(JSON.stringify({ environment: 'local', scenario, deterministic: true, reversible: true, data_source: 'local_qa', note: 'Baseline usa os dados hidratados; demais cenários requerem contrato dedicado.' }));
