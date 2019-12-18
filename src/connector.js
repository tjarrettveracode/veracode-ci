import os from 'os';
import path from 'path';
import VeracodeClient from '@jupiterone/veracode-client';

const defaults = {
  robotId: process.env.VERA_ID,
  robotKey: process.env.VERA_KEY,
  appId: process.env.VERA_APP_ID,
  appName: process.env.VERA_APP_NAME,
  appVersion: process.env.npm_package_version,
  sandboxName: process.env.npm_package_name,
  excludes: [ 'node_modules/**/*' ],
};

class Connector {
  constructor(options = {}) {
    this.robotId = options.robotId || defaults.robotId;
    this.robotKey = options.robotKey || defaults.robotKey;
    this.appId = options.appId || defaults.appId;
    this.appName = options.appName || defaults.appName;
    this.appVersion = options.appVersion || defaults.appVersion;
    this.sandboxName = options.sandboxName || defaults.sandboxName;
    this.excludes = options.excludes || defaults.excludes;

    this._validatePropSet('robotId');
    this._validatePropSet('robotKey');

    this.client = new VeracodeClient(
      this.robotId,
      this.robotKey
    );
  }
  
  async scanInSandbox() {
    this._validatePropSet('appVersion');
    this._validatePropSet('sandboxName');

    await this._initAppId();
    this._validatePropSet('appId');
    console.log(`Using appId: ${this.appId}`);
    
    const appInfo = {
      appId: this.appId,
      appVersion: this.appVersion,
      autoScan: true,
    };

    const hasSandbox = (await this.client.getSandboxList(appInfo)).some((sb) => {
      const isMatch = sb._attributes.sandbox_name === this.sandboxName;
      if (isMatch) {
        appInfo.sandboxId = sb._attributes.sandbox_id;
      }
      return isMatch;
    });

    if (!hasSandbox) {
      console.log(`Need to setup new sandbox for ${this.sandboxName}`);
      appInfo.sandboxName = this.sandboxName;
      appInfo.sandboxId = (await this.client.createSandbox(appInfo)).sandbox._attributes.sandbox_id;
      console.log(`New sandbox created, id: ${appInfo.sandboxId}`);
    }

    console.log(`Setting up new scan for ${this.sandboxName}, sandbox_id: ${appInfo.sandboxId}`);
    try {
      const buildId = (await this.client.createBuild(appInfo)).build._attributes.build_id;
      console.log('New Build ID:', buildId);
    } catch (err) {
      console.log(`Failed to create a new release-versioned scan for ${this.sandboxName}; ${err}`);
      console.log('> Will try to scan as an auto-versioned scan...');
    }

    appInfo.file = path.join(os.tmpdir(), `${this.sandboxName}.zip`);
    await this.client.createZipArchive(`${process.cwd()}`, appInfo.file, this.excludes);
    const fileId = (await this.client.uploadFile(appInfo)).file._attributes.file_id;
    console.log('New File ID:', fileId);

    const scanVersion = (await this.client.beginPrescan(appInfo)).build._attributes.version;
    console.log('New Scan Version:', scanVersion);
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
      });

    }
  }
}

export default Connector;