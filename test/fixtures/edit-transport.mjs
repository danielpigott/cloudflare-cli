import axios from 'axios';

// Replace the transport before the CLI constructs its axios instance.
// There is no HTTP fallback, including for zone lookups.
axios.defaults.adapter = async (config) => {
  let result;
  if (config.method === 'get' && config.url === '/zones') {
    result = [
      { id: 'zone-other', name: 'other.example.net' },
      { id: 'zone-example', name: 'example.com' }
    ].filter(zone => config.params.name === undefined || zone.name === config.params.name);
  } else if (config.method === 'get' && config.url === 'zones/zone-example/dns_records') {
    result = [
      { id: 'record-www', name: 'www.example.com', type: 'A', content: '192.0.2.1', ttl: 120, proxied: false },
      { id: 'record-shared-1', name: 'shared.example.com', type: 'A', content: '192.0.2.1', ttl: 120, proxied: false },
      { id: 'record-shared-2', name: 'shared.example.com', type: 'A', content: '192.0.2.2', ttl: 120, proxied: false }
    ].filter(record => ['name', 'content', 'type'].every(key => config.params[key] === undefined || record[key] === config.params[key]));
  } else if (config.method === 'put' && ['/zones/zone-example/dns_records/record-www', '/zones/zone-example/dns_records/record-shared-2'].includes(config.url)) {
    result = { id: config.url.split('/').at(-1), ...JSON.parse(config.data) };
  } else if (config.method === 'put' && config.url.startsWith('/zones/zone-other/dns_records/')) {
    throw { response: { data: { errors: [{ message: 'Record not found in selected zone' }] } } };
  } else {
    throw new Error(`Unexpected mock request: ${config.method} ${config.url}`);
  }
  return { data: { success: true, result }, status: 200, statusText: 'OK', headers: {}, config };
};
