[![Gitpod Ready-to-Code](https://img.shields.io/badge/Gitpod-Ready--to--Code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/tveal/veracode-ci) 

# Veracode CI

Goal: Provide a command-line tool to use in NPM scripts for
triggering Veracode scans in a CI/CD setting.

## Usage

**Prerequisites**
- Have `VERA_ID` and `VERA_KEY` environment variables defined with valid
    Veracode API Credentials

**Setup in NPM Project**
1. Install as a dev dependency

    ```bash
    npm i -D veracode-ci
    ```
2. In the `scripts` block of your package.json, add a veracode script
    ```json
    {
        ...
        "scripts": {
            ...
            "veracode": "veracode --sandbox --appName=<your-veracode-app-name>"
        },
        ...
    }
    ```
3. Run the veracode script
    ```bash
    npm run veracode
    ```

## Excluding Folders/Files

Additionally, you can specify your own excludes. By default, this package zips up
everything in the current-working-directory of your project (where the package.json is)
_excluding_ the **node_modules** folder. You can overwrite this excludes by adding a
comma-delimited value like so:
```bash
veracode --sandbox --appName=<your-veracode-app-name> --excludes='node_modules/**/*,lib/**/*'
```

## Command-line Options

| FLAG | VALUE | DESCRIPTION |
|------|-------|-------------|
|`sandbox`|none|Trigger a veracode scan in a sandbox under a provided (existing) app
|`excludes`|comma-delimited string|Override what folders/files are excluded from the project for scanning. Defaults to `node_modules/**/*`.
|`appId`|integer|Veracode App ID to run the scans under. _Must have appId OR appName specified_
|`appName`|string|Veracode App Name to run the scans under. _Must have appId OR appName specified_
|`scanAllNonfatalTopLevelModules`|true or **false**|See Veracode doc for [beginprescan.do](https://help.veracode.com/reader/LMv_dtSHyb7iIxAQznC~9w/PX5ReM5acqjM~IOVEg2~rA)
|`autoScan`|**true** or false|See Veracode doc for [beginprescan.do](https://help.veracode.com/reader/LMv_dtSHyb7iIxAQznC~9w/PX5ReM5acqjM~IOVEg2~rA)

## Useful Resources
- [Veracode API Doc](https://help.veracode.com/reader/LMv_dtSHyb7iIxAQznC~9w/G1Nd5yH0QSlT~vPccPhtRQ)
- [Veracode Packaging Instructions for JavaScript and TypeScript](https://help.veracode.com/reader/4EKhlLSMHm5jC8P8j3XccQ/AM8PAkQKwsHbNYXy2VeX5Q)
- [JavaScript @jupiterone/veracode-client](https://www.npmjs.com/package/@jupiterone/veracode-client)