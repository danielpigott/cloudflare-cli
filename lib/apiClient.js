const axios = require('axios');

/**
 *
 * @param email
 * @param key
 * @constructor
 */
function ApiClient(email, key) {
  this.client = axios.create({
    baseURL: 'https://api.cloudflare.com/client/v4',
    timeout: 5000
  });
  this.client.defaults.headers.common['X-Auth-Email'] = email;
  this.client.defaults.headers.common['X-Auth-Key'] = key;

  this.addZone = addZone;
  this.removeZone = removeZone;
  this.findZones = findZones;
  this.setDevelopmentMode = setDevelopmentMode;
  this.addRecord = addRecord;
  this.findRecord = findRecord;
  this.getRecord = getRecord;
  this.editRecord = editRecord;
  this.removeRecord = removeRecord;
  this.purgeCache = purgeCache;

  /**
   * Find zones matching the given query
   * @param query
   */
  function findZones(query) {
    return this.client.get('/zones', {params: query});
  }

  /**
   *
   * @param domain
   * @returns {AxiosPromise<any>}
   */
  function addZone(domain) {
    return this.client.post('/zones', {name: domain});
  }

  /**
   *
   * @param zoneId
   * @returns {*}
   */
  function removeZone(zoneId) {
    return this.client.delete(`/zones/${zoneId}`);
  }

  /**
   *
   * @param zoneId
   * @param enable
   * @returns {AxiosPromise<any>}
   */
  function setDevelopmentMode(zoneId, enable) {
    return this.client.patch(`/zones/${zoneId}/settings/development_mode`, {value: enable});
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

  /**
   *
   * @param zoneId
   * @param query
   * @returns {*}
   */
  function findRecord(zoneId, query) {
    return this.client.get(`zones/${zoneId}/dns_records`, {params: query});
  }

  /**
   *
   * @param zoneId
   * @param recordId
   * @returns {*}
   */
  function getRecord(zoneId, recordId) {
    return this.client.get(`zones/${zoneId}/dns_records/${recordId}`);
  }

  /**
   *
   * @param zoneId
   * @param recordId
   * @param options
   * @returns {AxiosPromise<any> | IDBRequest | Promise<void>}
   */
  function editRecord(zoneId, recordId, options) {
    return this.client.put(`/zones/${zoneId}/dns_records/${recordId}`, options);
  }

  /**
   *
   * @param zoneId
   * @param recordId
   * @returns {*}
   */
  function removeRecord(zoneId, recordId) {
    return this.client.delete(`zones/${zoneId}/dns_records/${recordId}`);
  }

  /**
   *
   * @param zoneId
   * @param options
   * @returns {AxiosPromise<any>}
   */
  function purgeCache(zoneId, options) {
    return this.client.post(`zones/${zoneId}/purge_cache`, options);
  }


}


module.exports = ApiClient;