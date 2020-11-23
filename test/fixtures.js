
const createAppObject = (name, id) => ({
  _attributes: {
    app_name: `${name}-${id}`,
    app_id: id,
  },
});

const createSandboxObject = (name, id) => ({
  _attributes: {
    sandbox_name: `${name}-${id}`,
    sandbox_id: id,
  },
});

export const VERA_APP_LIST = [
  createAppObject('test-app', 1),
  createAppObject('test-app', 2),
  createAppObject('test-app', 3),
];

export const VERA_SANDBOX_LIST = [
  createSandboxObject('test-sandbox', 11),
  createSandboxObject('test-sandbox', 22),
  createSandboxObject('test-sandbox', 33),
  createSandboxObject('@myscope/test-sandbox', 44),
];

export const VERA_SANDBOX_OBJ = {
  sandbox: {
    _attributes: {
      sandbox_id: 9876,
    },
  },
};

export const VERA_BUILD_OBJ = {
  build: {
    _attributes: {
      build_id: 1234,
    },
  },
};

export const VERA_FILE_OBJ = {
  file: {
    _attributes: {
      file_id: 2345,
    },
  },
};

export const VERA_PRESCAN_OBJ = {
  build: {
    _attributes: {
      version: 'Scan Dec 24 2019 (1)',
    },
  },
};
