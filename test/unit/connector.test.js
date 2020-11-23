import 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import os from 'os';
import VeracodeClient from '@jupiterone/veracode-client';

import Connector from '../../src/connector';
import log from '../../src/log';
import {
  VERA_APP_LIST,
  VERA_SANDBOX_LIST,
  VERA_SANDBOX_OBJ,
  VERA_BUILD_OBJ,
  VERA_FILE_OBJ,
  VERA_PRESCAN_OBJ,
} from '../fixtures';

const getMockedClient = () => sinon.createStubInstance(VeracodeClient, {
  getAppList: Promise.resolve(VERA_APP_LIST),
  getSandboxList: Promise.resolve(VERA_SANDBOX_LIST),
  createSandbox: Promise.resolve(VERA_SANDBOX_OBJ),
  createBuild: Promise.resolve(VERA_BUILD_OBJ),
  createZipArchive: () => console.log('called createZipArchive'),
  uploadFile: Promise.resolve(VERA_FILE_OBJ),
  beginPrescan: Promise.resolve(VERA_PRESCAN_OBJ),
});
const env = { ...process.env };

describe('connector.js', () => {
  let logInfoStub;
  let logWarnStub;
  beforeEach(() => {
    process.env = {};

    logInfoStub = sinon.stub(log, 'info');
    logWarnStub = sinon.stub(log, 'warn');
    sinon.stub(os, 'tmpdir').returns('/tmp/test');
  });
  afterEach(() => {
    process.env = { ...env };
    sinon.restore();
  });
  describe('Constructor', () => {
    it('should have default values for minimal env variables', () => {
      const robotId = 'test-robot-id';
      const robotKey = 'test-robot-key';

      process.env.VERA_ID = robotId;
      process.env.VERA_KEY = robotKey;

      const cx = new Connector();

      expect(cx.robotId).to.equal(robotId);
      expect(cx.robotKey).to.equal(robotKey);
      expect(cx.appId).to.equal(undefined);
      expect(cx.appName).to.equal(undefined);
      expect(cx.appVersion).to.equal(undefined);
      expect(cx.sandboxName).to.equal(undefined);
      expect(cx.excludes).to.deep.equal(['node_modules/**/*']);
      expect(cx.scanAllNonfatalTopLevelModules).to.equal(false);
      expect(cx.autoScan).to.equal(true);
    });
    it('should default appId to env variable', () => {
      const appId = 'test-app-id';

      process.env.VERA_ID = 'test-robot-id';
      process.env.VERA_KEY = 'test-robot-key';
      process.env.VERA_APP_ID = appId;

      const cx = new Connector();

      expect(cx.appId).to.equal(appId);
    });
    it('should default appName to env variable', () => {
      const appName = 'test-app-name';

      process.env.VERA_ID = 'test-robot-id';
      process.env.VERA_KEY = 'test-robot-key';
      process.env.VERA_APP_NAME = appName;

      const cx = new Connector();

      expect(cx.appName).to.equal(appName);
    });
    it('should default appVersion to env variable', () => {
      const appVersion = 'test-app-version';

      process.env.VERA_ID = 'test-robot-id';
      process.env.VERA_KEY = 'test-robot-key';
      process.env.npm_package_version = appVersion;

      const cx = new Connector();

      expect(cx.appVersion).to.equal(appVersion);
    });
    it('should default sandboxName to env variable', () => {
      const sandboxName = 'test-sandbox-name';

      process.env.VERA_ID = 'test-robot-id';
      process.env.VERA_KEY = 'test-robot-key';
      process.env.npm_package_name = sandboxName;

      const cx = new Connector();

      expect(cx.sandboxName).to.equal(sandboxName);
    });
    it('should set everything from options', () => {
      const options = {
        robotId: 'options robot id',
        robotKey: 'options robot key',
        appId: 'options app id',
        appName: 'options app name',
        appVersion: 'options app version',
        sandboxName: 'options sandbox name',
        excludes: ['lib'],
        scanAllNonfatalTopLevelModules: true,
        autoScan: false,
      };

      const cx = new Connector(options);

      expect(cx.robotId).to.equal(options.robotId);
      expect(cx.robotKey).to.equal(options.robotKey);
      expect(cx.appId).to.equal(options.appId);
      expect(cx.appName).to.equal(options.appName);
      expect(cx.appVersion).to.equal(options.appVersion);
      expect(cx.sandboxName).to.equal(options.sandboxName);
      expect(cx.excludes).to.deep.equal(options.excludes);
      expect(cx.scanAllNonfatalTopLevelModules).to.equal(true);
      expect(cx.autoScan).to.equal(false);
    });
    it('should throw error if no VERA_ID set', () => {
      process.env.VERA_KEY = 'test robotic key';

      let expectedError = null;
      try {
        // eslint-disable-next-line
        const cx = new Connector();
      } catch (err) {
        expectedError = err;
      }

      expect(expectedError.message).to.equal('Property robotId was not set. Cannot continue.');
    });
    it('should throw error if no VERA_KEY set', () => {
      process.env.VERA_ID = 'test robotic id';

      let expectedError = null;
      try {
        // eslint-disable-next-line
        const cx = new Connector();
      } catch (err) {
        expectedError = err;
      }

      expect(expectedError.message).to.equal('Property robotKey was not set. Cannot continue.');
    });
  });
  describe('scanInSandbox', () => {
    describe('Required data checks', () => {
      it('should throw error if no appVersion', async () => {
        const options = {
          robotId: 'test-robot-id',
          robotKey: 'test-robot-key',
        };

        let err = null;
        try {
          const cx = new Connector(options);
          await cx.scanInSandbox();
        } catch (e) {
          err = e;
        }

        expect(err.message).to.equal('Property appVersion was not set. Cannot continue.');
      });
      it('should throw error if no sandboxName', async () => {
        const options = {
          robotId: 'test-robot-id',
          robotKey: 'test-robot-key',
          appVersion: '0.1.0',
        };

        let err = null;
        try {
          const cx = new Connector(options);
          await cx.scanInSandbox();
        } catch (e) {
          err = e;
        }

        expect(err.message).to.equal('Property sandboxName was not set. Cannot continue.');
      });
      it('should throw error if no appId or appName', async () => {
        const options = {
          robotId: 'test-robot-id',
          robotKey: 'test-robot-key',
          appVersion: '0.1.0',
          sandboxName: 'test-sandbox-name',
        };

        let err = null;
        try {
          const cx = new Connector(options);
          await cx.scanInSandbox();
        } catch (e) {
          err = e;
        }

        expect(err.message).to.equal('Property appId was not set. Cannot continue.');
      });
    });
    it('should trigger new scan for existing sandbox', async () => {
      const options = {
        robotId: 'test-robot-id',
        robotKey: 'test-robot-key',
        appVersion: '0.1.0',
        sandboxName: '@myscope/test-sandbox-44',
        appName: 'test-app-2',
      };

      const cx = new Connector(options);
      cx.client = getMockedClient();
      await cx.scanInSandbox();

      expect(logInfoStub).calledWith('Using appId: 2');
      expect(logInfoStub).calledWith('Setting up new scan for @myscope/test-sandbox-44, sandbox_id: 44');
      expect(logInfoStub).calledWith('New Build ID: 1234');
      expect(logInfoStub).calledWith('New File ID: 2345');
      expect(logInfoStub).calledWith('New Scan Version: Scan Dec 24 2019 (1)');

      // getSandboxList is called with a mutable object, appInfo,
      // so the spy compares the final state of the object here, instead of
      // what is called before certain mutations
      expect(cx.client.getSandboxList).calledWith({
        appId: 2,
        appVersion: '0.1.0',
        autoScan: true,
        scanAllNonfatalTopLevelModules: false,
        sandboxId: 44,
        file: '/tmp/test/myscopetestsandbox44.zip',
      });
    });
    it('should create new sandbox and trigger scan', async () => {
      const options = {
        robotId: 'test-robot-id',
        robotKey: 'test-robot-key',
        appVersion: '0.1.0',
        sandboxName: 'test-sandbox-44',
        appName: 'test-app-3',
      };

      const cx = new Connector(options);
      cx.client = getMockedClient();
      await cx.scanInSandbox();

      expect(logInfoStub).calledWith('Using appId: 3');
      expect(logInfoStub).calledWith('Need to setup new sandbox for test-sandbox-44');
      expect(logInfoStub).calledWith('New sandbox created, id: 9876');
      expect(logInfoStub).calledWith('Setting up new scan for test-sandbox-44, sandbox_id: 9876');
      expect(logInfoStub).calledWith('New Build ID: 1234');
      expect(logInfoStub).calledWith('New File ID: 2345');
      expect(logInfoStub).calledWith('New Scan Version: Scan Dec 24 2019 (1)');
    });
    it('should continue to trigger new scan for existing sandbox when named build already exists', async () => {
      const options = {
        robotId: 'test-robot-id',
        robotKey: 'test-robot-key',
        appVersion: '0.1.0',
        sandboxName: 'test-sandbox-22',
        appName: 'test-app-2',
      };
      const errMsg = 'Cannot create new build for 0.1.0 as it already exists.';

      const cx = new Connector(options);
      cx.client = getMockedClient();
      cx.client.createBuild = () => Promise.reject(new Error(errMsg));
      await cx.scanInSandbox();

      expect(logInfoStub).calledWith('Using appId: 2');
      expect(logInfoStub).calledWith('Setting up new scan for test-sandbox-22, sandbox_id: 22');
      expect(logWarnStub).calledWith(`Failed to create a new release-versioned scan for test-sandbox-22; Error: ${errMsg}`);
      expect(logWarnStub).calledWith('> Will try to scan as an auto-versioned scan...');
      expect(logInfoStub).calledWith('New File ID: 2345');
      expect(logInfoStub).calledWith('New Scan Version: Scan Dec 24 2019 (1)');
    });
  });
});
