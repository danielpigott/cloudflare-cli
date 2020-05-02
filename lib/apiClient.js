const axios = require('axios');

/**
 *
 * @param key API Token or API key (when used with email)
 * @param email optionally provide email to use API Key (deprecated)
 *
 * @constructor
 */
function ApiClient(key, email) {
  const client = axios.create({
    baseURL: 'https://api.cloudflare.com/client/v4',
    timeout: 20000
  });

  // if email is left blank, assume API token instead of API key.
  if (email === undefined) {
    client.defaults.headers.common['Authorization'] = "Bearer " + key;
  } else {
    client.defaults.headers.common['X-Auth-Email'] = email;
    client.defaults.headers.common['X-Auth-Key'] = key;
  }

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
    return client.get('/zones', {params: query});
  }

  /**
   *
   * @param domain
   * @returns {AxiosPromise<any>}
   */
  function addZone(domain) {
    return client.post('/zones', {name: domain});
  }

  /**
   *
   * @param zoneId
   * @returns {*}
   */
  function removeZone(zoneId) {
    return client.delete(`/zones/${zoneId}`);
  }

  /**
   *
   * @param zoneId
   * @param enable
   * @returns {AxiosPromise<any>}
   */
  function setDevelopmentMode(zoneId, enable) {
    return client.patch(`/zones/${zoneId}/settings/development_mode`, {value: enable});
  }


  /**
   *
   * @param zoneId
   * @param options
   * @returns {AxiosPromise<any>}
   */
  function addRecord(zoneId, options) {
    return client.post('/zones/' + zoneId + '/dns_records', options);
  }

  /**
   *
   * @param zoneId
   * @param query
   * @returns {*}
   */
  function findRecord(zoneId, query) {
    return client.get(`zones/${zoneId}/dns_records`, {params: query});
  }

  /**
   *
   * @param zoneId
   * @param recordId
   * @returns {*}
   */
  function getRecord(zoneId, recordId) {
    return client.get(`zones/${zoneId}/dns_records/${recordId}`);
  }

  /**
   *
   * @param zoneId
   * @param recordId
   * @param options
   * @returns {AxiosPromise<any> | IDBRequest | Promise<void>}
   */
  function editRecord(zoneId, recordId, options) {
    return client.put(`/zones/${zoneId}/dns_records/${recordId}`, options);
  }

  /**
   *
   * @param zoneId
   * @param recordId
   * @returns {*}
   */
  function removeRecord(zoneId, recordId) {
    return client.delete(`zones/${zoneId}/dns_records/${recordId}`);
  }

  /**
   *
   * @param zoneId
   * @param options
   * @returns {AxiosPromise<any>}
   */
  function purgeCache(zoneId, options) {
    return client.post(`zones/${zoneId}/purge_cache`, options);
  }


}


module.exports = ApiClient;
