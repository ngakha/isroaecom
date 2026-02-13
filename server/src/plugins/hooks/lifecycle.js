/**
 * Lifecycle Hooks System
 *
 * Allows modules to define hooks that run before/after
 * database operations, similar to Strapi's model lifecycle hooks.
 *
 * Usage in a module:
 *   const hooks = new LifecycleHooks('products');
 *   hooks.register('beforeCreate', async (data) => { ... });
 *   hooks.register('afterCreate', async (result) => { ... });
 */
class LifecycleHooks {
  constructor(moduleName) {
    this.moduleName = moduleName;
    this.hooks = {
      beforeCreate: [],
      afterCreate: [],
      beforeUpdate: [],
      afterUpdate: [],
      beforeDelete: [],
      afterDelete: [],
      beforeFind: [],
      afterFind: [],
    };
  }

  /**
   * Register a hook callback
   */
  register(event, callback) {
    if (!this.hooks[event]) {
      throw new Error(`Unknown lifecycle event: ${event}`);
    }
    this.hooks[event].push(callback);
  }

  /**
   * Execute all hooks for an event
   */
  async run(event, data) {
    if (!this.hooks[event]) return data;

    let result = data;
    for (const hook of this.hooks[event]) {
      const hookResult = await hook(result);
      if (hookResult !== undefined) {
        result = hookResult;
      }
    }
    return result;
  }
}

module.exports = LifecycleHooks;
