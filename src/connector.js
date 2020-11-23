import os from 'os';
import path from 'path';
import VeracodeClient from '@jupiterone/veracode-client';
import log from './log';


class Connector {
  constructor(options = {}) {
    const defaults = {
      robotId: process.env.VERA_ID,
      robotKey: process.env.VERA_KEY,
      appId: process.env.VERA_APP_ID,
      appName: process.env.VERA_APP_NAME,
      appVersion: process.env.npm_package_version,
      sandboxName: process.env.npm_package_name,
      excludes: ['node_modules/**/*'],
      scanAllNonfatalTopLevelModules: false,
      autoScan: true,
    };

    this.robotId = options.robotId || defaults.robotId;
    this.robotKey = options.robotKey || defaults.robotKey;
    this.appId = options.appId || defaults.appId;
    this.appName = options.appName || defaults.appName;
    this.appVersion = options.appVersion || defaults.appVersion;
    this.sandboxName = options.sandboxName || defaults.sandboxName;
    this.excludes = options.excludes || defaults.excludes;
    this.scanAllNonfatalTopLevelModules = typeof options.scanAllNonfatalTopLevelModules === 'boolean'
      ? options.scanAllNonfatalTopLevelModules : defaults.scanAllNonfatalTopLevelModules;
    this.autoScan = typeof options.autoScan === 'boolean' ? options.autoScan : defaults.autoScan;

    // console.log('robotId:', this.robotId);
    // console.log('robotKey:', this.robotKey);
    console.log('-----');
    console.log('PROPS');
    console.log('-----');
    console.log('appId:', this.appId);
    console.log('appName:', this.appName);
    console.log('appVersion:', this.appVersion);
    console.log('sandboxName:', this.sandboxName);
    console.log('excludes:', this.excludes);
    console.log('scanAllNonfatalTopLevelModules:', this.scanAllNonfatalTopLevelModules);
    console.log('autoScan:', this.autoScan);
    console.log('-----');

    this._validatePropSet('robotId');
    this._validatePropSet('robotKey');

    this.client = new VeracodeClient(
      this.robotId,
      this.robotKey,
    );
  }

  async scanInSandbox() {
    this._validatePropSet('appVersion');
    this._validatePropSet('sandboxName');

    await this._initAppId();
    this._validatePropSet('appId');
    log.info(`Using appId: ${this.appId}`);

    const appInfo = {
      appId: this.appId,
      appVersion: this.appVersion,
      autoScan: this.autoScan,
      scanAllNonfatalTopLevelModules: this.scanAllNonfatalTopLevelModules,
    };

    const hasSandbox = (await this.client.getSandboxList(appInfo)).some((sb) => {
      const isMatch = sb._attributes.sandbox_name === this.sandboxName;
      if (isMatch) {
        appInfo.sandboxId = sb._attributes.sandbox_id;
      }
      return isMatch;
    });

    if (!hasSandbox) {
      log.info(`Need to setup new sandbox for ${this.sandboxName}`);
      appInfo.sandboxName = this.sandboxName;
      appInfo.sandboxId = (await this.client.createSandbox(appInfo)).sandbox._attributes.sandbox_id;
      log.info(`New sandbox created, id: ${appInfo.sandboxId}`);
    }

    log.info(`Setting up new scan for ${this.sandboxName}, sandbox_id: ${appInfo.sandboxId}`);
    try {
      const buildId = (await this.client.createBuild(appInfo)).build._attributes.build_id;
      log.info(`New Build ID: ${buildId}`);
    } catch (err) {
      log.warn(`Failed to create a new release-versioned scan for ${this.sandboxName}; ${err}`);
      log.warn('> Will try to scan as an auto-versioned scan...');
    }

    appInfo.file = path.join(os.tmpdir(), `${this.sandboxName.replace(/\W/g, '')}.zip`);
    await this.client.createZipArchive(`${process.cwd()}`, appInfo.file, this.excludes);
    const fileId = (await this.client.uploadFile(appInfo)).file._attributes.file_id;
    log.info(`New File ID: ${fileId}`);

    const scanVersion = (await this.client.beginPrescan(appInfo)).build._attributes.version;
    log.info(`New Scan Version: ${scanVersion}`);
  }

  _validatePropSet(propName) {
    if (!this[propName]) {
      throw new Error(`Property ${propName} was not set. Cannot continue.`);
    }
  }

  async _initAppId() {
    if (!this.appId && this.appName) {
      (await this.client.getAppList()).some((app) => {
        const isMatch = app._attributes.app_name === this.appName;
        if (isMatch) {
          this.appId = app._attributes.app_id;
        }
        return isMatch;
      });
    }
  }
}

export default Connector;
