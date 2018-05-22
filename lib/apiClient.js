var axios = require('axios');

function ApiClient(email, key) {
  this.client = axios.create({
    baseURL: 'https://api.cloudflare.com/client/v4',
    timeout: 5000
  });
  this.client.defaults.headers.common['X-Auth-Email'] = email;
  this.client.defaults.headers.common['X-Auth-Key'] = key;

  this.findZones = findZones;
  this.addRecord = addRecord;
  this.findRecord = findRecord;
  this.getRecord = getRecord;
  this.editRecord = editRecord;
  this.removeRecord = removeRecord;
  this.purgeCache = purgeCache;

  /**
   *
   * @param query
   */
  function findZones(query) {
    return this.client.get('/zones', {params: query});
  }


  /**
   *
   * @param zoneId
   * @param options
   * @returns {AxiosPromise<any>}
   */
  function addRecord(zoneId, options) {
    return this.client.post('/zones/' + zoneId + '/dns_records', options);
  }

  function findRecord(zoneId, query) {
    return this.client.get(`zones/${zoneId}/dns_records`, {params: query});
  }

  function getRecord(zoneId, recordId) {
    return this.client.get(`zones/${zoneId}/dns_records/${recordId}`);
  }

  function editRecord(zoneId, recordId, options) {
    return this.client.put(`/zones/${zoneId}/dns_records/${recordId}`, options);
  }

  function removeRecord(zoneId, recordId) {
    return this.client.delete(`zones/${zoneId}/dns_records/${recordId}`);
  }

  function purgeCache(zoneId, options) {
    return this.client.post(`zones/${zoneId}/purge_cache`, options);
  }


}


module.exports = ApiClient;