function createSuccessResponse(result, meta = {}) {
  return {
    data: {
      result,
      result_info: meta,
      success: true,
      errors: [],
      messages: []
    }
  };
}

function createErrorResponse(message) {
  return {
    response: {
      data: {
        errors: [{ message }]
      }
    }
  };
}

export class FakeApiClient {
  constructor() {
    this.zones = new Map();
    this.records = new Map();
    this.recordCounter = 1;
    this.zoneCounter = 1;

    this.addZone = this.addZone.bind(this);
    this.removeZone = this.removeZone.bind(this);
    this.setDevelopmentMode = this.setDevelopmentMode.bind(this);
    this.addRecord = this.addRecord.bind(this);
    this.findRecord = this.findRecord.bind(this);
    this.getRecord = this.getRecord.bind(this);
    this.editRecord = this.editRecord.bind(this);
    this.removeRecord = this.removeRecord.bind(this);
    this.purgeCache = this.purgeCache.bind(this);
    this.setAlwaysUseHttps = this.setAlwaysUseHttps.bind(this);
    this.findZones = this.findZones.bind(this);
  }

  findZones(query) {
    const zones = Array.from(this.zones.values()).filter((zone) => {
      if (!query || !query.name) {
        return true;
      }
      return zone.name === query.name;
    });
    return Promise.resolve(createSuccessResponse(zones, { total_pages: 1, count: zones.length }));
  }

  addZone(name) {
    const zone = {
      id: `zone-${this.zoneCounter++}`,
      name,
      status: 'active',
      plan: { name: 'free' },
      account: { name: 'fake-account' }
    };
    this.zones.set(zone.id, zone);
    return Promise.resolve(createSuccessResponse(zone));
  }

  removeZone(zoneId) {
    const zone = this.zones.get(zoneId);
    if (!zone) {
      return Promise.reject(createErrorResponse('Zone not found'));
    }
    this.zones.delete(zoneId);
    return Promise.resolve(createSuccessResponse({ id: zoneId }));
  }

  setDevelopmentMode(zoneId, enable) {
    const zone = this.zones.get(zoneId);
    if (!zone) {
      return Promise.reject(createErrorResponse('Zone not found'));
    }
    zone.development_mode = enable;
    return Promise.resolve(createSuccessResponse(zone));
  }

  addRecord(zoneId, options) {
    const zone = this.zones.get(zoneId);
    if (!zone) {
      return Promise.reject(createErrorResponse('Zone not found'));
    }

    const record = {
      id: `record-${this.recordCounter++}`,
      type: options.type || 'CNAME',
      name: `${options.name}.${zone.name}`,
      content: options.content,
      ttl: options.ttl || 1,
      proxied: false,
      zone_id: zoneId,
      zone_name: zone.name
    };

    const zoneRecords = this.records.get(zoneId) || [];
    zoneRecords.push(record);
    this.records.set(zoneId, zoneRecords);

    return Promise.resolve(createSuccessResponse(record));
  }

  findRecord(zoneId, query = {}) {
    const zone = this.zones.get(zoneId);
    if (!zone) {
      return Promise.reject(createErrorResponse('Zone not found'));
    }

    const zoneRecords = this.records.get(zoneId) || [];
    const matches = zoneRecords.filter((record) => {
      if (query.name && !record.name.includes(query.name)) {
        return false;
      }
      if (query.content && record.content !== query.content) {
        return false;
      }
      if (query.type && record.type !== query.type) {
        return false;
      }
      if (query.query) {
        const nestedQuery = query.query;
        if (nestedQuery.name && !record.name.includes(nestedQuery.name)) {
          return false;
        }
        if (nestedQuery.content && record.content !== nestedQuery.content) {
          return false;
        }
        if (nestedQuery.type && record.type !== nestedQuery.type) {
          return false;
        }
      }
      return true;
    });

    return Promise.resolve(createSuccessResponse(matches, { total_pages: 1, count: matches.length }));
  }

  getRecord(zoneId, recordId) {
    const zone = this.zones.get(zoneId);
    if (!zone) {
      return Promise.reject(createErrorResponse('Zone not found'));
    }

    const zoneRecords = this.records.get(zoneId) || [];
    const record = zoneRecords.find((item) => item.id === recordId);
    if (!record) {
      return Promise.reject(createErrorResponse('Record not found'));
    }
    return Promise.resolve(createSuccessResponse(record));
  }

  editRecord(zoneId, recordId, options) {
    const zone = this.zones.get(zoneId);
    if (!zone) {
      return Promise.reject(createErrorResponse('Zone not found'));
    }

    const zoneRecords = this.records.get(zoneId) || [];
    const record = zoneRecords.find((item) => item.id === recordId);
    if (!record) {
      return Promise.reject(createErrorResponse('Record not found'));
    }

    if (options.content !== undefined) {
      record.content = options.content;
    }
    if (options.type !== undefined) {
      record.type = options.type;
    }
    if (options.name !== undefined) {
      record.name = `${options.name}.${zone.name}`;
    }

    return Promise.resolve(createSuccessResponse(record));
  }

  removeRecord(zoneId, recordId) {
    const zone = this.zones.get(zoneId);
    if (!zone) {
      return Promise.reject(createErrorResponse('Zone not found'));
    }

    const zoneRecords = this.records.get(zoneId) || [];
    const remaining = zoneRecords.filter((item) => item.id !== recordId);
    this.records.set(zoneId, remaining);
    return Promise.resolve(createSuccessResponse({ id: recordId }));
  }

  purgeCache(zoneId) {
    const zone = this.zones.get(zoneId);
    if (!zone) {
      return Promise.reject(createErrorResponse('Zone not found'));
    }
    return Promise.resolve(createSuccessResponse({ id: zoneId }));
  }

  setAlwaysUseHttps(zoneId, enable) {
    const zone = this.zones.get(zoneId);
    if (!zone) {
      return Promise.reject(createErrorResponse('Zone not found'));
    }
    zone.always_use_https = enable;
    return Promise.resolve(createSuccessResponse(zone));
  }
}
