module.exports = {
    branches: ['master'],
    repositoryUrl: 'git@github.com:flybywiresim/igniter.git',
    plugins: [
      ['@semantic-release/exec', { prepareCmd: 'npm run build' }],
      ['@semantic-release/github', { assets: 'dist/**/*.js' }],
      '@semantic-release/release-notes-generator',
      '@semantic-release/commit-analyzer',
      '@semantic-release/npm',
    ],
  };
