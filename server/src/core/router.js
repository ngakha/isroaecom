const express = require('express');
const path = require('path');
const fs = require('fs');

/**
 * Auto-Router: Automatically discovers and registers module routes.
 * Inspired by Strapi's content-type router.
 *
 * Each module in /modules/{name}/ must have a {name}.routes.js file
 * that exports an Express Router.
 */
class AutoRouter {
  constructor(app) {
    this.app = app;
    this.registeredModules = [];
  }

  /**
   * Scan the modules directory and auto-register all routes
   */
  loadModules() {
    const modulesDir = path.join(__dirname, '..', 'modules');
    const modules = fs.readdirSync(modulesDir).filter((dir) => {
      return fs.statSync(path.join(modulesDir, dir)).isDirectory();
    });

    for (const moduleName of modules) {
      this.registerModule(moduleName, modulesDir);
    }

    console.log(`[Router] Loaded ${this.registeredModules.length} modules: ${this.registeredModules.join(', ')}`);
  }

  /**
   * Register a single module's routes
   */
  registerModule(moduleName, modulesDir) {
    const routesFile = path.join(modulesDir, moduleName, `${moduleName}.routes.js`);

    if (!fs.existsSync(routesFile)) {
      return;
    }

    try {
      const router = require(routesFile);
      const prefix = `/api/${moduleName}`;
      this.app.use(prefix, router);
      this.registeredModules.push(moduleName);
    } catch (error) {
      console.error(`[Router] Failed to load module "${moduleName}":`, error.message);
    }
  }
}

module.exports = AutoRouter;
