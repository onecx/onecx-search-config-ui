const { ModifyEntryPlugin } = require('@angular-architects/module-federation/src/utils/modify-entry-plugin')
const { share, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack')

const config = withModuleFederationPlugin({
  name: 'onecx-search-config-ui',
  filename: 'remoteEntry.js',
  exposes: {
    './OneCXSearchConfigComponent': 'src/app/remotes/search-config/search-config.component.bootstrap.ts',
    './OneCXColumnGroupSelectionComponent':
      'src/app/remotes/column-group-selection/column-group-selection.component.bootstrap.ts'
  },
  shared: share({
    '@angular/core': { requiredVersion: 'auto', includeSecondaries: true },
    '@angular/forms': {
      requiredVersion: 'auto',
      includeSecondaries: true
    },
    '@angular/common': {
      requiredVersion: 'auto',
      includeSecondaries: {
        skip: ['@angular/common/http/testing']
      }
    },
    '@angular/common/http': {
      requiredVersion: 'auto',
      includeSecondaries: true
    },
    rxjs: { requiredVersion: 'auto', includeSecondaries: true },
    '@ngx-translate/core': { requiredVersion: 'auto' },
    '@onecx/accelerator': { requiredVersion: 'auto', includeSecondaries: true },
    '@onecx/angular-accelerator': {
      requiredVersion: 'auto',
      includeSecondaries: true
    },
    '@onecx/angular-auth': {
      requiredVersion: 'auto',
      includeSecondaries: true
    },
    '@onecx/angular-webcomponents': {
      requiredVersion: 'auto',
      includeSecondaries: true
    },
    '@onecx/angular-integration-interface': {
      requiredVersion: 'auto',
      includeSecondaries: true
    },
    '@onecx/angular-remote-components': {
      requiredVersion: 'auto',
      includeSecondaries: true
    },
    '@onecx/angular-testing': {
      requiredVersion: 'auto',
      includeSecondaries: true
    },
    '@onecx/integration-interface': {
      requiredVersion: 'auto',
      includeSecondaries: true
    },
    // '@onecx/keycloak-auth': {
    //   requiredVersion: 'auto',
    //   includeSecondaries: true
    // },
    '@onecx/portal-integration-angular': {
      requiredVersion: 'auto',
      includeSecondaries: true
    },
    '@onecx/portal-layout-styles': {
      requiredVersion: 'auto',
      includeSecondaries: true
    },
    primeng: { requiredVersion: 'auto', includeSecondaries: true }
  }),
  sharedMappings: ['@onecx/portal-integration-angular']
})
config.devServer = {
  allowedHosts: 'all'
}

const plugins = config.plugins.filter((plugin) => !(plugin instanceof ModifyEntryPlugin))

module.exports = {
  ...config,
  plugins,
  output: {
    uniqueName: 'onecx-search-config-ui',
    publicPath: 'auto'
  },
  experiments: {
    ...config.experiments,
    topLevelAwait: true
  },
  optimization: {
    runtimeChunk: false,
    splitChunks: false
  }
}