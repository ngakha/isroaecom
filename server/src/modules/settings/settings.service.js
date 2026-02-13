const { getDatabase } = require('../../core/database');
const { AppError } = require('../../core/middleware/error-handler');

class SettingsService {
  constructor() {
    this.db = () => getDatabase();
  }

  /**
   * Get all settings as key-value pairs
   */
  async getAll() {
    const db = this.db();
    const rows = await db('settings').orderBy('group').orderBy('key');

    // Group settings by their group
    const settings = {};
    for (const row of rows) {
      if (!settings[row.group]) settings[row.group] = {};
      settings[row.group][row.key] = this.parseValue(row.value, row.type);
    }

    return settings;
  }

  /**
   * Get a single setting by key
   */
  async get(key) {
    const db = this.db();
    const setting = await db('settings').where({ key }).first();
    if (!setting) return null;
    return this.parseValue(setting.value, setting.type);
  }

  /**
   * Get settings by group
   */
  async getByGroup(group) {
    const db = this.db();
    const rows = await db('settings').where({ group });

    const settings = {};
    for (const row of rows) {
      settings[row.key] = this.parseValue(row.value, row.type);
    }

    return settings;
  }

  /**
   * Update multiple settings at once
   */
  async updateBatch(settings) {
    const db = this.db();

    for (const [key, value] of Object.entries(settings)) {
      const existing = await db('settings').where({ key }).first();

      if (existing) {
        await db('settings').where({ key }).update({
          value: String(value),
          updated_at: new Date(),
        });
      } else {
        await db('settings').insert({
          key,
          value: String(value),
          type: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string',
          group: 'custom',
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    }

    return this.getAll();
  }

  /**
   * Update a single setting
   */
  async set(key, value, group = 'custom', type = 'string') {
    const db = this.db();
    const existing = await db('settings').where({ key }).first();

    if (existing) {
      await db('settings').where({ key }).update({
        value: String(value),
        updated_at: new Date(),
      });
    } else {
      await db('settings').insert({
        key,
        value: String(value),
        type,
        group,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    return this.get(key);
  }

  parseValue(value, type) {
    switch (type) {
      case 'boolean':
        return value === 'true';
      case 'number':
        return parseFloat(value);
      case 'json':
        try { return JSON.parse(value); } catch { return value; }
      default:
        return value;
    }
  }
}

module.exports = new SettingsService();
