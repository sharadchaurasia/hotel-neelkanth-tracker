module.exports = {
  apps: [{
    name: "hotel-api",
    script: "./dist/src/main.js",
    node_args: "-r dotenv/config",
    cwd: "/var/www/hotel-neelkanth/backend",
  }],
};
