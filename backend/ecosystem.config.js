module.exports = {
  apps: [{
    name: "hotel-api",
    script: "./dist/main.js",
    node_args: "-r dotenv/config",
    cwd: "/var/www/hotel-neelkanth/backend",
  }],
};
